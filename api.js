/**
 * @fileoverview API 클라이언트
 * @description 외부 API와의 통신을 담당
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * 외부 API에서 빌드 태스크 가져오기
 * @returns {Promise<Object|undefined>} 빌드 태스크 데이터
 */
async function getBuildTask() {
    const url = `${BASE_URL}/api/sys_build_agent_task/task/get`;

    try {
        console.log(`🔍 외부 API에서 태스크 가져오는 중: ${url}`);
        const response = await axios.get(url);
        const data = response.data.data.data;

        if (!data) {
            return;
        }

        const repoUrl = data.repo_url;

        if (!repoUrl) {
            console.log('⚠️ 빌드할 저장소 URL이 없습니다.');
            return;
        }

        return data;

    } catch (error) {
        console.error('❌ 에러 발생:', error.message);
    }
}

/**
 * 빌드 결과를 외부 API로 보고
 * @param {Object} payload - 보고할 데이터
 * @returns {Promise<void>}
 */
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