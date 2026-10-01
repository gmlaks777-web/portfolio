/* 대문 4칸 장면 정의 + 실행기
 * 각자 자기 일을 8초 루프로 하다가, 칸에 마우스를 올리면(모바일은 터치) 하던 일을 멈추고 정면을 본다. */
(function () {
  const { Rig, sample } = window.FeelemonRig;
  const LOOP = 8000;

  // 손 미세동작(타이핑·필기): windows 동안 period(%) 간격으로 위아래
  function taps(windows, period = 3.125, amp = 5) {
    const fr = [[0, 0, "L"]];
    for (const [a, b] of windows) {
      for (let t = a; t < b - 0.5; t += period) fr.push([t, 0, "S"], [t + period / 2, amp, "S"]);
      fr.push([b, 0, "L"]);
    }
    fr.push([100, 0, "L"]);
    const seen = new Set();
    return fr.filter((f) => !seen.has(f[0]) && seen.add(f[0])).sort((x, y) => x[0] - y[0]);
  }
  const hold = (v) => [[0, v]];

  // ════ ① 공기업: 서류 검토하며 체크 → 고개 들어 관공서 한번 → 다시 체크 ════
  const PUBLIC = {
    rig: { x: 1205, y: 772, scale: 1, legs: true }, focus: [1205, 420],
    tracks: {
      lSh: [[0, 16, "C"], [34, 16, "S"], [40, 18, "C"], [52, 18, "S"], [58, 16], [100, 16]],
      lEl: [[0, -122, "C"], [34, -122, "S"], [40, -98, "C"], [52, -98, "S"], [58, -122], [100, -122]],
      rSh: [[0, 6, "C"], [30, 6, "S"], [36, 24, "C"], [52, 24, "S"], [56, 6], [100, 6]],
      rEl: [[0, -104, "C"], [30, -104, "S"], [36, -100, "C"], [52, -100, "S"], [56, -104], [100, -104]],
      rj: taps([[2, 28], [58, 90]], 2.5, 6),
      headRot: [[0, -3, "C"], [34, -3, "S"], [40, 5, "C"], [52, 5, "S"], [58, -3], [100, -3]],
      bodyRot: [[0, -1, "C"], [34, -1, "S"], [42, 1.5, "C"], [52, 1.5, "S"], [58, -1], [100, -1]],
      gx: [[0, -10, "C"], [36, -10, "S"], [42, 18, "C"], [52, 18, "S"], [58, -10], [100, -10]],
      gy: [[0, 16, "C"], [36, 16, "S"], [42, -4, "C"], [52, -4, "S"], [58, 16], [100, 16]],
      grot: [[0, -4, "C"], [36, -4, "S"], [42, 5, "C"], [52, 5, "S"], [58, -4], [100, -4]],
      lHand: hold("none"), rHand: hold("none"),
      "op:.ck0": [[0, "0"], [8, "1"]], "op:.ck1": [[0, "0"], [18, "1"]], "op:.ck2": [[0, "0"], [70, "1"]],
    },
  };

  // ════ ② 버츄얼: 방송 중 타이핑, 가끔 마우스 클릭 ════
  const VIRTUAL = {
    rig: { x: 1290, y: 712, scale: 1.05, legs: true }, focus: [1290, 350], headroom: 60,
    tracks: {
      lSh: hold(74), lEl: hold(-122),
      rSh: [[0, 70, "C"], [38, 70, "S"], [43, 58, "S"], [52, 58, "S"], [56, 70], [100, 70]],
      rEl: [[0, -116, "C"], [38, -116, "S"], [43, -96, "EO"], [46, -103, "S"], [48, -96, "EO"], [50, -103, "S"], [52, -96, "S"], [56, -116], [100, -116]],
      lj: taps([[0, 100]]), rj: taps([[0, 38], [56, 100]]),
      headRot: [[0, -3, "C"], [38, -3, "S"], [44, -1, "C"], [52, -1, "S"], [58, -3], [100, -3]],
      upperY: [[0, 0, "S"], [25, 2, "S"], [50, 0, "S"], [75, 2, "S"], [100, 0]],
      gx: [[0, -24, "C"], [40, -24, "S"], [45, 8, "C"], [52, 8, "S"], [57, -24], [100, -24]],
      gy: [[0, 4, "C"], [40, 4, "S"], [45, 10, "C"], [52, 10, "S"], [57, 4], [100, 4]],
      grot: hold(-6),
    },
  };

  // ════ ③ 디자인: 붓질 3번 → 한 발 물러나 감상 → 다가가 붓질 3번 ════
  const P = [96, -22];
  const strokes = (bases) => {
    const sh = [], el = [];
    for (const b of bases) {
      sh.push([b, P[0], "EO"], [b + 3, P[0] + 4, "C"], [b + 5, P[0] + 4, "C"], [b + 9, P[0], "C"]);
      el.push([b, P[1], "EO"], [b + 3, -8, "C"], [b + 5, -8, "C"], [b + 9, P[1], "C"]);
    }
    return [sh, el];
  };
  const [s1, e1] = strokes([0, 11, 22]), [s2, e2] = strokes([60, 71, 82]);
  const DESIGN = {
    rig: { x: 1165, y: 790, scale: 1.05, legs: true }, focus: [1165, 420],
    tracks: {
      rSh: [...s1, [33, P[0], "S"], [40, 40, "C"], [48, 40, "S"], [58, P[0], "C"], ...s2, [93, P[0]], [100, P[0]]],
      rEl: [...e1, [33, P[1], "S"], [40, -10, "C"], [48, -10, "S"], [58, P[1], "C"], ...e2, [93, P[1]], [100, P[1]]],
      lSh: [[0, 22, "C"], [33, 22, "S"], [40, 18, "C"], [48, 18, "S"], [58, 22], [100, 22]],
      lEl: [[0, -104, "C"], [33, -104, "S"], [40, -96, "C"], [48, -96, "S"], [58, -104], [100, -104]],
      // 걸음: 상체와 다리를 따로 (발 미끄러짐 없음)
      bodyX: [[0, 0], [33, 0, "C"], [37, -22, "C"], [41, -44], [50, -44, "C"], [54, -22, "C"], [58, 0], [100, 0]],
      lLegX: [[0, 0], [33, 0, "EO"], [35, -22, "C"], [37, -44], [50, -44, "EO"], [52, -22, "C"], [54, 0], [100, 0]],
      lLegY: [[0, 0], [33, 0, "EO"], [35, -16, "C"], [37, 0], [50, 0, "EO"], [52, -16, "C"], [54, 0], [100, 0]],
      rLegX: [[0, 0], [37, 0, "EO"], [39, -22, "C"], [41, -44], [54, -44, "EO"], [56, -22, "C"], [58, 0], [100, 0]],
      rLegY: [[0, 0], [37, 0, "EO"], [39, -16, "C"], [41, 0], [54, 0, "EO"], [56, -16, "C"], [58, 0], [100, 0]],
      headRot: [[0, 3, "C"], [33, 3, "BO"], [42, 10, "S"], [46, 7, "S"], [50, 10, "C"], [58, 3], [100, 3]],
      gx: [[0, 22, "C"], [36, 22, "S"], [42, 16, "C"], [52, 16, "S"], [58, 22], [100, 22]],
      gy: [[0, 4, "C"], [36, 4, "S"], [42, -2, "C"], [52, -2, "S"], [58, 4], [100, 4]],
      grot: hold(6), lHand: hold("none"), rHand: hold("none"),
      upperY: [[0, 0, "S"], [25, 1.5, "S"], [50, 0, "S"], [75, 1.5, "S"], [100, 0]],
    },
  };

  // ════ ④ AI 영상: 로봇 조종 — 레버를 밀면 부스트 상승, 다시 천천히 하강 ════
  const G = [46, -70];
  const AI = {
    rig: { x: 1290, y: 742, scale: 0.92, legs: false }, focus: [1290, 420],
    tracks: {
      lSh: [[0, G[0], "S"], [10, G[0] + 4, "S"], [18, G[0], "C"], [22, G[0] + 10, "EO"], [34, G[0] + 10, "C"], [42, G[0], "S"], [60, G[0] + 4, "S"], [80, G[0], "S"], [100, G[0]]],
      lEl: [[0, G[1], "S"], [10, G[1] - 6, "S"], [18, G[1], "C"], [22, G[1] - 14, "EO"], [34, G[1] - 14, "C"], [42, G[1], "S"], [60, G[1] - 6, "S"], [80, G[1], "S"], [100, G[1]]],
      rSh: [[0, G[0], "S"], [14, G[0] + 4, "S"], [18, G[0], "C"], [22, G[0] + 10, "EO"], [34, G[0] + 10, "C"], [42, G[0], "S"], [70, G[0] + 4, "S"], [88, G[0], "S"], [100, G[0]]],
      rEl: [[0, G[1], "S"], [14, G[1] - 6, "S"], [18, G[1], "C"], [22, G[1] - 14, "EO"], [34, G[1] - 14, "C"], [42, G[1], "S"], [70, G[1] - 6, "S"], [88, G[1], "S"], [100, G[1]]],
      headRot: [[0, -2, "C"], [44, -2], [100, -2]],
      headY: [[0, 0, "C"], [20, 0, "EO"], [24, 5, "BO"], [32, -2, "S"], [44, 0], [100, 0]],
      gx: hold(-14), gy: hold(-2), grot: hold(-3), lHand: hold("fist"), rHand: hold("fist"),
    },
  };

  const SCENES = { public: PUBLIC, virtual: VIRTUAL, design: DESIGN, ai: AI };

  /** container 안에 장면을 그리고 실행. 반환: {destroy} */
  function mount(container, id) {
    const sc = SCENES[id];
    container.innerHTML = window.FEELEMON_BG[id];
    const svg = container.querySelector("svg");
    svg.style.width = "100%"; svg.style.height = "100%"; svg.style.display = "block";
    const host = svg.querySelector("[data-rig]");
    const props = (window.FEELEMON_PROPS || {})[id] || {};
    const rig = new Rig(host, Object.assign({ id, props }, sc.rig));
    const opEls = {};
    for (const k in sc.tracks) if (k.startsWith("op:")) opEls[k] = [...svg.querySelectorAll(k.slice(3))];
    const syncEls = [...svg.querySelectorAll(".sync")];
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    let t = 0, last = performance.now(), paused = false, att = 0, raf, hoverAt = 0;
    const W = 1706, H = 922, ZOOM = 0.55;
    const setHover = (on) => {
      if (on && !paused) hoverAt = performance.now();
      paused = on;
      for (const el of syncEls) el.style.animationPlayState = on ? "paused" : "";
    };
    const tile = container.closest("[data-scene-tile]") || container;
    tile.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") setHover(true); });
    tile.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") setHover(false); });
    tile.addEventListener("touchstart", () => setHover(!paused), { passive: true });

    function frame(now) {
      const dt = Math.min(64, now - last); last = now;
      if (!paused && !reduce) t = (t + dt) % LOOP;
      att += ((paused ? 1 : 0) - att) * (1 - Math.pow(0.0001, 0.8 * dt / 1000)); // 줌 속도 80% // 부드럽게 0↔1
      const v = sample(sc.tracks, (t / LOOP) * 100);
      // 호버: 정면 보기 + 고개 살짝 들기
      const k = att;
      v.gx = (v.gx || 0) * (1 - k); v.gy = (v.gy || 0) * (1 - k); v.grot = (v.grot || 0) * (1 - k);
      v.headRot = (v.headRot || 0) * (1 - k);
      v.headY = (v.headY || 0) - 10 * Math.sin(Math.min(1, k) * Math.PI / 2);
      // 안경 반짝: 호버 0.15초 뒤 빛 줄기가 렌즈를 한 번 쓸고 지나감 + 광택
      v.shine = paused ? Math.min(1, Math.max(0, (now - hoverAt - 190) / 810)) : 0;
      v.gloss = k;
      rig.pose(v);
      // 얼굴 클로즈업: viewBox를 얼굴 쪽으로 좁힘
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const z = 1 + ZOOM * e, w = W / z, h = H / z;
      const fx = sc.focus[0] + (v.bodyX || 0) * sc.rig.scale, fy = sc.focus[1];
      // 얼굴이 화면 오른쪽(가로 70%)에 오도록 → 왼쪽 아래 텍스트와 안 겹침
      const tx = fx - w * 0.70, ty = fy - h * 0.46;
      // 머리 위 여유(headroom): 칸이 가로로 길어 위아래가 잘릴 때, 잘리는 범위 안에서 장면을 아래로 내림
      let sy = 0;
      if (sc.headroom) { const r = svg.getBoundingClientRect(); if (r.width) sy = -Math.min(sc.headroom, Math.max(0, (H - W * r.height / r.width) / 2)); }
      const vx = Math.min(W - w, Math.max(0, tx * e)), vy = Math.min(H - h, Math.max(0, ty * e)) + sy * (1 - e);
      svg.setAttribute("viewBox", `${vx.toFixed(1)} ${vy.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
      for (const key in opEls) for (const el of opEls[key]) el.setAttribute("opacity", v[key]);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const api = { destroy: () => cancelAnimationFrame(raf), seek: (ms) => { t = ms % LOOP; }, freeze: (f) => { paused = f; } };
    (window.__feelemonMounts = window.__feelemonMounts || []).push(api);
    return api;
  }

  window.FeelemonScenes = { mount, ids: Object.keys(SCENES) };
})();
