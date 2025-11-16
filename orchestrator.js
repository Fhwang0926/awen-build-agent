// orchestrator.js (Final Integration)

const { analyzeCodebase } = require('./AnalyzerAgent');
const { runDockerBuildAndMount } = require('./BuilderAgent');
const { deployToWebServer } = require('./DeployerAgent');

// ************* 핵심 실행 로직 *************
async function runDeploymentPipeline(projectDirectory) {
    const projectPath = path.join(__dirname, projectDirectory);
    
    console.log("=== 🤖 다중 LLM 에이전트 배포 파이프라인 시작 (빌드 마운트 반영) ===");
    
    try {
        // 1. 분석 및 계획 에이전트 실행
        const plan = analyzeCodebase(projectPath);
        
        // 2. 빌드 및 실행 에이전트 실행 (Docker 빌드/소스 마운트/결과물 마운트)
        // buildArtifactPath는 빌드 결과물이 호스트의 임시 폴더에 마운트된 경로입니다.
        const buildArtifactPath = await runDockerBuildAndMount(plan); 

        // 3. 배포 에이전트 실행 (결과물을 웹 서버에 마운트하여 띄움)
        await deployToWebServer(buildArtifactPath || plan.sourceMountPath, plan.type);
        
        console.log("=== 🎉 전체 파이프라인 성공적으로 완료됨 ===");

    } catch (error) {
        console.log("\n🛑 치명적인 오류 발생. DebuggerAgent를 호출하여 조치해야 합니다.");
        console.error(`Error: ${error}`);
    }
}

// POC 프로젝트 폴더 이름을 인자로 전달합니다. (예: 'my-poc-project')
// 이 폴더 안에 task/data 폴더가 있고, 그 안에 package.json이 있는 소스코드가 있어야 합니다.
runDeploymentPipeline('my-poc-project');