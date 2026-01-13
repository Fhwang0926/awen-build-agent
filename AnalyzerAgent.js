/**
 * @fileoverview AnalyzerAgent - LLM 기반 코드베이스 분석 에이전트
 * @description 프로젝트 구조 분석, 빌드 도구 감지, Dockerfile 생성
 */

const fs = require('fs');
const path = require('path');
const { callLLM } = require('./LLMService');

/**
 * 프로젝트 구조를 읽어서 LLM에 전달할 컨텍스트 생성
 * @param {string} projectPath - 분석할 프로젝트 경로
 * @returns {Object} 프로젝트 컨텍스트 정보
 */
function gatherProjectContext(projectPath) {
    const context = {
        files: [],
        packageJson: null,
        structure: [],
        buildTools: [],
        hasLockFile: false,
        lockFileType: null,
        hasBuildScript: false,
        artifactDir: null
    };

    function scanDirectory(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = path.join(relativePath, item);

            // node_modules, .git 등 제외
            if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build') {
                continue;
            }

            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                context.structure.push(`${relPath}/`);
                scanDirectory(fullPath, relPath);
            } else {
                context.structure.push(relPath);

                // lockfile 확인
                if (item === 'package-lock.json') {
                    context.hasLockFile = true;
                    context.lockFileType = 'npm';
                } else if (item === 'yarn.lock') {
                    context.hasLockFile = true;
                    context.lockFileType = 'yarn';
                } else if (item === 'pnpm-lock.yaml') {
                    context.hasLockFile = true;
                    context.lockFileType = 'pnpm';
                }

                // 빌드 도구 확인
                if (item === 'vite.config.js' || item === 'vite.config.ts') {
                    context.buildTools.push('vite');
                } else if (item === 'webpack.config.js' || item === 'webpack.config.ts') {
                    context.buildTools.push('webpack');
                } else if (item === 'next.config.js' || item === 'next.config.ts') {
                    context.buildTools.push('nextjs');
                } else if (item === 'rollup.config.js' || item === 'rollup.config.ts') {
                    context.buildTools.push('rollup');
                }

                // 핵심 설정 파일만 읽기 (크기 제한)
                if (item === 'package.json' || item === 'vite.config.js' || item === 'vite.config.ts' ||
                    item === 'webpack.config.js' || item === 'webpack.config.ts' ||
                    item === 'tsconfig.json' || item === 'Dockerfile' ||
                    item === 'next.config.js' || item === 'next.config.ts') {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (item === 'package.json') {
                            context.packageJson = JSON.parse(content);
                            // 빌드 스크립트 확인
                            if (context.packageJson.scripts) {
                                context.hasBuildScript = !!context.packageJson.scripts.build;
                                // artifact 디렉토리 추정
                                if (context.packageJson.scripts.build) {
                                    const buildCmd = context.packageJson.scripts.build;
                                    if (buildCmd.includes('react-scripts')) {
                                        context.artifactDir = 'build';
                                    } else if (buildCmd.includes('vite')) {
                                        context.artifactDir = 'dist';
                                    } else if (buildCmd.includes('next')) {
                                        context.artifactDir = '.next';
                                    }
                                }
                            }
                        } else {
                            // 설정 파일은 최대 1KB만
                            context.files.push({ path: relPath, content: content.substring(0, 1000) });
                        }
                    } catch (e) {
                        // 읽기 실패는 무시
                    }
                }
            }
        }
    }

    scanDirectory(projectPath);
    return context;
}

/**
 * 빌드 명령어 최적화 (lockfile 존재 여부에 따라 npm ci/npm install 선택)
 * @param {string} buildCommand - 최적화할 빌드 명령어
 * @param {string} projectPath - 프로젝트 경로
 * @returns {string} 최적화된 빌드 명령어
 */
