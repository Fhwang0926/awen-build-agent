// LLMService.js - LLM API 통합 서비스

const https = require('https');

// 환경 변수에서 API 키 가져오기 (기본값: OpenAI)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai' 또는 'anthropic'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// 모델 설정 (기본값: nano - 가장 작은 모델)
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-nano'; // nano 모델
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

/**
 * LLM API 호출 함수
 * @param {string} prompt - LLM에 전달할 프롬프트
 * @param {string} systemPrompt - 시스템 프롬프트 (선택적)
 * @param {string} context - 호출 컨텍스트 (에이전트 이름 등, 선택적)
 * @returns {Promise<{response: string, usage: object}>} - LLM 응답과 토큰 사용량
 */
async function callLLM(prompt, systemPrompt = null, context = 'LLM', timeout = 60000) {
    if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
        throw new Error('LLM API 키가 설정되지 않았습니다. OPENAI_API_KEY 또는 ANTHROPIC_API_KEY 환경 변수를 설정하세요.');
    }

    // 입력 데이터 크기 계산 (대략적)
    const inputData = {
        prompt: prompt.length,
        systemPrompt: systemPrompt ? systemPrompt.length : 0,
        totalChars: prompt.length + (systemPrompt ? systemPrompt.length : 0)
    };

    // 타임아웃 래퍼
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`LLM 호출 타임아웃 (${timeout}ms)`)), timeout);
    });

    try {
        const apiPromise = LLM_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY
            ? callAnthropicAPI(prompt, systemPrompt, context, inputData)
            : callOpenAIAPI(prompt, systemPrompt, context, inputData);
        
        const result = await Promise.race([apiPromise, timeoutPromise]);
        return result;
    } catch (error) {
        console.error(`   ⚠️ LLM 호출 실패 (${context}): ${error.message}`);
        throw error;
    }
}

/**
 * OpenAI API 호출
 */
