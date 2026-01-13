/**
 * @fileoverview BuilderAgent - Docker 기반 빌드 실행 에이전트
 * @description Docker 컨테이너를 사용한 격리된 빌드 환경 관리
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 맞춤형 Docker 컨테이너를 빌드하고 소스 마운트 후 빌드를 실행
 * @param {Object} plan - AnalyzerAgent의 분석 결과
 * @param {string} plan.dockerfile - Dockerfile 내용
 * @param {string} plan.dockerImage - Docker 베이스 이미지
 * @param {string} plan.buildCommand - 빌드 명령어
 * @param {string} plan.sourceMountPath - 소스코드 경로
 * @param {string} plan.artifactDir - 빌드 결과물 디렉토리
 * @returns {Promise<string>} 빌드 결과물이 위치한 호스트 경로 (Artifact Path)
 */
function runDockerBuildAndMount(plan) {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(__dirname, 'temp_build');
        const dockerfilePath = path.join(tempDir, 'Dockerfile');
        const buildImageName = `llm-build-${Date.now()}`;
        const containerName = `llm-builder-${Date.now()}`;

        // temp_build 디렉토리 생성
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        // Dockerfile 저장
        fs.writeFileSync(dockerfilePath, plan.dockerfile);

        console.log(`\n🏗️ [BuilderAgent]: Docker 이미지 빌드 시작: ${buildImageName}`);
        if (plan.dockerImage) {
            console.log(`   -> LLM이 선택한 베이스 이미지: ${plan.dockerImage}`);
        }
        console.log(`   -> 빌드 명령: ${plan.buildCommand}`);

        // 1. Docker 이미지 빌드
        exec(`docker build -t ${buildImageName} ${tempDir}`, (err, stdout, stderr) => {
            if (err) {
                const errorMessage = `Docker 이미지 빌드 실패: ${stderr || stdout || err.message}`;
                return reject(new Error(errorMessage));
            }

            console.log(`   -> 이미지 빌드 성공. 빌드 컨테이너 실행 및 마운트`);

            // 소스코드 경로 확인
            if (!fs.existsSync(plan.sourceMountPath)) {
                return reject(new Error(`소스코드 경로를 찾을 수 없습니다: ${plan.sourceMountPath}`));
            }

            // package.json 존재 확인
            const packageJsonPath = path.join(plan.sourceMountPath, 'package.json');
            const hasPackageJson = fs.existsSync(packageJsonPath);
            console.log(`   -> 소스코드 경로: ${plan.sourceMountPath}`);
            console.log(`   -> package.json 존재: ${hasPackageJson ? '예' : '아니오'}`);

            // 2. 소스코드 및 아티팩트 마운트를 포함한 실행 명령 생성
            const appWorkDir = '/app';
            
            // Windows 경로를 Docker가 이해할 수 있도록 변환
            const sourcePath = plan.sourceMountPath
                .replace(/\\/g, '/')
                .replace(/^([A-Z]):/, '/$1')
                .toLowerCase();
            
            let volumeMounts = `-v "${sourcePath}":${appWorkDir}`;

            // 프론트엔드인 경우: 결과물 폴더 마운트 설정
            if (plan.artifactDir) {
                // 고유한 빌드 결과 임시 폴더 생성 (중복 방지)
                const artifactHostPath = path.join(tempDir, 'artifact_output', buildImageName);
                const artifactPath = artifactHostPath
                    .replace(/\\/g, '/')
                    .replace(/^([A-Z]):/, '/$1')
                    .toLowerCase();
                
                if (!fs.existsSync(artifactHostPath)) {
                    fs.mkdirSync(artifactHostPath, { recursive: true });
                }

                // 아티팩트 폴더 마운트: 컨테이너의 빌드 결과 -> 호스트의 임시 경로
                volumeMounts += ` -v "${artifactPath}":${appWorkDir}/${plan.artifactDir}`;
            }

            // Windows 경로 이스케이프 처리
            const escapedCommand = plan.buildCommand.replace(/"/g, '\\"');
            const runCmd = `docker run --rm --name ${containerName} ${volumeMounts} ${buildImageName} sh -c "${escapedCommand}"`;

            console.log(`   -> 실행 명령: ${runCmd.substring(0, 200)}...`);
            console.log(`   -> 마운트: 컨테이너 내부 ${appWorkDir}에 소스코드 마운트됨`);

            // 3. 컨테이너 실행 (빌드 수행) - 실시간 출력, 5분 타임아웃
            console.log(`   -> 빌드 시작... (진행 상황이 표시됩니다)`);
            const buildProcess = exec(runCmd, { timeout: 300000 }, (err, stdout, stderr) => {
                // 빌드 완료 후 결과 평가
                const buildOutput = stdout || '';
                const buildErrors = stderr || '';
                const allOutput = buildOutput + buildErrors;

                if (err) {
                    console.error(`\n   ❌ [빌드 에러]`);
                    console.error(`   ${(stderr || stdout || err.message).substring(0, 500)}`);
                    const errorMessage = stderr || stdout || err.message || '알 수 없는 빌드 오류';
                    return reject(new Error(errorMessage));
                }

                // 빌드 성공 여부 평가
                const buildSuccess = evaluateBuildSuccess(allOutput, plan);

                if (buildSuccess) {
                    console.log("\n   ✅ 빌드/실행 성공!");

                    // 결과물 확인
                    if (plan.artifactDir) {
                        const artifactPath = path.join(plan.sourceMountPath, plan.artifactDir);
                        const artifactHostPath = path.join(tempDir, 'artifact_output');

                        if (fs.existsSync(artifactHostPath)) {
                            const files = fs.readdirSync(artifactHostPath);
                            console.log(`   -> 빌드 결과물 확인: ${files.length}개 파일 생성됨`);
                            if (files.length > 0) {
                                console.log(`      주요 파일: ${files.slice(0, 5).join(', ')}`);
                            }

                            if (files.length === 0) {
                                // 분석 후 예측 경로와 실제 경로가 다른 경우 
                                console.log(`예측 경로(${plan.artifactDir})가 비어있습니다. 소스 폴더 내 다른 경로를 탐색합니다.`);

                                //빌드 결과 폴더명 리스트
                                const buildDirs = ['build', 'dist'];

                                // 분석했던 이름이 있다면 리스트에서 제외
                                const dir = buildDirs.filter(dir => dir !== plan.artifactDir);

                                for (const dirName of dir) {
                                    const fallbackPath = path.join(plan.sourceMountPath, dirName);

                                    if (fs.existsSync(fallbackPath)) {
                                        const files = fs.readdirSync(fallbackPath);
                                        console.log(`   -> 빌드 결과물 확인 (${dirName}): ${files.length}개 파일 생성됨`);
                                        if (files.length > 0) {
                                            console.log(`      주요 파일: ${files.slice(0, 5).join(', ')}`);
                                        }

                                        // 여기서 발견된 경로로 결과물 반환
                                        const resultPath = path.join(plan.sourceMountPath, dirName);
                                        resolve(resultPath);
                                        return;
                                    }
                                }
                            }
                        }
                    }

                    // 결과물 경로 반환 (프론트엔드인 경우에만 필요)
                    const resultPath = plan.artifactDir ? path.join(tempDir, 'artifact_output') : '';
                    resolve(resultPath);
                } else {
                    console.warn("\n   ⚠️ 빌드 출력에서 성공 신호를 찾을 수 없습니다.");
                    // 성공 신호가 없어도 에러가 없으면 성공으로 간주
                    const resultPath = plan.artifactDir ? path.join(tempDir, 'artifact_output') : '';
                    resolve(resultPath);
                }
            });

            // 실시간 출력 스트림
            if (buildProcess.stdout) {
                buildProcess.stdout.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            // 중요한 메시지만 출력 (너무 많은 출력 방지)
                            if (line.includes('npm') || line.includes('build') ||
                                line.includes('error') || line.includes('warning') ||
                                line.includes('success') || line.includes('complete') ||
                                line.includes('%') || line.includes('Compiled')) {
                                console.log(`   📦 ${line.trim()}`);
                            }
                        }
                    });
                });
            }

            if (buildProcess.stderr) {
                buildProcess.stderr.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim() && !line.includes('deprecated')) {
                            // deprecated 경고는 제외하고 출력
                            if (line.includes('error') || line.includes('Error') ||
                                line.includes('failed') || line.includes('Failed')) {
                                console.error(`   ⚠️ ${line.trim()}`);
                            }
                        }
                    });
                });
            }
        });
    });
}

