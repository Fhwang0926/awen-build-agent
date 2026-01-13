# 📝 PR 자동 생성 예시

## 🎯 기능 설명

PR을 생성하면 자동으로 다음 정보가 PR 본문에 추가됩니다:

## 📋 자동 생성되는 내용

### 1. 변경 유형
커밋 메시지를 분석하여 자동으로 변경 유형을 감지합니다:

```markdown
## 📋 변경 유형

- ✨ 새로운 기능
- 🐛 버그 수정
- ♻️ 코드 리팩토링
- 📝 문서 업데이트
```

**감지되는 유형:**
- `feat:` → ✨ 새로운 기능
- `fix:` → 🐛 버그 수정
- `refactor:` → ♻️ 코드 리팩토링
- `docs:` → 📝 문서 업데이트
- `test:` → ✅ 테스트 추가/수정
- `chore:` → 🔧 기타 변경

### 2. 변경된 파일
카테고리별로 변경된 파일을 자동 분류합니다:

```markdown
## 📁 변경된 파일

**총 15개 파일** (+234 -89)

- 🔧 백엔드: 8개 파일
- 🎨 프론트엔드: 3개 파일
- ⚙️ 워크플로우: 2개 파일
- 📝 문서: 2개 파일

### 백엔드 파일
- `AnalyzerAgent.js`
- `BuilderAgent.js`
- `DebuggerAgent.js`
- `DeployAgent.js`
- `LLMService.js`
- `api.js`
- `server.js`
- `task_build.js`

### 프론트엔드 파일
- `task/html5/src/index.html`
- `task/vue3/src/App.vue`
- `task/react/react-18/src/App.js`

### 설정 파일
- `package.json`
- `.github/workflows/pr-test.yml`

### 문서 파일
- `README.md`
- `GITHUB_ACTIONS.md`
```

### 3. 커밋 내역
모든 커밋을 작성자, 시간, 해시와 함께 표시합니다:

```markdown
## 📝 커밋 내역 (12개)

- feat: GitHub Actions 워크플로우 추가 (홍길동, 2 hours ago) [a1b2c3d]
- fix: DeployAgent 구문 오류 수정 (홍길동, 3 hours ago) [e4f5g6h]
- refactor: 코드 스타일 통일 (홍길동, 4 hours ago) [i7j8k9l]
- docs: README 업데이트 (홍길동, 5 hours ago) [m0n1o2p]
- feat: PR 자동 생성 기능 추가 (홍길동, 6 hours ago) [q3r4s5t]
- test: 빌드 테스트 추가 (홍길동, 7 hours ago) [u6v7w8x]
- chore: 의존성 업데이트 (홍길동, 8 hours ago) [y9z0a1b]
...
```

### 4. 변경 통계
Git diff 통계를 보기 좋게 표시합니다:

```markdown
## 📊 변경 통계

 .github/workflows/pr-auto-description.yml | 234 +++++++++++++++++++++++++++
 .github/workflows/pr-test.yml             |  89 +++++++++--
 .github/PULL_REQUEST_TEMPLATE.md          |  45 +++---
 README.md                                  |  67 +++++++-
 GITHUB_ACTIONS.md                          | 123 ++++++++++++++
 AnalyzerAgent.js                           |  34 ++--
 BuilderAgent.js                            |  28 ++--
 DeployAgent.js                             |  12 +-
 8 files changed, 567 insertions(+), 65 deletions(-)
```

## 🔄 작동 방식

### 1. PR 생성
```bash
git checkout -b feature/new-feature
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin feature/new-feature
```

### 2. GitHub에서 PR 생성
- Base: `deploy` (또는 `main`, `develop`)
- Compare: `feature/new-feature`
- "Create pull request" 클릭

### 3. 자동 처리
1. **PR 본문 분석**: 기존 수동 작성 내용 보존
2. **커밋 수집**: 베이스 브랜치와 비교하여 커밋 목록 생성
3. **파일 분석**: 변경된 파일을 카테고리별로 분류
4. **통계 계산**: 추가/삭제 라인 수 계산
5. **유형 감지**: 커밋 메시지에서 변경 유형 추출
6. **본문 업데이트**: 자동 생성 섹션 추가
7. **코멘트 추가**: 분석 결과 요약 코멘트

## 📝 수동 내용 보존

PR 템플릿에 작성한 내용은 **자동으로 보존**됩니다:

```markdown
## 💡 개요
이 PR은 새로운 기능을 추가합니다.

## 🎯 변경 이유
사용자 요청에 따라 기능을 추가했습니다.

<!-- 여기까지 수동 작성 내용 -->

<!-- AUTO-GENERATED-START -->
## 📋 변경 유형
...
<!-- AUTO-GENERATED-END -->
```

## 🎨 커스터마이징

### 커밋 개수 변경
`.github/workflows/pr-auto-description.yml`:
```yaml
COMMITS=$(git log ... -20)  # 20 → 원하는 개수
```

### 파일 목록 개수 변경
```yaml
head -10  # 10 → 원하는 개수
```

### 변경 유형 추가
```yaml
HAS_PERF=$(echo "$COMMIT_MESSAGES" | grep -i "^perf" | wc -l)
[ $HAS_PERF -gt 0 ] && TYPES="$TYPES- ⚡ 성능 개선\n"
```

## 💡 Best Practices

### 1. 커밋 메시지 규칙
자동 감지를 위해 Conventional Commits 사용:

```bash
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
refactor: 코드 리팩토링
test: 테스트 추가
chore: 기타 변경
```

### 2. PR 템플릿 활용
수동으로 작성해야 할 내용:
- 💡 개요 (간단한 설명)
- 🎯 변경 이유 (왜 필요한가)
- 🔍 상세 설명 (어떻게 구현했는가)
- ✅ 테스트 방법
- 🔗 관련 이슈

자동으로 생성되는 내용:
- 📋 변경 유형
- 📁 변경된 파일
- 📝 커밋 내역
- 📊 변경 통계

### 3. PR 생성 전 확인
```bash
# 커밋 내역 확인
git log origin/deploy..HEAD --oneline

# 변경된 파일 확인
git diff --name-only origin/deploy..HEAD

# 변경 통계 확인
git diff --stat origin/deploy..HEAD
```

## 🔧 트러블슈팅

### PR 본문이 업데이트되지 않는 경우
1. 워크플로우 실행 확인: Actions 탭
2. 권한 확인: `pull-requests: write` 필요
3. 브랜치 확인: deploy/main/develop로 PR 생성했는지

### 기존 내용이 사라진 경우
- 자동 생성 마커(`<!-- AUTO-GENERATED-START -->`) 이전 내용은 보존됨
- 마커를 수동으로 삭제하지 않았는지 확인

### 커밋이 표시되지 않는 경우
- 베이스 브랜치와 비교하여 새로운 커밋만 표시됨
- `git fetch` 후 다시 확인

## 📚 참고 자료

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions - github-script](https://github.com/actions/github-script)
- [Git Log 포맷](https://git-scm.com/docs/pretty-formats)

