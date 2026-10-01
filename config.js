// ─────────────────────────────────────────────
//  필레몬 스튜디오 포트폴리오 설정
//  이 파일만 고치면 연락처·시트 주소가 바뀝니다.
// ─────────────────────────────────────────────
window.SITE_CONFIG = {
  // 구글 시트 → 파일 → 공유 → 웹에 게시 → "쉼표로 구분된 값(.csv)" 으로 게시한 주소를 붙여넣으세요.
  // 비워두면 같은 폴더의 portfolio.csv 를 읽습니다.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqShD1Wb-IK-O_OjiPZizv6t1JXTzU5bQCc03Rg41vusWiRvb2_u7Cv3mkUrEis0J_G_ozTRoTUqSa/pub?output=csv",

  contactEmail: "gmlaks777@gmail.com",
  youtube: "https://youtube.com/@feelemon_studio",

  // 카테고리 순서와 표시 이름 (시트의 '카테고리' 칸에 왼쪽 키를 적으면 됩니다)
  // 첫 화면 4칸 = 아래 순서. color 는 썸네일이 없을 때 칸 배경색
  categories: [
    { key: "공기업", scene: "public", label: "공기업", en: "PUBLIC", desc: "공기업·금융권 광고, 교육영상, 공익광고", color: "#1d3557" },
    { key: "버츄얼", scene: "virtual", label: "버츄얼", en: "VIRTUAL", desc: "버츄얼 유튜버 롱폼·숏폼 편집", color: "#5b3fd1" },
    { key: "디자인", scene: "design", label: "디자인", en: "DESIGN", desc: "모션그래픽, 로고 인트로, 방송 그래픽", color: "#f9cc14", dark: true },
    { key: "AI", scene: "ai", label: "AI 영상", en: "AI FILM", desc: "AI 생성 광고·PV", color: "#111111" }
  ]
};