/**
 * 빌드 성공 여부 평가
 * @param {string} output - 빌드 출력 로그
 * @param {Object} plan - 빌드 계획 객체
 * @returns {boolean} 빌드 성공 여부
 */
function evaluateBuildSuccess(output, plan) {
    const outputLower = output.toLowerCase();

    // 성공 신호
    const successSignals = [
        'build successful',
        'compiled successfully',
        'build complete',
        'the build folder is ready',
        'webpack compiled',
        'compiled with warnings',
        '✓ built',
        'build finished'
    ];

    // 실패 신호
    const failureSignals = [
        'build failed',
        'compilation failed',
        'error:',
        'npm err',
        'failed to compile'
    ];

    // 성공 신호 확인
    const hasSuccessSignal = successSignals.some(signal => outputLower.includes(signal));

    // 실패 신호 확인
    const hasFailureSignal = failureSignals.some(signal => outputLower.includes(signal));

    // 결과물 확인 (프론트엔드인 경우)
    if (plan.artifactDir) {
        const artifactPath = path.join(plan.sourceMountPath, plan.artifactDir);
        const hasArtifacts = fs.existsSync(artifactPath);

        if (hasArtifacts) {
            const files = fs.readdirSync(artifactPath);
            if (files.length > 0) {
                console.log(`   -> 빌드 결과물 확인: ${artifactPath}에 ${files.length}개 파일 존재`);
                return true; // 결과물이 있으면 성공
            }
        }
    }

    // 신호 기반 평가
    if (hasSuccessSignal && !hasFailureSignal) {
        return true;
    }

    if (hasFailureSignal) {
        return false;
    }

    // 신호가 없으면 에러가 없으면 성공으로 간주
    return !hasFailureSignal;
}

module.exports = { runDockerBuildAndMount };