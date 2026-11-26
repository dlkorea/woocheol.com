# woocheol.com 작업 규칙

우철컴퍼니 회사 홈페이지입니다. 여러 앱·서비스(한자경, 보컬 코치, 티커노트 등)의 에이전트가 이 레포를 함께 고칩니다.
회사 홈은 어느 한 앱 쪽으로 기울지 않게 유지합니다. 각 앱은 자기 폴더 안에서 마음껏 홍보합니다.

GitHub Pages가 `main`을 그대로 공개합니다(빌드 단계 없음). `main`에 들어가면 곧바로 공개됩니다.

## 언어

홈·개인정보처리방침·이용약관은 한국어(루트), 영어(`/en/`), 스페인어(`/es/`), 일본어(`/ja/`)로 있습니다. 언어별 홈 목록은 `tools/apps.json`의 `homes`입니다.

- 언어별 페이지는 같은 틀의 정적 HTML 사본입니다. 공용 문구를 바꾸면 네 언어를 함께 바꿉니다. 개인정보처리방침·이용약관은 한국어가 원본이고 번역본에 「한국어판 우선」 안내가 있습니다.
- 모든 페이지는 `<head>`에 네 언어와 `x-default`(영어)의 `hreflang` 링크를, 헤더에 언어 전환(`<nav class="lang">`)을 둡니다. 새 언어 페이지를 만들면 `sitemap.xml`에도 넣습니다.
- 언어를 더하려면 폴더를 만들고 `homes`에 추가합니다(공용 영역 — 사용자 승인).

## 영역

| 영역 | 파일 | 고칠 수 있는 사람 |
|---|---|---|
| 앱 영역 | `tools/apps.json`의 `path` 폴더(예: `/hanja/`) | 그 앱 담당 에이전트 |
| 홈의 내 앱 카드 | 언어별 홈(`index.html`, `en/`·`es/`·`ja/index.html`)마다 `<div class="card" data-app="내-slug">` 한 개, 그 앱의 `MobileApplication` JSON-LD 한 개 | 그 앱 담당 에이전트 |
| 공용 영역 | 위를 뺀 전부: 홈의 제목·설명·첫 화면·회사 소개·앱 섹션 안내 문구, `assets/`, `sitemap.xml`, `404.html`, 언어별 `privacy.html`·`terms.html`, 이 문서, `tools/` | 사용자 승인 필요 |

- 앱 에이전트가 공용 영역을 고쳐야 하면 PR 설명에 이유를 적고 사용자 승인을 받습니다. 예외: `sitemap.xml`에 자기 앱 페이지 줄을 추가·갱신하는 것은 됩니다.
- 다른 앱의 폴더·카드·JSON-LD는 고치지 않습니다.
- 내 앱 카드를 고치면 네 언어 홈의 카드를 함께 고칩니다. 앱 이름은 그 언어 스토어에 쓰는 이름을 쓰고, 그 언어의 이름·주제어를 `tools/apps.json`의 `names`·`keywords`에 넣습니다(공용 영역 검사가 그 언어로도 걸러 냅니다).

## 홈 화면 공정성 규칙 (`tools/check-balance.mjs`가 검사)

1. 홈의 `<title>`, `description`, `og:title`, `og:description`, 첫 화면(hero), 회사 소개, 앱 섹션 안내 문구에는 어떤 앱의 이름이나 주제어(`tools/apps.json`의 `names`, `keywords`)도 넣지 않습니다. 회사 이야기만 합니다.
2. `tools/apps.json`의 모든 앱이 홈에 카드를 정확히 하나씩 가지며, 카드 순서는 `apps` 배열 순서(등록 순)와 같습니다. 순서를 바꾸려면 사용자 승인이 필요합니다.
3. 카드는 모두 같은 틀입니다. `<header class="app-head">`(`<img class="app-icon">` 아이콘 `/assets/apps/<slug>.png` 128px PNG + `<h3>` 앱 이름과 `<span class="app-tagline">` 한 줄 설명) + `<p>` 소개 + `<p class="app-actions">` 스토어 배지 겸 받기 버튼 `<a class="badge">`(웹 서비스는 「웹에서 열기」) + `<p class="app-more">` 보조 링크(개인정보처리방침 등).
   제목·소개 글자 수, 문단·링크·배지 개수의 상한은 `tools/apps.json`의 `limits`로 모두에게 같습니다. 영어·스페인어는 같은 뜻에 글자가 더 들어 `homes`의 `limits`로 글자 수 상한만 늘립니다(그 언어 안에서는 모든 앱이 같음).
4. 카드 안에서 사이트 내부로 가는 링크는 자기 앱 `path` 아래로만 겁니다.
5. 홈의 `MobileApplication`(웹 서비스는 `WebApplication`) JSON-LD는 앱마다 최대 하나이며, 설명 글자 수 상한이 같습니다. 자세한 구조화 데이터는 앱 페이지에 둡니다.

로컬에서 검사: `node tools/check-balance.mjs`

## 새 앱 추가

1. `tools/apps.json`의 `apps` 배열 **맨 끝**에 `slug`, `path`, `names`(앱 이름·패키지명 등, 언어별 이름 포함), `keywords`(앱 주제어, 네 언어)를 추가합니다.
2. 앱 폴더(`/<slug>/`)를 만들고, 아이콘을 `assets/apps/<slug>.png`(128px)로 넣고, 네 언어 홈 `#apps`의 마지막 카드 뒤에 같은 틀로 카드를 추가합니다.
3. `sitemap.xml`에 앱 페이지를 추가합니다.

`tools/apps.json`을 고치는 것은 공용 영역 수정이므로 사용자 승인을 받습니다.

## 작업 방식

- `main`에 직접 푸시하지 않습니다. 자기 브랜치에서 작은 PR로 올립니다.
- PR은 사용자가 머지합니다. 에이전트는 머지하지 않습니다(`gh pr merge --admin` 금지).
- PR이 공용 영역을 건드리면 자동으로 `공용 영역` 라벨이 붙습니다. 이 라벨을 직접 떼지 않습니다.
- 다른 PR과 같은 파일(특히 `index.html`)을 고쳐 충돌하면, 먼저 머지된 쪽에 맞춰 rebase합니다.