function optimizeBuildCommand(buildCommand, projectPath) {
    if (!buildCommand) return buildCommand;

    // package-lock.json 또는 yarn.lock 존재 여부 확인
    const hasLockFile = fs.existsSync(path.join(projectPath, 'package-lock.json')) ||
        fs.existsSync(path.join(projectPath, 'yarn.lock')) ||
        fs.existsSync(path.join(projectPath, 'npm-shrinkwrap.json'));

    // npm ci가 있는데 lockfile이 없으면 npm install로 변경
    if (buildCommand.includes('npm ci') && !hasLockFile) {
        console.log(`   -> lockfile이 없어서 'npm ci'를 'npm install'로 변경`);
        return buildCommand.replace(/npm ci/g, 'npm install');
    }

    // npm install이 있는데 lockfile이 있으면 npm ci로 변경 (선택적)
    // 하지만 안전하게 npm install을 유지하는 것이 좋음

    return buildCommand;
}

/**
 * 실제 프로젝트 경로 찾기 (package.json이 있는 폴더)
 * @param {string} projectPath - 검색 시작 경로
 * @returns {string} 실제 프로젝트 경로
 */
function findActualProjectPath(projectPath) {
    // 현재 경로에 package.json이 있으면 그대로 반환
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        return projectPath;
    }

    // 하위 폴더 탐색 (최대 1단계 깊이)
    console.log("   -> package.json을 찾기 위해 하위 폴더 탐색 중...");
    try {
        const items = fs.readdirSync(projectPath);
        for (const item of items) {
            const itemPath = path.join(projectPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' &&
                item !== 'dist' && item !== 'build') {
                const subPackageJson = path.join(itemPath, 'package.json');
                if (fs.existsSync(subPackageJson)) {
                    console.log(`   -> 실제 프로젝트 발견: ${item}`);
                    return itemPath;
                }
            }
        }
    } catch (e) {
        // 탐색 실패는 무시하고 원래 경로 반환
    }

    // 찾지 못하면 원래 경로 반환
    return projectPath;
}

/**
 * LLM을 사용하여 코드베이스 분석 및 빌드 계획 수립
 * @param {string} projectPath - 분석할 프로젝트 경로
 * @returns {Promise<Object>} 빌드 계획 객체
 */