async function callOpenAIAPI(prompt, systemPrompt, context, inputData) {
    return new Promise((resolve, reject) => {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        // 모델에 따라 올바른 파라미터 사용
        // 최신 OpenAI 모델들은 max_completion_tokens를 사용해야 함
        const requestBody = {
            model: OPENAI_MODEL, // 기본값: gpt-3.5-turbo (nano)
            messages: messages,
            temperature: 1
        };
        
        // 기본적으로 max_completion_tokens 사용 (최신 모델 대부분 지원)
        // 구형 모델만 max_tokens 사용
        const modelLower = OPENAI_MODEL.toLowerCase();
        const isLegacyModel = modelLower.startsWith('gpt-4') && 
                             !modelLower.includes('gpt-4o') && 
                             !modelLower.includes('gpt-4-turbo') &&
                             !modelLower.includes('gpt-4o-mini');
        
        if (isLegacyModel) {
            // 구형 모델만 max_tokens 사용
            requestBody.max_tokens = 2000;
        } else {
            // 최신 모델은 max_completion_tokens 사용 (기본값)
            requestBody.max_completion_tokens = 2000;
        }
        
        const data = JSON.stringify(requestBody);

        const dataBuffer = Buffer.from(data, 'utf8');

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Length': dataBuffer.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    // HTTP 에러 상태 코드 확인
                    if (res.statusCode !== 200) {
                        reject(new Error(`OpenAI API HTTP 오류 (${res.statusCode}): ${responseData}`));
                        return;
                    }

                    const jsonResponse = JSON.parse(responseData);
                    if (jsonResponse.error) {
                        reject(new Error(`OpenAI API 오류: ${jsonResponse.error.message}`));
                    } else if (jsonResponse.choices && jsonResponse.choices[0] && jsonResponse.choices[0].message) {
                        const responseText = jsonResponse.choices[0].message.content;
                        const usage = jsonResponse.usage || {};
                        
                        // 토큰 사용량 요약 출력
                        console.log(`\n📊 [${context}] LLM 토큰 사용량:`);
                        console.log(`   모델: ${OPENAI_MODEL}`);
                        console.log(`   입력 데이터: ${inputData.totalChars}자 (프롬프트: ${inputData.prompt}자, 시스템: ${inputData.systemPrompt}자)`);
                        console.log(`   요청 토큰: ${usage.prompt_tokens || 'N/A'}`);
                        console.log(`   응답 토큰: ${usage.completion_tokens || 'N/A'}`);
                        console.log(`   총 토큰: ${usage.total_tokens || 'N/A'}`);
                        console.log(`   응답 길이: ${responseText.length}자`);
                        
                        resolve({
                            response: responseText,
                            usage: {
                                prompt_tokens: usage.prompt_tokens || 0,
                                completion_tokens: usage.completion_tokens || 0,
                                total_tokens: usage.total_tokens || 0,
                                input_chars: inputData.totalChars,
                                response_chars: responseText.length
                            }
                        });
                    } else {
                        reject(new Error(`예상치 못한 응답 형식: ${JSON.stringify(jsonResponse)}`));
                    }
                } catch (error) {
                    reject(new Error(`응답 파싱 오류: ${error.message}, 응답: ${responseData.substring(0, 500)}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`OpenAI API 요청 실패: ${error.message}`));
        });

        req.write(dataBuffer);
        req.end();
    });
}

/**
 * Anthropic Claude API 호출
 */
async function callAnthropicAPI(prompt, systemPrompt, context, inputData) {
    return new Promise((resolve, reject) => {
        const messages = [{ role: 'user', content: prompt }];
        const body = {
            model: ANTHROPIC_MODEL, // 기본값: claude-3-haiku (가장 작은 모델)
            max_tokens: 2000,
            messages: messages
        };

        if (systemPrompt) {
            body.system = systemPrompt;
        }

        const data = JSON.stringify(body);
        const dataBuffer = Buffer.from(data, 'utf8');

        const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Length': dataBuffer.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    // HTTP 에러 상태 코드 확인
                    if (res.statusCode !== 200) {
                        reject(new Error(`Anthropic API HTTP 오류 (${res.statusCode}): ${responseData}`));
                        return;
                    }

                    const jsonResponse = JSON.parse(responseData);
                    if (jsonResponse.error) {
                        reject(new Error(`Anthropic API 오류: ${jsonResponse.error.message}`));
                    } else if (jsonResponse.content && jsonResponse.content[0] && jsonResponse.content[0].text) {
                        const responseText = jsonResponse.content[0].text;
                        const usage = jsonResponse.usage || {};
                        
                        // 토큰 사용량 요약 출력
                        console.log(`\n📊 [${context}] LLM 토큰 사용량:`);
                        console.log(`   모델: ${ANTHROPIC_MODEL}`);
                        console.log(`   입력 데이터: ${inputData.totalChars}자 (프롬프트: ${inputData.prompt}자, 시스템: ${inputData.systemPrompt}자)`);
                        console.log(`   요청 토큰: ${usage.input_tokens || 'N/A'}`);
                        console.log(`   응답 토큰: ${usage.output_tokens || 'N/A'}`);
                        console.log(`   총 토큰: ${(usage.input_tokens || 0) + (usage.output_tokens || 0)}`);
                        console.log(`   응답 길이: ${responseText.length}자`);
                        
                        resolve({
                            response: responseText,
                            usage: {
                                prompt_tokens: usage.input_tokens || 0,
                                completion_tokens: usage.output_tokens || 0,
                                total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
                                input_chars: inputData.totalChars,
                                response_chars: responseText.length
                            }
                        });
                    } else {
                        reject(new Error(`예상치 못한 응답 형식: ${JSON.stringify(jsonResponse)}`));
                    }
                } catch (error) {
                    reject(new Error(`응답 파싱 오류: ${error.message}, 응답: ${responseData.substring(0, 500)}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Anthropic API 요청 실패: ${error.message}`));
        });

        req.write(dataBuffer);
        req.end();
    });
}

module.exports = { callLLM };

