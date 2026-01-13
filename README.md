# 🤖 Awen Build Agent

[![Build Test](https://github.com/YOUR_USERNAME/awen-build-agent/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/awen-build-agent/actions/workflows/test.yml)
[![Deploy](https://github.com/YOUR_USERNAME/awen-build-agent/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/awen-build-agent/actions/workflows/deploy.yml)

LLM 기반 자동 빌드 및 배포 에이전트 시스템

## 📋 개요

Awen Build Agent는 여러 LLM 에이전트가 협력하여 프로젝트의 분석, 빌드, 디버깅, 배포를 자동화하는 지능형 파이프라인 시스템입니다. 코드베이스를 분석하고, Docker 환경에서 빌드하며, 오류 발생 시 자동으로 수정하고, 최종적으로 웹 서버에 배포합니다.

## 🏗️ 아키텍처

시스템은 4개의 전문화된 에이전트로 구성됩니다:

### 1. **AnalyzerAgent** (`AnalyzerAgent.js`)
- **LLM 기반** 프로젝트 구조 및 타입 분석 (HTML5, React, Vue 등)
- 초기 파일 분석 강화:
  - Lockfile 자동 감지 (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
  - 빌드 도구 자동 감지 (`vite`, `webpack`, `nextjs`, `rollup`)
  - 빌드 스크립트 및 artifact 디렉토리 추정
- 기본 빌드 환경 자동 설정 (lockfile 기반 `npm ci` vs `npm install`)
- 프로젝트 파일을 스캔하여 LLM에 전달
- LLM이 빌드 계획 및 Dockerfile 생성 (타임아웃: 60초)
- LLM 실패 시 규칙 기반 분석으로 폴백
- 하위 폴더 자동 탐색 (실제 프로젝트 경로 찾기)

### 2. **BuilderAgent** (`BuilderAgent.js`)
- Docker 컨테이너 기반 빌드 실행
- 프로젝트 마운트 및 빌드 프로세스 관리
- **빌드 진행 상황 실시간 표시** (중요 메시지만 필터링)
- **빌드 성공 여부 자동 평가**:
  - 성공/실패 신호 감지
  - 결과물 파일 확인 및 통계 출력
- 빌드 결과물(artifact) 경로 반환
- 타임아웃: 5분

### 3. **DebuggerAgent** (`DebuggerAgent.js`)
- **LLM 기반** 빌드 에러 분석 (타임아웃: 60초)
- 에러 로그와 프로젝트 파일을 LLM에 전달하여 수정 방법 제안
- LLM이 제안한 수정 사항을 자동으로 코드에 적용
- **자동 에러 수정**:
  - `package.json` 누락 시 자동 생성
  - `build` 스크립트 누락 시 자동 추가
  - `npm ci` 실패 시 `npm install`로 자동 변경
  - 종속성 누락 에러 자동 처리
- 수정된 코드로 재빌드 테스트 (선택적)
- 최대 10회까지 자동 수정 시도
- LLM 실패 시 기본 규칙 기반 수정으로 폴백
- 에러 발생 시에도 계속 진행 (안정성 향상)

### 4. **DeployAgent** (`DeployAgent.js`)
- 빌드 성공한 결과물을 웹 서버에 배포
- Express 기반 웹 서버 관리

## 🚀 시작하기

### 설치

```bash
npm install
```

### 환경 변수 설정

LLM API 키를 설정해야 합니다. OpenAI 또는 Anthropic API를 사용할 수 있습니다.

**방법 1: `.env` 파일 사용 (권장)**

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

> 💡 **팁**: `env.sample` 파일을 참고하여 `.env` 파일을 만들 수 있습니다.

```env
# OpenAI 사용 시
OPENAI_API_KEY=your-openai-api-key-here

# 또는 Anthropic Claude 사용 시
ANTHROPIC_API_KEY=your-anthropic-api-key-here
LLM_PROVIDER=anthropic
```

**방법 2: 환경 변수 직접 설정**

**OpenAI 사용 시:**
```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your-openai-api-key"

# Windows CMD
set OPENAI_API_KEY=your-openai-api-key

# Linux/Mac
export OPENAI_API_KEY="your-openai-api-key"
```

**Anthropic Claude 사용 시:**
```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY="your-anthropic-api-key"
$env:LLM_PROVIDER="anthropic"

# Linux/Mac
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export LLM_PROVIDER="anthropic"
```

### 실행

```bash
node index.js
```

## 📁 프로젝트 구조

```
awen-build-agent/
├── index.js              # 메인 오케스트레이터
├── AnalyzerAgent.js      # 코드베이스 분석 에이전트
├── BuilderAgent.js       # Docker 빌드 에이전트
├── DebuggerAgent.js      # 디버깅 및 수정 에이전트
├── DeployAgent.js        # 배포 에이전트
├── server.js             # Express 웹 서버
├── package.json
└── task/                 # 테스트 프로젝트들
    ├── html5/            # HTML5 프로젝트
    ├── react/            # React 프로젝트 (v16, v17, v18)
    └── vue3/             # Vue 3 프로젝트
```

## 🔄 워크플로우

1. **프로젝트 선택**: 랜덤하게 `task/html5`, `task/react/react-18`, `task/vue3` 중 선택
2. **분석 단계**: 
   - AnalyzerAgent가 파일 구조 스캔 (lockfile, 빌드 도구, 스크립트 확인)
   - 기본 빌드 환경 자동 설정
   - LLM 기반 세부 최적화 (타임아웃: 60초)
3. **빌드 단계**: 
   - BuilderAgent가 Docker 환경에서 프로젝트 빌드
   - 빌드 진행 상황 실시간 표시
   - 빌드 성공 여부 자동 평가 및 결과물 확인
4. **디버깅 단계** (실패 시): 
   - DebuggerAgent가 에러 분석 및 코드 자동 수정
   - LLM 기반 수정 시도 (타임아웃: 60초)
   - 기본 규칙 기반 수정으로 폴백
5. **재시도**: 최대 10회까지 빌드 재시도
6. **배포 단계**: 성공 시 DeployAgent가 웹 서버에 배포

## ⚙️ 설정

`index.js`에서 다음 설정을 변경할 수 있습니다:

- `AVAILABLE_PROJECTS`: 빌드할 프로젝트 목록 (랜덤 선택)
- `MAX_ATTEMPTS`: 최대 빌드 재시도 횟수 (기본값: 10)

`LLMService.js`에서 LLM 모델 설정:

- `OPENAI_MODEL`: OpenAI 모델 (기본값: `gpt-3.5-turbo`)
- `ANTHROPIC_MODEL`: Anthropic 모델 (기본값: `claude-3-haiku-20240307`)

## 🧪 테스트 프로젝트

`task/` 디렉토리에 다양한 테스트 프로젝트가 포함되어 있습니다:

- **HTML5**: 정적 HTML/CSS/JS 프로젝트 (`task/html5`)
- **React**: React 16, 17, 18 버전별 프로젝트 (`task/react/react-16`, `react-17`, `react-18`)
- **Vue3**: Vue 3 + Vite 프로젝트 (`task/vue3`)

프로젝트는 랜덤하게 선택되며, 하위 폴더에 있는 실제 프로젝트를 자동으로 탐색합니다.

## 🛠️ 기술 스택

- **Node.js**: 런타임 환경
- **Docker**: 격리된 빌드 환경
- **Express**: 웹 서버
- **dotenv**: 환경 변수 관리
- **LLM API**: 
  - OpenAI GPT-3.5-turbo (기본, nano 모델)
  - Anthropic Claude (선택)
  - 코드 분석 및 자동 수정에 사용
  - 타임아웃: 60초

## ✨ 주요 기능

- 🔍 **지능형 프로젝트 분석**: 파일 구조, lockfile, 빌드 도구 자동 감지
- 🏗️ **자동 빌드 환경 설정**: lockfile 기반 최적 설치 명령어 선택
- 📊 **실시간 빌드 모니터링**: 진행 상황 실시간 표시 및 성공 여부 자동 평가
- 🩹 **자동 에러 수정**: LLM 기반 에러 분석 및 코드 자동 수정
- 🔄 **자동 재시도**: 최대 10회까지 자동 재시도
- 🎲 **랜덤 프로젝트 선택**: 다양한 프로젝트 타입 자동 테스트
- ⚡ **타임아웃 보호**: LLM 호출 및 빌드 프로세스 타임아웃 설정
- 🛡️ **강화된 에러 처리**: 예기치 않은 종료 방지 및 상세한 에러 로깅

## 📊 LLM 토큰 사용량 추적

각 LLM 호출마다 다음 정보가 자동으로 표시됩니다:

- 모델 이름
- 입력 데이터 크기 (문자 수)
- 요청 토큰 수
- 응답 토큰 수
- 총 토큰 수
- 응답 길이

## 🚀 CI/CD (GitHub Actions)

### 자동 빌드 테스트

#### Push 이벤트 (main, develop, deploy, dev/**)
해당 브랜치에 푸시하면 변경사항을 감지하여 자동으로 빌드 테스트가 실행됩니다:

```bash
git push origin deploy
```

**실행되는 테스트:**
- 변경된 파일 자동 감지
- Node.js 20, 22 버전에서 테스트
- 의존성 설치 검증
- 모든 모듈 실행 오류 검증
- ✅ **에러 없이 실행되는지만 확인**

#### Pull Request 생성 시
PR을 생성하면 자동으로 다음이 실행됩니다:

**1. PR 본문 자동 생성:**
- 📝 커밋 내역 자동 추가
- 📁 변경된 파일 목록 (Backend/Task Projects/설정)
- 📊 변경 통계
- ✅ 체크리스트

**2. 자동 실행 검증:**
- Deploy PR인 경우 전체 검증 실행
- Backend 변경 시 실행 검증 (Node.js 20, 22)
- 모든 모듈이 에러 없이 로드되는지 확인
- 테스트 결과 요약

### 버전 태그 및 배포

#### 수동 태그 생성
GitHub Actions 탭에서 "Auto Create Version Tag" 워크플로우를 실행:

1. GitHub 저장소 → Actions 탭
2. "Auto Create Version Tag" 선택
3. "Run workflow" 클릭
4. 버전 타입 선택 (major/minor/patch)
5. 실행

#### v 태그로 자동 배포
`v*` 형식의 태그를 푸시하면 자동으로 배포가 실행됩니다:

```bash
# 태그 생성
git tag v1.0.0

# 태그 푸시
git push origin v1.0.0
```

**배포 프로세스:**
1. 빌드 및 테스트 (Node.js 20, 22)
2. Docker 이미지 빌드 및 푸시
3. GitHub Release 자동 생성
4. 배포 웹훅 트리거 (설정된 경우)
5. 알림 전송 (설정된 경우)

### GitHub Secrets 설정

다음 Secrets를 설정하면 추가 기능이 활성화됩니다:

#### Docker Registry (선택)
```
DOCKER_REGISTRY=harbor.example.com
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
```

#### 배포 웹훅 (선택)
```
DEPLOY_WEBHOOK_URL=https://your-deploy-webhook.com/deploy
```

#### 알림 웹훅 (선택)
```
NOTIFICATION_WEBHOOK=https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx
```

설정 방법:
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Secret 이름과 값 입력

## 🐛 문제 해결

### 빌드가 계속 실패하는 경우

1. Docker가 실행 중인지 확인
2. LLM API 키가 올바르게 설정되었는지 확인
3. 프로젝트에 `package.json`이 있는지 확인
4. `MAX_ATTEMPTS`를 늘려서 더 많은 재시도 허용

### npm ci 에러 발생 시

시스템이 자동으로 `npm install`로 변경합니다. lockfile 동기화 문제가 있으면 자동으로 처리됩니다.

### LLM 응답이 비어있는 경우

타임아웃(60초)이 발생하거나 LLM API 오류일 수 있습니다. 기본 규칙 기반 분석으로 자동 폴백됩니다.

### GitHub Actions 실패 시

1. Actions 탭에서 실패한 워크플로우 확인
2. 로그를 확인하여 실패 원인 파악
3. 필요한 Secrets가 설정되어 있는지 확인
4. Node.js 버전 호환성 확인

## 📝 라이선스

MIT

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!