async function analyzeCodebase(projectPath) {
    console.log("🔍 [AnalyzerAgent]: LLM 기반 소스코드 분석 및 도커 계획 수립 시작...");

    if (!fs.existsSync(projectPath)) {
        throw new Error(`프로젝트 폴더를 찾을 수 없습니다: ${projectPath}`);
    }

    // 실제 프로젝트 경로 찾기
    const actualProjectPath = findActualProjectPath(projectPath);
    if (actualProjectPath !== projectPath) {
        console.log(`   -> 프로젝트 경로 변경: ${projectPath} -> ${actualProjectPath}`);
    }

    // 프로젝트 컨텍스트 수집
    console.log("   -> 프로젝트 구조 및 파일 분석 중...");
    const context = gatherProjectContext(actualProjectPath);

    // 초기 분석 결과 출력
    console.log("   -> 파일 분석 결과:");
    console.log(`      - package.json: ${context.packageJson ? '있음' : '없음'}`);
    console.log(`      - lockfile: ${context.hasLockFile ? context.lockFileType : '없음'}`);
    console.log(`      - 빌드 도구: ${context.buildTools.length > 0 ? context.buildTools.join(', ') : '없음'}`);
    console.log(`      - build 스크립트: ${context.hasBuildScript ? '있음' : '없음'}`);
    console.log(`      - 예상 artifact 디렉토리: ${context.artifactDir || '없음'}`);
    console.log(`      - 총 파일 수: ${context.structure.length}개`);

    // LLM 프롬프트 생성 (최적화: 핵심 정보만 전달)
    const systemPrompt = `DevOps 엔지니어. 프로젝트 분석 후 빌드 계획을 JSON으로 제공.`;

    // 핵심 정보만 추출 (이미 분석된 정보 활용)
    const hasPackageJson = !!context.packageJson;
    const scripts = context.packageJson?.scripts || {};
    const mainDeps = context.packageJson?.dependencies ? Object.keys(context.packageJson.dependencies).slice(0, 10) : [];
    const nodeVersion = context.packageJson?.engines?.node || null;

    // 기본 빌드 명령어 생성 (lockfile 기반)
    const installCommand = context.hasLockFile && context.lockFileType === 'npm'
        ? 'npm ci'
        : context.hasLockFile && context.lockFileType === 'yarn'
            ? 'yarn install --frozen-lockfile'
            : 'npm install';

    const buildCommand = context.hasBuildScript
        ? `${installCommand} && npm run build`
        : installCommand;

    // 프로젝트 타입 추정을 위한 핵심 파일만 확인
    const keyFiles = context.files
        .filter(f => f.path.includes('package.json') || f.path.includes('vite.config') ||
            f.path.includes('webpack.config') || f.path.includes('tsconfig.json'))
        .slice(0, 3)
        .map(f => ({ path: f.path, preview: f.content.substring(0, 500) }));

    const userPrompt = `프로젝트 분석 후 빌드 계획을 JSON으로 제공:

${hasPackageJson ? `package.json:
- scripts: ${JSON.stringify(scripts)}
- 주요 dependencies: ${mainDeps.join(', ')}
${nodeVersion ? `- node 버전: ${nodeVersion}` : ''}
- lockfile: ${context.hasLockFile ? context.lockFileType : '없음'}
- 빌드 도구: ${context.buildTools.length > 0 ? context.buildTools.join(', ') : '없음'}
- 기본 빌드 명령: ${buildCommand}` : 'package.json 없음 (정적 프로젝트)'}

${keyFiles.length > 0 ? `핵심 파일:\n${keyFiles.map(f => `${f.path}: ${f.preview}`).join('\n')}` : ''}

JSON 응답:
{
  "type": "프로젝트 타입",
  "dockerImage": "Docker 이미지 (예: node:20-alpine)",
  "buildCommand": "빌드 명령 (기본값: ${buildCommand}, 필요시 수정)",
  "artifactDir": "결과물 폴더 (예: ${context.artifactDir || 'build/dist'})",
  "dockerfile": "Dockerfile 전체 내용",
  "needsBuild": ${context.hasBuildScript},
  "needsInstall": ${hasPackageJson}
}`;

    try {
        console.log("   -> LLM에 분석 요청 중... (타임아웃: 60초)");
        const llmResult = await Promise.race([
            callLLM(userPrompt, systemPrompt, 'AnalyzerAgent', 60000),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('LLM 호출 타임아웃')), 60000)
            )
        ]);
        const llmResponse = llmResult.response;

        // JSON 응답 파싱 (여러 시도)
        let plan = null;

        // 방법 1: 코드 블록에서 JSON 추출
        const codeBlockMatch = llmResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
            try {
                plan = JSON.parse(codeBlockMatch[1]);
            } catch (e) {
                console.log(`   -> 코드 블록 파싱 실패, 다른 방법 시도...`);
            }
        }

        // 방법 2: 첫 번째 JSON 객체 찾기
        if (!plan) {
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    plan = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.log(`   -> JSON 파싱 실패: ${e.message}`);
                    throw new Error(`LLM 응답 파싱 실패: ${e.message}. 응답: ${llmResponse.substring(0, 500)}`);
                }
            } else {
                throw new Error(`LLM 응답에서 JSON을 찾을 수 없습니다. 응답: ${llmResponse.substring(0, 500)}`);
            }
        }

        // 필수 필드 검증 및 기본값 설정
        if (!plan.dockerImage) {
            plan.dockerImage = 'node:20-alpine'; // 기본값
        }

        if (!plan.buildCommand) {
            plan.buildCommand = 'npm install && npm run build';
        }

        if (plan.artifactDir === undefined) {
            plan.artifactDir = '';
        }

        // Dockerfile이 없거나 불완전한 경우 생성
        if (!plan.dockerfile || !plan.dockerfile.includes('FROM')) {
            const serveInstall = (plan.type.includes('React') || plan.type.includes('Frontend') || plan.type.includes('HTML5')) ? 'RUN npm install -g serve' : '';
            plan.dockerfile = `FROM ${plan.dockerImage}
WORKDIR /app
${serveInstall}
CMD ["sh", "-c", "${plan.buildCommand}"]`;
        }

        plan.sourceMountPath = actualProjectPath;
        plan.needsBuild = plan.needsBuild !== undefined ? plan.needsBuild : context.hasBuildScript;
        plan.needsInstall = plan.needsInstall !== undefined ? plan.needsInstall : hasPackageJson;

        // artifactDir가 없으면 컨텍스트에서 추정한 값 사용
        if (!plan.artifactDir && context.artifactDir) {
            plan.artifactDir = context.artifactDir;
        }

        // 빌드 명령어 최적화: lockfile 존재 여부 확인
        plan.buildCommand = optimizeBuildCommand(plan.buildCommand || buildCommand, actualProjectPath);

        console.log(`   ✅ LLM 분석 완료:`);
        console.log(`      - 프로젝트 유형: ${plan.type}`);
        console.log(`      - Docker 이미지: ${plan.dockerImage}`);
        console.log(`      - 빌드 명령: ${plan.buildCommand}`);
        console.log(`      - 빌드 아티팩트 경로: ${plan.artifactDir || '없음'}`);

        return plan;
    } catch (error) {
        console.error(`   ⚠️ LLM 분석 실패, 기본 규칙 기반 분석으로 대체: ${error.message}`);

        // LLM 실패 시 기본 규칙 기반 분석으로 폴백
        return fallbackAnalysis(actualProjectPath, context);
    }
}

