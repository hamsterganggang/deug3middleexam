# deug3middleexam

중간고사 대비 Jekyll 사이트 (GitHub Pages). 과목별로 **이론** / **문제(빈칸)** 메뉴가 있습니다.

## 구조

```
_config.yml              baseurl = /deug3middleexam
_data/subjects.yml       과목 목록 (상단 과목 탭, 홈 카드)
_data/<과목>/quiz.json   빈칸 문제 데이터
_layouts/default.html    공통 헤더 (과목 탭 → 이론/문제 메뉴 → 섹션 바로가기)
_layouts/theory.html     이론 페이지 (본문이 비어 있으면 "준비 중")
_layouts/quiz.html       문제 페이지 (quiz.json 이 없으면 "준비 중")
assets/css/main.css
assets/js/quiz.js        빈칸 채점 엔진 (과목 공통)
index.html               홈
ml/theory.html           머신러닝 이론   → /ml/theory/
ml/quiz.html             머신러닝 문제   → /ml/quiz/
bigdata/theory.html      빅데이터 이론 (준비 중)
bigdata/quiz.html        빅데이터 문제 (준비 중)
```

## 빅데이터 추가하는 법

1. `bigdata/theory.html` 본문에 이론 HTML을 넣고, front matter의 `toc`에 섹션 바로가기를 적습니다.
2. `_data/bigdata/quiz.json`을 `_data/ml/quiz.json`과 같은 형식으로 만듭니다.
   - `answers`: `{ "빈칸번호": ["정답", "허용 답안", ...] }`
   - `sections`: `[{ id, title, items: [{ desc, code }] }]` — `code` 안의 `[[n]]`이 빈칸, `#` 뒤는 주석
3. `_data/subjects.yml`에서 `bigdata`의 `ready`를 `true`로, `desc`를 수정합니다.

새 과목도 같은 방식으로 `subjects.yml`에 한 줄 추가 + `<id>/theory.html`, `<id>/quiz.html`을 만들면 탭이 자동으로 생깁니다.

## 로컬 실행

```
bundle install
bundle exec jekyll serve
# http://localhost:4000/deug3middleexam/
```
