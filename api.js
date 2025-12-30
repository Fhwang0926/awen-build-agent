const axios = require('axios');
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function getBuildTask() {
    const url = `${BASE_URL}/api/sys_build_agent_task/task/get`;

    try {
        console.log(`🔍 외부 API에서 태스크 가져오는 중: ${url}`);
        const response = await axios.get(url);
        const data = response.data.data.data;

        if (!data) {
            console.log('⚠️ 빌드할 태스크가 없습니다.');
            return;
        }

        console.log('📦 수신 데이터:', data);
        const githubUrl = data.github_url;

        if (!githubUrl) {
            console.log('⚠️ 빌드할 저장소 URL이 없습니다.');
            return;
        }

        return data;

    } catch (error) {
        console.error('❌ 에러 발생:', error.message);
    }
}

// TODO: 결과 반환 api 호출 로직 구현
module.exports = { getBuildTask };