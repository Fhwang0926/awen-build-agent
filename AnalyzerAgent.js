// AnalyzerAgent.js (Expanded for Frontend)

const fs = require('fs');
const path = require('path');

function analyzeCodebase(projectPath) {
    console.log("🔍 [AnalyzerAgent]: 소스코드 분석 및 도커 계획 수립 시작...");
    const dataPath = path.join(projectPath, 'task', 'data');
    if (!fs.existsSync(dataPath)) {
        throw new Error("task/data 폴더를 찾을 수 없습니다.");
    }
    
    const packageJsonPath = path.join(dataPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return { type: "Unknown", buildCommand: "echo '빌드 설정 파일 없음'", dockerfile: "" };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    let type = "Node.js (Backend)";
    let buildCommand = "npm install && npm start";
    let artifactDir = ""; // 빌드 결과물이 생성되는 폴더

    // 프론트엔드 종속성 확인 (React 예시)
    if (packageJson.dependencies && packageJson.dependencies.react) {
        type = "Frontend (React)";
        buildCommand = "npm install && npm run build"; // React의 표준 빌드 명령
        artifactDir = "build"; // React 빌드 결과물 경로
    } else if (packageJson.scripts && packageJson.scripts.start) {
        // Node.js 백엔드 또는 기타 Node 앱
        artifactDir = ""; // 백엔드는 아티팩트가 별도로 필요 없음 (소스코드 자체가 실행됨)
    }

    // 맞춤형 Dockerfile 생성 (빌드 환경 정의)
    const dockerfileContent = `
# AnalyzerAgent가 생성한 빌드 환경 Dockerfile
FROM node:20-alpine
WORKDIR /app
# 소스코드 복사는 BuilderAgent가 마운트로 처리
RUN npm install -g ${type.includes('React') ? 'serve' : ''}
CMD ["sh", "-c", "${buildCommand}"]
`;

    console.log(`   -> 프로젝트 유형: ${type}, 빌드 아티팩트 경로: ${artifactDir}`);
    
    return { 
        type, 
        buildCommand, 
        artifactDir, 
        dockerfile: dockerfileContent,
        sourceMountPath: dataPath // 실제 소스코드 위치
    };
}

module.exports = { analyzeCodebase };