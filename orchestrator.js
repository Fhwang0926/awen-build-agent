// orchestrator.js (최종 통합 버전)

const path = require('path');

// 필요한 에이전트 모듈들을 불러옵니다.
// 이 파일들은 orchestrator.js와 같은 폴더에 있어야 합니다.
const { analyzeCodebase } = require('./AnalyzerAgent');
const { runDockerBuildAndMount } = require('./BuilderAgent');
const { deployToWebServer } = require('./DeployerAgent');
const { debugAndFixCode } = require('./DebuggerAgent');

// 프로젝트 디렉토리 정의 (예시)
const PROJECT_DIR_NAME = 'my-poc-project';

// 최대 수정 시도 횟수
const MAX_ATTEMPTS = 3;

/**
 * 🤖 다중 LLM 에이전트 배포 파이프라인의 핵심 제어 함수
 */
async function runDeploymentPipeline() {
    console.log("=== 🤖 다중 LLM 에이전트 배포 파이프라인 시작 ===");
    
    // 원본 프로젝트의 절대 경로
    const originalPath = path.join(__dirname, PROJECT_DIR_NAME);
    
    let buildSuccess = false;
    let artifactPath = '';
    let currentProjectPath = originalPath;
    let currentPlan = null;
    let attempt = 1;

    try {
        // 1. 초기 분석 실행
        currentPlan = analyzeCodebase(currentProjectPath);
        console.log(`\n🔍 [AnalyzerAgent]: 초기 계획 수립 완료. 유형: ${currentPlan.type}`);

        while (attempt <= MAX_ATTEMPTS && !buildSuccess) {
            console.log(`\n=================================================`);
            console.log(`   🔁 빌드 시도 #${attempt} 시작 (프로젝트 경로: ${currentProjectPath})`);
            console.log(`=================================================`);
            
            try {
                // 2. 🏗️ 빌드 및 실행 에이전트 호출
                // 성공 시 artifactPath를 받고 루프 탈출
                artifactPath = await runDockerBuildAndMount(currentPlan);
                buildSuccess = true;
                break; 

            } catch (error) {
                console.error(`\n🛑 [Attempt ${attempt}] 빌드 실패 감지.`);
                const errorLog = error.message; 
                
                if (attempt === MAX_ATTEMPTS) {
                    throw new Error(`최대 수정 시도 횟수(${MAX_ATTEMPTS}회)를 초과했습니다. 자동 조치 실패.`);
                }

                // 3. 🩹 디버깅 및 수정 에이전트 호출
                console.log(`   -> DebuggerAgent 호출 및 수정 시도...`);
                
                // DebuggerAgent는 수정된 코드를 새 폴더에 저장하고, 빌드 테스트 후 새 경로를 반환합니다.
                const modifiedProjectPath = await debugAndFixCode(currentProjectPath, errorLog, currentPlan);
                
                // 수정된 프로젝트로 경로와 계획 업데이트
                currentProjectPath = modifiedProjectPath;
                
                // 수정된 코드를 기반으로 AnalyzerAgent 재실행 (계획이 변경될 수 있음)
                currentPlan = analyzeCodebase(currentProjectPath); 
                
                attempt++;
                console.log(`   -> DebuggerAgent 성공. 수정된 코드로 빌드 재시도 준비...`);
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
        console.log("=================================================");
    }
}

// 마스터 에이전트 실행 시작
runDeploymentPipeline();