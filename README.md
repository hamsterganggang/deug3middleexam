# deug3middleexam

중간고사 대비 Jekyll 사이트 (GitHub Pages). 과목별로 **이론** / **문제(빈칸)** 메뉴가 있습니다.

## 구조

```
_config.yml              baseurl = /deug3middleexam
_data/subjects.yml       과목 목록 (상단 과목 탭, 홈 카드)
_data/<과목>/quiz.json   문제 데이터 (type 없음 = 코드 빈칸, type: qa = 주관식)
_layouts/default.html    공통 헤더 (과목 탭 → 이론/문제 메뉴 → 섹션 바로가기)
_layouts/theory.html     이론 페이지 (본문이 비어 있으면 "준비 중")
_layouts/quiz.html       문제 페이지 (quiz.json 이 없으면 "준비 중")
_includes/ml/fig/        머신러닝 노트 그림 (SVG)
assets/css/main.css
assets/js/blank.js       코드 빈칸 엔진
assets/js/qa.js          주관식(스스로 채점) 엔진
index.html               홈
ml/theory.html           머신러닝 이론 (딥러닝 입문 노트 1~8장) → /ml/theory/
ml/quiz.html             머신러닝 예상 문제 54개 → /ml/quiz/
bigdata/theory.html      빅데이터 이론 (Ch10) → /bigdata/theory/
bigdata/quiz.html        빅데이터 코드 빈칸 77개 → /bigdata/quiz/
```

## 내용 추가하는 법

1. 이론: `<과목>/theory.html` 본문에 HTML을 넣고, front matter의 `toc`에 섹션 바로가기를 적습니다.
2. 문제: `_data/<과목>/quiz.json`
   - 코드 빈칸 (빅데이터 형식): `answers: { "번호": ["정답", ...] }`, `sections: [{ id, title, items: [{ desc, code }] }]` — `code` 안의 `[[n]]`이 빈칸
   - 주관식 (머신러닝 형식): `"type": "qa"`, `sections: [{ id, title, items: [{ q, a }] }]`

새 과목도 같은 방식으로 `subjects.yml`에 한 줄 추가 + `<id>/theory.html`, `<id>/quiz.html`을 만들면 탭이 자동으로 생깁니다.

## 로컬 실행

```
bundle install
bundle exec jekyll serve
# http://localhost:4000/deug3middleexam/
```
