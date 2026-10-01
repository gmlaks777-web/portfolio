(function () {
  const C = window.SITE_CONFIG;
  const $ = (s) => document.querySelector(s);

  // ── CSV (따옴표·줄바꿈 포함 셀 지원) ──
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    text = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = rows.shift().map((h) => h.trim());
    return rows.filter((r) => r.some((v) => v.trim()))
      .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }

  const ytId = (url) => { const m = (url || "").match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/); return m ? m[1] : null; };
  const yes = (v) => /^(y|yes|o|true|1|ㅇ|공개)$/i.test(v || "");
  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const catLabel = (k) => (C.categories.find((c) => c.key === k) || {}).label || k;

  const COLORS = ["#c0392b", "#2e86de", "#16a085", "#8e44ad", "#d35400", "#2c3e50", "#b7950b", "#c2185b", "#00897b", "#5d4037"];
  function ava(name, cls = "") {
    const n = name || "?"; let h = 0;
    for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `<div class="ava ${cls}" style="background:${COLORS[h % COLORS.length]}">${esc(n.trim()[0] || "?")}</div>`;
  }

  // 숏폼 판별: 링크가 /shorts/ 이거나 형식에 '숏폼'·'쇼츠'
  const isShort = (it) => /\/shorts\//.test(it["링크"] || "") || /숏폼|쇼츠|shorts/i.test(it["형식"] || "");
  function thumbHTML(it, small) {
    const id = ytId(it["링크"]);
    if (id && isShort(it) && !it["썸네일"]) {
      // 숏폼 hqdefault(4:3) 가운데 세로 띠가 정확히 9:16 → 그 부분만 잘라 보여주고, 같은 이미지 흐림 배경
      const v = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      return `<div class="thumb short"><img class="sbg" loading="lazy" src="${v}" alt="">` +
        `<img class="sfg" loading="lazy" src="${v}" alt=""><span class="badge">숏폼</span></div>`;
    }
    const src = it["썸네일"] || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
    const badge = id ? "" : it["링크"] ? `<span class="badge">링크 ↗</span>` : "";
    if (src) return `<div class="thumb"><img loading="lazy" src="${esc(src)}" alt="">${badge}</div>`;
    return `<div class="thumb"><div class="ph"><b>${esc(it["제목"])}</b><small>${esc(it["클라이언트"])}</small></div>${badge}</div>`;
  }

  let items = [], cat = "all", query = "";

  // ── 홈 ──
  // 세부 필터: 채널(클라이언트) · 형식 — 시트 값으로 자동 생성
  let sub = { ch: "", fmt: "" }, subCat = null;
  function filtered() {
    const q = query.toLowerCase();
    return items.filter((it) =>
      (cat === "all" || it["카테고리"] === cat) &&
      (!sub.ch || it["클라이언트"] === sub.ch) &&
      (!sub.fmt || (it["형식"] || "").split(/[,/]/).map((x) => x.trim()).includes(sub.fmt)) &&
      (!q || [it["제목"], it["클라이언트"], it["설명"], catLabel(it["카테고리"])].join(" ").toLowerCase().includes(q)));
  }

  function subChips() {
    if (cat === "all") return "";
    if (subCat !== cat) { sub = { ch: "", fmt: "" }; subCat = cat; }
    const inCat = items.filter((it) => it["카테고리"] === cat);
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const chs = uniq(inCat.map((it) => it["클라이언트"]));
    const fmts = uniq(inCat.flatMap((it) => (it["형식"] || "").split(/[,/]/).map((x) => x.trim())));
    const row = (key, label, vals) => vals.length < 2 ? "" :
      `<div class="subrow"><span class="sublabel">${label}</span>` +
      [["", "전체"], ...vals.map((v) => [v, v])].map(([v, l]) =>
        `<button class="sub${sub[key] === v ? " on" : ""}" data-sk="${key}" data-sv="${esc(v)}">${esc(l)}</button>`).join("") + `</div>`;
    const html = row("ch", "채널", chs) + row("fmt", "형식", fmts);
    return html ? `<div class="subchips">${html}</div>` : "";
  }

  function renderHome() {
    const list = filtered();
    $("#view").innerHTML = `${subChips()}<section class="home">${list.length
      ? `<div class="grid">${list.map((it) => `
        <a class="card" href="#/watch/${it._i}">
          ${thumbHTML(it)}
          <div class="info">${ava(it["클라이언트"])}
            <div><h3>${esc(it["제목"])}</h3>
              <div class="ch">${esc(it["클라이언트"])}</div>
              <div class="mt">${esc([catLabel(it["카테고리"]), it["형식"], it["연도"]].filter(Boolean).join(" · "))}</div>
            </div></div>
        </a>`).join("")}</div>`
      : `<p class="empty">${query ? "검색 결과가 없습니다." : "작업을 준비하고 있어요."}</p>`}</section>`;
  }

  // ── 상세(유튜브 시청 화면) ──
  function renderWatch(i) {
    const it = items.find((x) => x._i === i);
    if (!it) { location.hash = "#/"; return; }
    const id = ytId(it["링크"]);
    let player;
    if (id && location.protocol === "file:") {
      // 파일을 직접 연 경우: 유튜브가 주소(리퍼러) 없는 페이지의 임베드를 막음(오류 153) → 썸네일 + 유튜브로 열기
      player = `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.6)">` +
        `<div class="open"><a class="pill dark" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">▶ 유튜브에서 보기</a></div>`;
    } else if (id) player = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="${esc(it["제목"])}"></iframe>`;
    else {
      const bg = it["썸네일"] ? `<img src="${esc(it["썸네일"])}" alt="" style="width:100%;height:100%;object-fit:cover">` : `<div class="ph"><b>${esc(it["제목"])}</b><small>${esc(it["클라이언트"])}</small></div>`;
      player = bg + (it["링크"] ? `<div class="open"><a class="pill dark" href="${esc(it["링크"])}" target="_blank" rel="noopener">열어보기 ↗</a></div>` : "");
    }
    const related = items.filter((x) => x !== it)
      .sort((a, b) => (b["카테고리"] === it["카테고리"]) - (a["카테고리"] === it["카테고리"]));
    const meta = [catLabel(it["카테고리"]), it["연도"]].filter(Boolean).join(" · ");
    $("#view").innerHTML = `<section class="watch">
      <div>
        <div class="player${id && isShort(it) ? " short" : ""}">${player}</div>
        <div class="w-body">
          <h1 class="w-title">${esc(it["제목"])}</h1>
          <div class="owner">${ava(it["클라이언트"])}
            <div class="nm">${esc(it["클라이언트"])}<small>클라이언트</small></div>
            <div class="sp"></div>
            <a class="pill dark" href="mailto:${esc(C.contactEmail)}?subject=${encodeURIComponent("[문의] " + it["제목"] + " 관련")}">비슷한 작업 문의하기</a>
          </div>
          <div class="desc"><div class="mt">${esc(meta)}</div><p>${esc(it["설명"] || "")}</p></div>
        </div>
      </div>
      <aside class="side"><h4>다른 작업</h4>
        ${related.map((r) => `<a class="rel" href="#/watch/${r._i}">${thumbHTML(r, true)}
          <div><h5>${esc(r["제목"])}</h5><span>${esc(r["클라이언트"])}</span><span>${esc(catLabel(r["카테고리"]))}</span></div></a>`).join("")}
      </aside></section>`;
    window.scrollTo(0, 0);
  }

  // ── 첫 화면: 4칸 대문 ──
  function tileBg(key) {
    const list = items.filter((it) => it["카테고리"] === key);
    const pick = list.find((it) => yes(it["대표"]) && (it["썸네일"] || ytId(it["링크"]))) || list.find((it) => it["썸네일"] || ytId(it["링크"]));
    if (!pick) return "";
    return pick["썸네일"] || `https://i.ytimg.com/vi/${ytId(pick["링크"])}/hqdefault.jpg`;
  }
  let mounts = [];
  function renderLanding() {
    mounts.forEach((m) => m.destroy()); mounts = [];
    const live = !!window.FeelemonScenes;
    $("#view").innerHTML = `<section class="gate">${C.categories.map((c) => {
      const n = items.filter((it) => it["카테고리"] === c.key).length;
      const scene = live && c.scene;
      const bg = scene ? "" : tileBg(c.key);
      return `<a class="tile${bg ? " has-img" : ""}${scene ? " has-scene" : ""}${c.dark && !bg ? " ink" : ""}" href="#/c/${encodeURIComponent(c.key)}" style="--tc:${c.color}"${scene ? " data-scene-tile" : ""}>
        ${scene ? `<div class="scene" data-scene="${esc(c.scene)}"></div>` : bg ? `<img src="${esc(bg)}" alt="">` : ""}
        <div class="t-in"><span class="t-en">${esc(c.en || "")}</span><h2>${esc(c.label)}</h2><p>${esc(c.desc)}</p><span class="t-n">${n ? `작업 ${n}개 →` : "준비 중"}</span></div>
      </a>`;
    }).join("")}</section>
    <div class="gate-all"><a class="pill light" href="#/all">전체 작업 보기</a></div>`;
    if (live) document.querySelectorAll("[data-scene]").forEach((el) => mounts.push(window.FeelemonScenes.mount(el, el.dataset.scene)));
  }

  function renderChips() {
    const has = (k) => items.some((it) => it["카테고리"] === k);
    const b = (k, l) => `<a href="${k === "all" ? "#/all" : "#/c/" + encodeURIComponent(k)}" class="${cat === k ? "on" : ""}">${esc(l)}</a>`;
    $("#chips").innerHTML = b("all", "전체") + C.categories.filter((c) => has(c.key)).map((c) => b(c.key, c.label)).join("");
  }

  function route() {
    const h = decodeURIComponent(location.hash);
    const w = h.match(/^#\/watch\/(\d+)/), c = h.match(/^#\/c\/(.+)$/);
    if (!(h === "" || h === "#/" || h === "#")) { mounts.forEach((m) => m.destroy()); mounts = []; }
    if (w) { $("#chips").style.display = "none"; renderWatch(+w[1]); return; }
    if (c || h === "#/all") {
      cat = c ? c[1] : "all"; $("#chips").style.display = ""; renderChips(); renderHome(); window.scrollTo(0, 0); return;
    }
    cat = "all"; query = ""; $("#q").value = ""; $("#chips").style.display = "none"; renderLanding();
  }

  // ── 이벤트 ──
  $("#view").addEventListener("click", (e) => {
    const b = e.target.closest("button.sub"); if (!b) return;
    sub[b.dataset.sk] = b.dataset.sv; renderHome();
  });
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault(); query = $("#q").value.trim();
    if (/^#\/(all|c\/)/.test(location.hash)) renderHome(); else location.hash = "#/all";
  });
  $("#q").addEventListener("input", (e) => { if (!e.target.value) { query = ""; if (/^#\/(all|c\/)/.test(location.hash)) renderHome(); } });
  $("#sToggle").addEventListener("click", () => { $("#bar").classList.add("searching"); $("#q").focus(); });
  $("#q").addEventListener("blur", () => setTimeout(() => $("#bar").classList.remove("searching"), 150));
  window.addEventListener("hashchange", route);

  // 연락처
  $("#mailLink").href = "mailto:" + C.contactEmail;
  $("#mailFoot").href = "mailto:" + C.contactEmail; $("#mailFoot").textContent = C.contactEmail;
  $("#ytLink").href = C.youtube; $("#yr").textContent = new Date().getFullYear();

  // ── 데이터 로드: 구글 시트 → portfolio.csv → (파일을 직접 연 경우) portfolio-data.js 사본 ──
  function ingest(t) {
    items = parseCSV(t || "공개\n").filter((it) => yes(it["공개"])).map((it, i) => ({ ...it, _i: i }));
    items.sort((a, b) => yes(b["대표"]) - yes(a["대표"]) || a._i - b._i);   // 대표작 먼저
    route();
  }
  const load = (u) => fetch(u, { cache: "no-store" }).then((r) => { if (!r.ok) throw 0; return r.text(); });
  (C.sheetCsvUrl ? load(C.sheetCsvUrl).catch(() => load("portfolio.csv")) : load("portfolio.csv"))
    .catch(() => window.PORTFOLIO_CSV || "")
    .then(ingest);
})();
