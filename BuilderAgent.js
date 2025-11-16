// BuilderAgent.js (Expanded for Docker/Mounting)

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 맞춤형 Docker 컨테이너를 빌드하고 소스 마운트 후 빌드를 실행합니다.
 * @param {object} plan - AnalyzerAgent의 분석 결과
 * @returns {Promise<string>} - 빌드 결과물이 위치한 호스트 경로 (Artifact Path)
 */
function runDockerBuildAndMount(plan) {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(__dirname, 'temp_build'); // 호스트의 임시 경로
        const dockerfilePath = path.join(tempDir, 'Dockerfile');
        const buildImageName = `llm-build-${Date.now()}`;
        const containerName = `llm-builder-${Date.now()}`;

        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        fs.writeFileSync(dockerfilePath, plan.dockerfile); // Dockerfile 저장

        console.log(`\n🏗️ [BuilderAgent]: 1. 맞춤형 Docker 이미지 빌드 시작: ${buildImageName}`);
        
        // 1. 빌드 이미지 생성
        exec(`docker build -t ${buildImageName} ${tempDir}`, (err, stdout, stderr) => {
            if (err) return reject(`Docker 이미지 빌드 실패: ${stderr}`);

            console.log(`   -> 이미지 빌드 성공. 2. 빌드 컨테이너 실행 및 마운트.`);

            // 2. 소스코드 및 아티팩트 마운트를 포함한 실행 명령 생성
            const appWorkDir = '/app'; // 컨테이너 내부 작업 경로
            // 소스코드 마운트: 호스트의 소스코드 -> 컨테이너의 작업 경로
            let volumeMounts = `-v ${plan.sourceMountPath}:${appWorkDir}`; 

            // 프론트엔드인 경우: 결과물 폴더 마운트 설정
            if (plan.artifactDir) {
                const artifactHostPath = path.join(tempDir, 'artifact_output'); // 호스트의 결과물 임시 저장소
                if (!fs.existsSync(artifactHostPath)) fs.mkdirSync(artifactHostPath);
                
                // 아티팩트 폴더 마운트: 컨테이너의 빌드 결과 -> 호스트의 임시 경로
                volumeMounts += ` -v ${artifactHostPath}:${appWorkDir}/${plan.artifactDir}`;
            }

            const runCmd = `docker run --rm --name ${containerName} ${volumeMounts} ${buildImageName} sh -c "${plan.buildCommand}"`;
            
            console.log(`   -> 실행 명령: ${runCmd}`);

            // 3. 컨테이너 실행 (빌드 수행)
            exec(runCmd, { timeout: 120000 }, (err, stdout, stderr) => { // 2분 타임아웃
                if (err) {
                    console.error(`   ❌ [BUILD ERROR]: ${stderr}`);
                    return reject(`빌드 실행 실패. DebuggerAgent 호출 필요.`);
                }
                
                console.log("   ✅ 빌드/실행 성공!");
                // 결과물 경로 반환 (프론트엔드인 경우에만 필요)
                const resultPath = plan.artifactDir ? path.join(tempDir, 'artifact_output') : '';
                resolve(resultPath);
            });
        });
    });
}

module.exports = { runDockerBuildAndMount };