const axios = require('axios');
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function getBuildTask() {
    const url = `${BASE_URL}/api/sys_build_agent_task/task/get`;

    try {
        console.log(`🔍 외부 API에서 태스크 가져오는 중: ${url}`);
        const response = await axios.get(url);
        const data = response.data.data.data;

        if (!data) {
            return;
        }

        const repo_url = data.repo_url;

        if (!repo_url) {
            console.log('⚠️ 빌드할 저장소 URL이 없습니다.');
            return;
        }

        return data;

    } catch (error) {
        console.error('❌ 에러 발생:', error.message);
    }
}

async function reportBuildResult(payload) {
    const url = `${BASE_URL}/api/log_build_agent_task/report`;

    try {
        console.log(`🔍 외부 API로 결과 보고 중: ${url}`);
        const response = await axios.post(url, payload);
        const data = response.data.data.data;

        if (!data) {
            console.log('⚠️ 보고된 결과가 없습니다.');
            return;
        }

    } catch (error) {
        console.error('❌ 에러 발생:', error.message);
    }
}

module.exports = { getBuildTask, reportBuildResult };