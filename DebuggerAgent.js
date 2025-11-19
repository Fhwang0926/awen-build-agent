// DebuggerAgent.js

const fs = require('fs');
const path = require('path');
const { runDockerBuildAndMount } = require('./BuilderAgent'); // 빌드 에이전트 재사용

// 수정된 코드를 저장할 루트 폴더 정의
const MODIFIED_PROJECT_DIR = 'modified-poc-project';

/**
 * 빌드 에러를 분석하고 코드를 수정하여 새 폴더에 저장합니다.
 * @param {string} originalProjectPath - 원본 프로젝트 경로
 * @param {string} errorLog - BuilderAgent로부터 전달받은 에러 로그
 * @param {object} plan - 원본 빌드 계획
 * @returns {Promise<string>} - 수정된 프로젝트의 새 경로
 */
async function debugAndFixCode(originalProjectPath, errorLog, plan) {
    console.log("\n🩹 [DebuggerAgent]: 빌드 에러 분석 및 수정 시작...");

    // 1. 수정된 코드를 위한 새 폴더 생성 (task/data 구조 유지)
    const newProjectPath = path.join(__dirname, MODIFIED_PROJECT_DIR);
    const newSourcePath = path.join(newProjectPath, 'task', 'data');
    const originalSourcePath = path.join(originalProjectPath, 'task', 'data');

    // 기존 소스코드 전체를 새 폴더로 복사합니다.
    if (fs.existsSync(newProjectPath)) {
        fs.rmSync(newProjectPath, { recursive: true, force: true });
    }
    fs.mkdirSync(newSourcePath, { recursive: true });
    fs.cpSync(originalSourcePath, newSourcePath, { recursive: true });
    
    console.log(`   -> 원본 코드를 새 경로에 복사 완료: ${newSourcePath}`);

    // 2. 에러 로그 분석 및 최소한의 변경으로 수정 (LLM 추론 시뮬레이션)
    const fixApplied = simulateFix(newSourcePath, errorLog);

    if (!fixApplied) {
        throw new Error("DebuggerAgent가 분석할 수 없는 치명적인 에러입니다. 수동 개입이 필요합니다.");
    }
    
    // 3. 수정된 코드로 빌드 테스트
    console.log(`   -> 코드 수정 완료. 빌드 테스트 재시도...`);

    // BuilderAgent는 이제 수정된 경로를 사용하여 재빌드를 시도합니다.
    const modifiedPlan = { ...plan, sourceMountPath: newSourcePath };
    let buildArtifactPath = '';
    
    try {
        // BuilderAgent의 함수를 재사용하여 Docker 빌드 및 실행 테스트
        buildArtifactPath = await runDockerBuildAndMount(modifiedPlan);
        console.log(`   ✅ [DebuggerAgent]: 수정된 코드가 빌드 테스트에 성공했습니다!`);
        
        // 4. 성공 로그 및 ZIP 파일 생성
        await createSuccessArtifacts(newProjectPath, buildArtifactPath, 'BUILD SUCCESS LOGS...');
        
        return newProjectPath;
        
    } catch (rebuildError) {
        // 재빌드도 실패한 경우, 더 복잡한 디버깅이 필요함 (반복 루프)
        console.error(`   ❌ [DebuggerAgent]: 재빌드 테스트 실패. 더 이상 자동으로 수정할 수 없습니다.`);
        throw new Error(`빌드 수정 에이전트 실패: ${rebuildError}`);
    }
}


/**
 * 에러 로그를 기반으로 소스코드를 수정하는 로직 (가상 LLM 추론)
 * @param {string} sourcePath - 수정할 소스코드가 있는 경로
 * @param {string} errorLog - 전달받은 에러 로그
 * @returns {boolean} - 수정 성공 여부
 */
function simulateFix(sourcePath, errorLog) {
    const packageJsonPath = path.join(sourcePath, 'package.json');

    // 예시 1: 종속성 누락 에러 시뮬레이션
    // (실제 에러 로그 대신, 에러가 발생했다고 가정하고 필수 종속성을 추가)
    if (errorLog.includes("cannot find module") || errorLog.includes("npm ERR!")) {
        console.log("   -> [Fixing]: '종속성 누락' 에러로 추정, package.json에 'express' 추가 시도.");
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (!packageJson.dependencies || !packageJson.dependencies.express) {
                packageJson.dependencies = packageJson.dependencies || {};
                packageJson.dependencies.express = '^4.18.2'; // 최소한의 변경 적용
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                return true;
            }
        } catch (e) {
            console.error("   -> package.json 수정 중 오류 발생:", e.message);
            return false;
        }
    }
    
    // 예시 2: 서버 포트 충돌 수정 등 다른 에러 수정 로직 추가 가능...
    
    return false; // 수정할 수 없는 에러로 간주
}

/**
 * 성공 로그와 ZIP 파일을 생성하는 함수
 * @param {string} projectPath - 수정된 프로젝트 경로
 * @param {string} artifactPath - 빌드 아티팩트 경로
 * @param {string} buildLog - 최종 빌드 성공 로그 (시뮬레이션)
 */
async function createSuccessArtifacts(projectPath, artifactPath, buildLog) {
    const outputDir = path.join(projectPath, 'build_output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    
    // 1. 빌드 성공 로그 파일 생성
    const logPath = path.join(outputDir, 'build_success_log.txt');
    const finalLog = `
==================================================
✅ DEBUGGER AGENT - 최종 빌드 성공 로그
==================================================
수정된 프로젝트 경로: ${projectPath}
빌드 아티팩트 경로: ${artifactPath || 'N/A (백엔드)'}

${buildLog}

--------------------------------------------------
[DebuggerAgent] 조치 내용 요약:
'package.json' 파일에 누락된 핵심 종속성(express)을 추가하여 빌드를 가능하게 수정함.
--------------------------------------------------
`;
    fs.writeFileSync(logPath, finalLog);
    console.log(`   📝 성공 로그 파일 생성 완료: ${logPath}`);

    // 2. ZIP 파일 생성 (Node.js의 'archiver' 라이브러리 필요)
    // POC 코드이므로 'archiver' 없이 파일 존재만 알립니다.
    const zipFilePath = path.join(outputDir, 'modified_source_and_logs.zip');
    // 실제 환경에서는 exec('zip -r ...') 또는 'archiver' 사용
    
    fs.writeFileSync(zipFilePath, `ZIP Placeholder for modified code (${new Date().toISOString()})`);
    console.log(`   🎁 ZIP 아카이브 파일 생성 시뮬레이션 완료: ${zipFilePath}`);
}


module.exports = { debugAndFixCode };