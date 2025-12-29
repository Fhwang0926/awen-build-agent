const path = require('path');
const simpleGit = require('simple-git');

// 핵심 에이전트 모듈들
const { analyzeCodebase } = require('./AnalyzerAgent');
const { runDockerBuildAndMount } = require('./BuilderAgent');
const { deployToWebServer } = require('./DeployAgent');
const { debugAndFixCode } = require('./DebuggerAgent');
const axios = require('axios');

/**
 * Git 저장소를 특정 경로로 클론하는 함수
 */
async function clone(gitUrl, targetPath) {
    try {
        const git = simpleGit();
        console.log(`🚚 Git 클론 시작: ${gitUrl} -> ${targetPath}`);
        await git.clone(gitUrl, targetPath);
        console.log('✅ Git clone 완료');
        return targetPath;
    } catch (error) {
        console.error('❌ Clone 중 에러 발생:', error);
        throw error;
    }
}

// TODO: 클론 받은 프로젝트를 빌드하는 함수
async function build() {

}

// awen-build-agent API 호출
const base_url = 'http://localhost:3000';
async function awenBuildAgent() {
    const url = `${base_url}/api/sys_build_agent_task/task/get`;
    let githubUrl = ""

    try {
        console.log(`🔍 외부 API에서 태스크 가져오는 중: ${url}`);
        const response = await axios.get(url);

        console.log('📦 수신 데이터:', response.data.data);

        const githubUrl = response.data.data.data.github_url; // API 필드명에 맞게 수정

        if (!githubUrl) {
            console.log('⚠️ 빌드할 저장소 URL이 없습니다.');
            return;
        }

        // 클론할 타겟 경로 (저장소 이름 + 타임스탬프)
        const repoName = githubUrl.split('/').pop().replace('.git', '');
        const targetPath = path.join(__dirname, 'cloned_projects', `${repoName}-${Date.now()}`);
        // 클론 실행
        await clone(githubUrl, targetPath);

        console.log(`\n🚀 다음 단계 준비 완료: ${targetPath} 에서 빌드를 시작할 수 있습니다.`);

    } catch (error) {
        console.error('❌ 에러 발생:', error.message);
    }
}

// 파일 실행 시 바로 시작
awenBuildAgent();