/**
 * LLM 실패 시 사용하는 기본 규칙 기반 분석
 * @param {string} projectPath - 분석할 프로젝트 경로
 * @param {Object} context - 프로젝트 컨텍스트 정보
 * @returns {Object} 빌드 계획 객체
 */
function fallbackAnalysis(projectPath, context) {
    // 실제 프로젝트 경로 찾기
    const actualProjectPath = findActualProjectPath(projectPath);
    const packageJson = context.packageJson;

    if (!packageJson) {
        return {
            type: "HTML5",
            dockerImage: "nginx:alpine",
            buildCommand: "echo 'Static HTML project - no build needed'",
            artifactDir: "",
            dockerfile: `FROM nginx:alpine
WORKDIR /app
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
            needsBuild: false,
            needsInstall: false,
            sourceMountPath: actualProjectPath
        };
    }

    let type = "Node.js (Backend)";
    let dockerImage = "node:20-alpine";
    let buildCommand = "npm install && npm start";
    let artifactDir = "";

    // Node 버전 확인
    if (packageJson.engines?.node) {
        const nodeVersion = packageJson.engines.node.replace(/[^0-9.]/g, '').split('.')[0];
        if (nodeVersion) {
            dockerImage = `node:${nodeVersion}-alpine`;
        }
    }

    if (packageJson.dependencies?.react) {
        type = "Frontend (React)";
        buildCommand = packageJson.scripts?.build ? `npm ci && npm run build` : "npm install && npm run build";
        artifactDir = "build";
    } else if (packageJson.dependencies?.vue) {
        type = "Frontend (Vue)";
        buildCommand = packageJson.scripts?.build ? `npm ci && npm run build` : "npm install && npm run build";
        artifactDir = "dist";
    } else if (packageJson.scripts?.build) {
        type = "Frontend (Generic)";
        buildCommand = `npm ci && npm run build`;

        if (packageJson.scripts?.build.includes('dist')) {
            artifactDir = "dist";
        } else if (packageJson.scripts?.build.includes('build')) {
            artifactDir = "build";
        }

    } else if (packageJson.scripts?.start) {
        buildCommand = packageJson.scripts.start.includes('node') ?
            `npm install && ${packageJson.scripts.start}` :
            "npm install && npm start";
    }

    const serveInstall = (type.includes('React') || type.includes('Frontend')) ? 'RUN npm install -g serve' : '';
    const dockerfileContent = `FROM ${dockerImage}
WORKDIR /app
${serveInstall}
CMD ["sh", "-c", "${buildCommand}"]`;

    // 빌드 명령어 최적화
    const optimizedBuildCommand = optimizeBuildCommand(buildCommand, actualProjectPath);

    return {
        type,
        dockerImage,
        buildCommand: optimizedBuildCommand,
        artifactDir,
        dockerfile: dockerfileContent,
        needsBuild: !!packageJson.scripts?.build,
        needsInstall: true,
        sourceMountPath: actualProjectPath
    };
}

module.exports = { analyzeCodebase };