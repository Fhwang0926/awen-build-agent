// 환경 변수 로드 (.env 파일 지원)
require('dotenv').config();
const path = require('path');

// 필요한 에이전트 모듈들을 불러옵니다.
// 이 파일들은 orchestrator.js와 같은 폴더에 있어야 합니다.
const { analyzeCodebase } = require('./AnalyzerAgent');
const { runDockerBuildAndMount } = require('./BuilderAgent');
const { deployToWebServer } = require('./DeployAgent');
const { debugAndFixCode } = require('./DebuggerAgent');
const { getBuildTask, reportBuildResult } = require('./api.js');
const simpleGit = require('simple-git');

// 최대 수정 시도 횟수
const MAX_ATTEMPTS = 1;

// Git 저장소를 특정 경로로 클론하는 함수
async function gitClone(repo_url, token, targetPath) {
    try {
        console.log(`🚚 Git 클론 시작: ${repo_url} -> ${targetPath}`);

        const git = simpleGit();
        const authRepoUrl = repo_url.replace(
            'https://',
            `https://x-access-token:${token}@`
        );
        await git.clone(authRepoUrl, targetPath);

        console.log('✅ Git clone 완료');
    } catch (error) {
        console.error('❌ Clone 중 에러 발생:', error);
        throw error;
    }
}

/**
 * 에러 원인 판별 함수 (서비스 문제 OR 사용자 문제)
 * 모든 재시도 후에도 실패한 경우 호출
 * 
 * @param {Error} error 
 * @return {string} 'USER_ERROR' | 'SERVICE_ERROR'
 */
async function determineErrorType(error) {
    const errorMessage = error.message;

    // TODO: 에러 메세지 분석 로직 추가 필요
    // 모듈, 코드, 버전, 환경 설정 문제 등 -> 사용자 문제
    // 그 외는 서비스 문제
}

