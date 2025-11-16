// DeployerAgent.js (Expanded for Web Server Mounting)

const { exec } = require('child_process');

/**
 * 빌드 결과물을 웹 서버에 마운트하여 배포합니다.
 * @param {string} artifactHostPath - 빌드 결과물이 있는 호스트 경로 (프론트엔드)
 * @param {string} type - 프로젝트 유형
 */
function deployToWebServer(artifactHostPath, type) {
    console.log(`\n🚀 [DeployerAgent]: 최종 웹 서버 배포 시작...`);
    const containerName = 'llm-web-server';
    
    // 1. 배포할 이미지와 마운트 경로 설정
    let imageName, volumeMount;

    if (type.includes('Frontend')) {
        // Nginx를 사용해 정적 파일 (프론트엔드) 서비스
        imageName = 'nginx:alpine';
        // 빌드 결과물을 Nginx의 기본 웹 루트에 마운트
        volumeMount = `-v ${artifactHostPath}:/usr/share/nginx/html:ro`; 
    } else {
        // 백엔드(Node.js)를 직접 실행하는 컨테이너 가정
        imageName = 'node:20-alpine';
        // 소스코드 자체가 이미 빌드 단계에서 마운트되어 실행됨 (또는 별도 Docker Compose 필요)
        // 여기서는 POC를 위해 Nginx를 프론트/백엔드 게이트웨이로 가정
        // 실제로는 Docker Compose로 백엔드와 프론트엔드를 연결해야 합니다.
        imageName = 'nginx:alpine';
        volumeMount = ''; // 백엔드는 별도 포트에서 동작한다고 가정
    }

    const portMapping = "-p 8080:80"; // 8080 포트로 서비스

    console.log(`   -> 웹 서버 컨테이너 시작: ${imageName} with Mount: ${volumeMount}`);

    // 이전 컨테이너 정리 및 새 컨테이너 실행
    exec(`docker stop ${containerName} && docker rm ${containerName}`, { stdio: 'ignore' }, () => {
        const runCmd = `docker run -d --name ${containerName} ${portMapping} ${volumeMount} ${imageName}`;
        
        exec(runCmd, (err, stdout, stderr) => {
            if (err) {
                console.error(`   🛑 웹 서버 시작 실패: ${stderr}`);
            } else {
                console.log(`   ✅ [DeployerAgent]: 웹 서버 배포 및 서비스 시작 완료!`);
                console.log("   -------------------------------------------------");
                console.log(`   서비스 유형: ${type}`);
                console.log(`   최종 URL: http://localhost:8080/`);
                console.log("   -------------------------------------------------");
            }
        });
    });
}

module.exports = { deployToWebServer };