// orchestrator.js (최종 통합 버전)

// 환경 변수 로드 (.env 파일 지원)
require('dotenv').config();

const path = require('path');

// 필요한 에이전트 모듈들을 불러옵니다.
// 이 파일들은 orchestrator.js와 같은 폴더에 있어야 합니다.
const { analyzeCodebase } = require('./AnalyzerAgent');
const { runDockerBuildAndMount } = require('./BuilderAgent');
const { deployToWebServer } = require('./DeployAgent');
const { debugAndFixCode } = require('./DebuggerAgent');

// 사용 가능한 프로젝트 목록 (실제 프로젝트 경로 포함)
const AVAILABLE_PROJECTS = [
    'task/html5',
    'task/react/react-18',  // 실제 프로젝트 경로
    'task/react/react-17',
    'task/react/react-16',
    'task/vue3'
];

// 랜덤하게 프로젝트 선택
function selectRandomProject() {
    const randomIndex = Math.floor(Math.random() * AVAILABLE_PROJECTS.length);
    return AVAILABLE_PROJECTS[randomIndex];
}

// 프로젝트 디렉토리 정의 (랜덤 선택)
const PROJECT_DIR_NAME = selectRandomProject();

// 최대 수정 시도 횟수
const MAX_ATTEMPTS = 10;

/**
 * 🤖 다중 LLM 에이전트 배포 파이프라인의 핵심 제어 함수
 */
async function runDeploymentPipeline() {
    console.log("=== 🤖 다중 LLM 에이전트 배포 파이프라인 시작 ===");
    console.log(`🎲 랜덤 선택된 프로젝트: ${PROJECT_DIR_NAME}`);
    
    // 원본 프로젝트의 절대 경로
    const originalPath = path.join(__dirname, PROJECT_DIR_NAME);
    
    let buildSuccess = false;
    let artifactPath = '';
    let currentProjectPath = originalPath;
    let currentPlan = null;
    let attempt = 1;

    try {
        // 1. 초기 분석 실행 (비동기)
        console.log(`\n📋 [라운드 0] 초기 프로젝트 분석 시작...`);
        currentPlan = await analyzeCodebase(currentProjectPath);
        console.log(`\n🔍 [AnalyzerAgent]: 초기 계획 수립 완료. 유형: ${currentPlan.type}`);

        while (attempt <= MAX_ATTEMPTS && !buildSuccess) {
            console.log(`\n=================================================`);
            console.log(`   🔁 [라운드 ${attempt}] 빌드 시도 #${attempt} 시작 (프로젝트 경로: ${currentProjectPath})`);
            console.log(`=================================================`);
            
            try {
                // 2. 🏗️ 빌드 및 실행 에이전트 호출
                // 성공 시 artifactPath를 받고 루프 탈출
                artifactPath = await runDockerBuildAndMount(currentPlan);
                buildSuccess = true;
                break; 

            } catch (error) {
                console.error(`\n🛑 [Attempt ${attempt}] 빌드 실패 감지.`);
                console.error(`   에러 내용: ${error.message || error}`);
                
                if (attempt === MAX_ATTEMPTS) {
                    throw new Error(`최대 수정 시도 횟수(${MAX_ATTEMPTS}회)를 초과했습니다. 자동 조치 실패.`);
                }

                // 3. 🩹 디버깅 및 수정 에이전트 호출
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
            await deployToWebServer(artifactPath || currentPlan.sourceMountPath, currentPlan.type);
            console.log("\n=== 🎉 전체 파이프라인 성공적으로 완료됨 ===");
            console.log(`최종 배포된 프로젝트 경로: ${currentProjectPath}`);
        }

    } catch (error) {
        console.log("\n❌ 최종 실패: 자동 빌드 및 디버깅에 실패했습니다.");
        console.error(`최종 오류: ${error.message}`);
        if (error.stack) {
            console.error(`스택 트레이스:\n${error.stack}`);
        }
        console.log("=================================================");
        process.exit(1);
    }
}

// 마스터 에이전트 실행 시작
runDeploymentPipeline().catch((error) => {
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