// 빌드 파이프라인 실행
async function runDeploymentPipeline(targetPath) {
    console.log("=== 🤖 다중 LLM 에이전트 배포 파이프라인 시작 ===");
    console.log(`선택된 프로젝트: ${targetPath}`);

    let buildSuccess = false;
    let artifactPath = '';
    let currentProjectPath = targetPath;
    let currentPlan = null;
    let attempt = 1;
    let step = '';
    const logs = {
        summary: '',
        error: ''
    };

    try {
        // 1. 초기 분석 실행 (비동기)
        step = 'ANALYSIS';
        console.log(`\n📋 [라운드 0] 초기 프로젝트 분석 시작...`);
        currentPlan = await analyzeCodebase(currentProjectPath);
        console.log(`\n🔍 [AnalyzerAgent]: 초기 계획 수립 완료. 유형: ${currentPlan.type}`);

        while (attempt <= MAX_ATTEMPTS && !buildSuccess) {
            console.log(`\n=================================================`);
            console.log(`   🔁 [라운드 ${attempt}] 빌드 시도 #${attempt} 시작 (프로젝트 경로: ${currentProjectPath})`);
            console.log(`=================================================`);

            try {
                // 2. 🏗️ 빌드 및 실행 에이전트 호출
                step = 'BUILD';
                artifactPath = await runDockerBuildAndMount(currentPlan);
                buildSuccess = true;
                break;

            } catch (error) {
                console.error(`\n🛑 [Attempt ${attempt}] 빌드 실패 감지.`);
                console.error(`   에러 내용: ${error.message || error}`);

                if (attempt === MAX_ATTEMPTS) {
                    // 에러 원인 판별 함수 호출 위치
                    throw new Error(`최대 수정 시도 횟수(${MAX_ATTEMPTS}회)를 초과했습니다. 자동 조치 실패.`);
                }

                // 3. 🩹 디버깅 및 수정 에이전트 호출
                step = 'DEBUG';
                console.log(`\n📋 [라운드 ${attempt}] 문제 해결 및 코드 수정 시작...`);
                console.log(`   -> DebuggerAgent 호출 및 수정 시도...`);

                try {
                    // DebuggerAgent는 수정된 코드를 새 폴더에 저장하고, 빌드 테스트 후 새 경로를 반환합니다.
                    const modifiedProjectPath = await debugAndFixCode(currentProjectPath, error, currentPlan);

                    // 수정된 프로젝트로 경로와 계획 업데이트
                    currentProjectPath = modifiedProjectPath;

                    // npm ci 에러인 경우 빌드 명령어 자동 수정
                    const errorMessage = error.message || error.toString();
                    if (errorMessage.includes('npm ci') &&
                        (errorMessage.includes('in sync') || errorMessage.includes('does not satisfy'))) {
                        console.log(`   -> 빌드 명령어 자동 수정: npm ci → npm install`);
                        currentPlan.buildCommand = currentPlan.buildCommand.replace(/npm ci/g, 'npm install');
                    }

                    // 수정된 코드를 기반으로 AnalyzerAgent 재실행 (계획이 변경될 수 있음)
                    console.log(`\n📋 [라운드 ${attempt}] 수정된 프로젝트 재분석 시작...`);
                    try {
                        currentPlan = await analyzeCodebase(currentProjectPath);
                        // 재분석 후에도 빌드 명령어가 npm ci면 npm install로 변경
                        if (currentPlan.buildCommand.includes('npm ci')) {
                            currentPlan.buildCommand = currentPlan.buildCommand.replace(/npm ci/g, 'npm install');
                            console.log(`   -> 재분석 후 빌드 명령어 수정: npm ci → npm install`);
                        }
                    } catch (analyzeError) {
                        console.error(`   ⚠️ 재분석 실패: ${analyzeError.message}`);
                        console.log(`   -> 기존 계획으로 계속 진행...`);
                        // 기존 계획 유지하되 빌드 명령어는 수정
                        if (currentPlan.buildCommand.includes('npm ci')) {
                            currentPlan.buildCommand = currentPlan.buildCommand.replace(/npm ci/g, 'npm install');
                        }
                    }

                    attempt++;
                    console.log(`   -> DebuggerAgent 완료. 수정된 코드로 빌드 재시도 준비...`);
                } catch (debugError) {
                    console.error(`   ❌ DebuggerAgent 실행 중 오류: ${debugError.message}`);
                    console.error(`   스택: ${debugError.stack}`);
                    console.log(`   -> 원본 프로젝트로 재시도...`);
                    attempt++;
                    // 원본 프로젝트로 계속 시도
                }
            }
        }

        // 4. 🚀 빌드 성공 시 배포 에이전트 호출
        if (buildSuccess) {
            step = 'DEPLOY';
            await deployToWebServer(artifactPath || currentPlan.sourceMountPath, currentPlan.type);
            console.log("\n=== 🎉 전체 파이프라인 성공적으로 완료됨 ===");
            console.log(`최종 배포된 프로젝트 경로: ${currentProjectPath}`);
        }

        return {
            status: 'SUCCESS',
            step: step,
            logs: {
                summary: `전체 파이프라인 완료`
            },
            deploy_info: {
                currentProjectPath: currentProjectPath,
                artifactDir: currentPlan.artifactDir,
                artifactPath: artifactPath,
            },
        };

    } catch (error) {
        console.log("\n❌ 최종 실패: 자동 빌드 및 디버깅에 실패했습니다.");
        console.error(`최종 오류: ${error.message}`);
        if (error.stack) {
            console.error(`스택 트레이스:\n${error.stack}`);
        }
        console.log("=================================================");

        logs.summary = `자동 빌드 및 디버깅 실패`;

        // 단계별 에러 메세지
        if (step === 'ANALYSIS' || step === 'BUILD') {
            logs.error = `error_message: ${error.message}\nstack_trace: ${error.stack}`;
        }

        if (step === 'DEBUG') {
            logs.error = error.message;
            //TODO: 디버깅 에러 메세지 추가 (문제의 파일, 라인 등)
        }

        if (step === 'DEPLOY') {
            logs.error = error.message;
        }

        return {
            status: 'FAILED',
            step: step,
            logs: logs
        };
    }
}

// 클론 및 빌드 실행 함수
async function buildProject() {
    try {
        const task = await getBuildTask();

        const repoName = task.repo_url.split('/').pop().replace('.git', '');
        const targetPath = path.join(__dirname, 'cloned_projects', `${repoName}-${Date.now()}`);

        // Git Clone 수행
        await gitClone(task.repo_url, task.token, targetPath);

        // 빌드 수행
        const startTime = new Date();
        const buildResult = await runDeploymentPipeline(targetPath);
        const endTime = new Date();

        const payload = {
            ...buildResult,
            task_id: task.id,
            user_id: task.user_id,
            hosting_id: task.hosting_id,
            duration_ms: endTime - startTime,
        };

        // 결과 보고
        await reportBuildResult(payload);

    } catch (error) {
        console.error('❌ 빌드 중 에러 발생:', error);
        throw error;
    }
}

// 마스터 에이전트 실행 시작
buildProject().catch((error) => {
    console.error("\n💥 치명적 오류: 파이프라인 실행 중 예기치 않은 오류 발생");
    console.error(`오류: ${error.message}`);
    if (error.stack) {
        console.error(`스택:\n${error.stack}`);
    }
    process.exit(1);
});

// 처리되지 않은 예외 처리
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 처리되지 않은 Promise 거부:', reason);
    if (reason instanceof Error) {
        console.error('스택:', reason.stack);
    }
});

process.on('uncaughtException', (error) => {
    console.error('\n💥 처리되지 않은 예외:', error.message);
    console.error('스택:', error.stack);
    process.exit(1);
});