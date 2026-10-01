/* 필레몬 캐릭터 스키닝 리그 (SVG + JS)
 * - 본(뼈) 계층: root → pelvis(상체) → head / armL·armR → elbow ;  root → legL·legR
 * - 티셔츠·반바지는 각각 하나의 패스(메시). 꼭짓점마다 본 가중치를 줘서
 *   선형 블렌드 스키닝(LBS)으로 변형 → 팔·다리를 움직이면 소매·바짓단이 같이 늘어나고 따라감
 * - 다리는 반바지 속(엉덩이 관절 위)에서 시작 → 어떤 각도에서도 끊기지 않음
 */
(function (global) {
  // ── 2D 행렬 [a,b,c,d,e,f] (SVG matrix와 동일) ──
  const M = {
    I: () => [1, 0, 0, 1, 0, 0],
    mul: (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
    T: (x, y) => [1, 0, 0, 1, x, y],
    S: (x, y) => [x, 0, 0, y, 0, 0],
    R: (deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; },
    inv: (m) => { const d = m[0] * m[3] - m[1] * m[2]; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; },
    ap: (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]],
    str: (m) => `matrix(${m.map((v) => +v.toFixed(4)).join(",")})`,
  };
  const chain = (...ms) => ms.reduce((a, b) => M.mul(a, b), M.I());

  const C = { Y: "#fdd426", FRAME: "#557a2f", LENS: "#242424", SHIRT: "#f4f1ee", SKIN: "#f9cfac", SKIN_D: "#e9b48b", SHORTS: "#232323", SHOE: "#f4f1ee" };

  // ── 기본 포즈 ──
  const REST = {
    rootX: 0, rootY: 0, bodyX: 0, bodyRot: 0, upperY: 0, sqx: 1, sqy: 1,
    headRot: 0, headY: 0, gx: 0, gy: 0, grot: 0,
    lSh: 10, lEl: -8, rSh: 10, rEl: -8,
    lLeg: 0, rLeg: 0, lLegX: 0, lLegY: 0, rLegX: 0, rLegY: 0,
    lHand: "open", rHand: "open", lj: 0, rj: 0,
  };

  // ── 본 월드 행렬 ──
  function bones(p) {
    const root = M.T(p.rootX, p.rootY);
    const pelvis = chain(root, M.T(p.bodyX, 0), M.T(0, -92), M.R(p.bodyRot), M.T(0, p.upperY), M.S(p.sqx, p.sqy), M.T(0, 92));
    const head = chain(pelvis, M.T(0, -262), M.R(p.headRot), M.T(0, p.headY), M.T(0, 262));
    const armL = chain(pelvis, M.T(-102, -236), M.R(p.lSh));
    const armR = chain(pelvis, M.T(102, -236), M.S(-1, 1), M.R(p.rSh));
    const elL = chain(armL, M.T(0, 50), M.R(p.lEl));
    const elR = chain(armR, M.T(0, 50), M.R(p.rEl));
    const legL = chain(root, M.T(-56 + p.lLegX, -96 + p.lLegY), M.R(p.lLeg));
    const legR = chain(root, M.T(56 + p.rLegX, -96 + p.rLegY), M.R(p.rLeg));
    return { root, pelvis, head, armL, armR, elL, elR, legL, legR };
  }
  const BIND = bones(Object.assign({}, REST, { lSh: 0, lEl: 0, rSh: 0, rEl: 0 }));
  const BIND_INV = Object.fromEntries(Object.entries(BIND).map(([k, m]) => [k, M.inv(m)]));

  // ── 메시 정의: [x, y, {본:가중치}, 모서리여부] (기본 자세 좌표, 원점=발 사이 바닥) ──
  const P = "pelvis";
  const SHIRT = [
    [0, -278, { [P]: 1 }], [70, -272, { [P]: 1 }], [106, -262, { [P]: .5, armR: .5 }],
    [126, -246, { armR: 1 }], [126, -212, { armR: 1 }], [80, -210, { armR: 1 }],
    [96, -194, { [P]: .65, armR: .35 }], [99, -142, { [P]: 1 }], [98, -136, { [P]: 1 }, 1],
    [-98, -136, { [P]: 1 }, 1], [-99, -142, { [P]: 1 }], [-96, -194, { [P]: .65, armL: .35 }],
    [-80, -210, { armL: 1 }], [-126, -212, { armL: 1 }], [-126, -246, { armL: 1 }],
    [-106, -262, { [P]: .5, armL: .5 }], [-70, -272, { [P]: 1 }],
  ];
  const SHORTS = [
    [-96, -148, { [P]: 1 }, 1], [96, -148, { [P]: 1 }, 1], [99, -86, { [P]: .35, legR: .65 }],
    [94, -72, { legR: 1 }, 1], [16, -72, { legR: 1 }, 1], [7, -100, { [P]: .5, legR: .5 }],
    [0, -106, { [P]: 1 }], [-7, -100, { [P]: .5, legL: .5 }], [-16, -72, { legL: 1 }, 1],
    [-94, -72, { legL: 1 }, 1], [-99, -86, { [P]: .35, legL: .65 }],
  ];

  function skin(mesh, B) {
    return mesh.map(([x, y, w, corner]) => {
      let X = 0, Y = 0;
      for (const b in w) {
        const q = M.ap(M.mul(B[b], BIND_INV[b]), [x, y]);
        X += q[0] * w[b]; Y += q[1] * w[b];
      }
      return [X, Y, !!corner];
    });
  }
  // 둥근 닫힌 패스 (모서리 표시된 점은 각지게)
  function smoothPath(pts, k = 1) {
    const n = pts.length; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const k1 = p1[2] ? 0 : k, k2 = p2[2] ? 0 : k;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * k1, p1[1] + (p2[1] - p0[1]) / 6 * k1];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * k2, p2[1] - (p3[1] - p1[1]) / 6 * k2];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  // ── 파츠 SVG ──
  function glassesSVG(id) {
    const lens = "M8 -4 C20 -40 92 -50 136 -32 C152 -24 142 16 110 31 C80 49 30 46 14 26 C4 13 4 6 8 -4 Z";
    const lensIn = "M20 -2 C30 -30 90 -38 124 -24 C136 -18 128 12 104 22 C80 36 38 34 26 18 C18 9 17 5 20 -2 Z";
    const one = `<path d="${lens}" fill="${C.FRAME}"/><path d="${lensIn}" fill="${C.LENS}"/>`;
    const star = "M0 -18 L4 -4 L18 0 L4 4 L0 18 L-4 4 L-18 0 L-4 -4 Z";
    return `<g>${one}</g><g transform="scale(-1,1)">${one}</g><path d="M-14 -6 Q0 -16 14 -6" stroke="${C.FRAME}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
      `<clipPath id="lc-${id}"><path d="${lensIn}"/><path d="${lensIn}" transform="scale(-1,1)"/></clipPath>` +
      `<g clip-path="url(#lc-${id})"><g data-gloss="1" opacity="0"><ellipse cx="-96" cy="-18" rx="16" ry="7" fill="#fff" opacity=".55" transform="rotate(-12 -96 -18)"/><ellipse cx="52" cy="-20" rx="16" ry="7" fill="#fff" opacity=".55" transform="rotate(-12 52 -20)"/></g>` +
      `<g data-shine="1" opacity="0" transform="translate(-200,0) skewX(-22)"><rect x="-24" y="-80" width="38" height="160" fill="#fff"/><rect x="26" y="-80" width="14" height="160" fill="#fff"/></g></g>` +
      `<path data-spark="1" d="${star}" fill="#fff" transform="translate(118,-34) scale(0)"/>`;
  }
  function handsSVG(side) {
    const s = C.SKIN, sd = C.SKIN_D;
    return `<g data-h="${side}open"><circle cx="0" cy="44" r="21" fill="${s}"/><ellipse cx="-17" cy="34" rx="9" ry="11" fill="${s}"/></g>` +
      `<g data-h="${side}fist"><circle cx="0" cy="44" r="21" fill="${s}"/><path d="M-12 40 Q0 46 12 40" stroke="${sd}" stroke-width="3" fill="none"/></g>` +
      `<g data-h="${side}thumb"><circle cx="0" cy="42" r="21" fill="${s}"/><rect x="-8" y="50" width="16" height="32" rx="8" fill="${s}"/><path d="M-14 36 Q0 44 14 36 M-15 46 Q0 54 15 46" stroke="${sd}" stroke-width="3" fill="none"/></g>` +
      `<g data-h="${side}point"><ellipse cx="0" cy="44" rx="21" ry="23" fill="${s}"/><rect x="-21" y="34" width="14" height="52" rx="7" fill="${s}"/><path d="M-4 52 Q6 58 14 50" stroke="${sd}" stroke-width="3" fill="none"/><ellipse cx="8" cy="34" rx="9" ry="7" fill="${s}"/></g>`;
  }

  class Rig {
    /** host: <g> 요소. opts: {x, y, scale, legs, props:{l:svg, r:svg}, id} */
    constructor(host, opts = {}) {
      this.o = Object.assign({ x: 0, y: 0, scale: 1, legs: true, props: {}, id: "r" + Math.random().toString(36).slice(2, 7) }, opts);
      const o = this.o, id = o.id;
      const leg = (side) => `<g data-b="leg${side}"><rect x="-26" y="-30" width="52" height="96" rx="4" fill="${C.SKIN}"/>` +
        `<rect x="${side === "L" ? -54 : -40}" y="42" width="94" height="54" rx="24" fill="${C.SHOE}"/></g>`;
      const upper = (side) => `<g data-b="arm${side}"><rect x="-15" y="10" width="30" height="48" rx="15" fill="${C.SKIN}"/></g>`;
      const arm = (side) =>
        `<g data-b="el${side}"><rect x="-15" y="-10" width="30" height="58" rx="15" fill="${C.SKIN}"/>` +
        `<g transform="translate(0,8)"><g data-j="${side}">${handsSVG(side.toLowerCase())}${o.props[side.toLowerCase()] || ""}</g></g></g>`;
      host.innerHTML =
        `<g transform="translate(${o.x},${o.y}) scale(${o.scale})">` +
        (o.legs ? leg("L") + leg("R") : "") +
        `<path data-m="shorts" fill="${C.SHORTS}"/>` + upper("L") + upper("R") +
        `<path data-m="shirt" fill="${C.SHIRT}"/>` +
        `<g data-b="pelvis"><rect x="-100" y="-292" width="200" height="48" rx="24" fill="${C.Y}"/></g>` +
        `<g data-b="head"><clipPath id="hc-${id}"><ellipse cx="0" cy="-412" rx="156" ry="160"/></clipPath>` +
        `<ellipse cx="0" cy="-412" rx="156" ry="160" fill="${C.Y}"/>` +
        `<g clip-path="url(#hc-${id})"><g transform="translate(0,-412)"><g data-g="1">${glassesSVG(id)}</g></g></g></g>` +
        arm("L") + arm("R") + `</g>`;
      const q = (s) => host.querySelector(s);
      this.el = {
        shirt: q('[data-m="shirt"]'), shorts: q('[data-m="shorts"]'), gl: q("[data-g]"),
        shine: q("[data-shine]"), gloss: q("[data-gloss]"), spark: q("[data-spark]"),
        b: Object.fromEntries([...host.querySelectorAll("[data-b]")].map((e) => [e.dataset.b, e])),
        h: Object.fromEntries([...host.querySelectorAll("[data-h]")].map((e) => [e.dataset.h, e])),
        j: Object.fromEntries([...host.querySelectorAll("[data-j]")].map((e) => [e.dataset.j, e])),
      };
      this.pose({});
    }
    pose(p) {
      p = Object.assign({}, REST, p);
      const B = bones(p), e = this.el;
      const set = (k, m) => e.b[k] && e.b[k].setAttribute("transform", M.str(m));
      set("legL", B.legL); set("legR", B.legR); set("pelvis", B.pelvis); set("head", B.head);
      set("armL", B.armL); set("armR", B.armR); set("elL", B.elL); set("elR", B.elR);
      
      e.shirt.setAttribute("d", smoothPath(skin(SHIRT, B)));
      if (this.o.legs) e.shorts.setAttribute("d", smoothPath(skin(SHORTS, B), .8));
      else e.shorts.setAttribute("d", smoothPath(skin(SHORTS.slice(0, 3).concat([[99, -100, { pelvis: 1 }, 1], [-99, -100, { pelvis: 1 }, 1]]), B)));
      e.gl.setAttribute("transform", `translate(${p.gx.toFixed(2)},${p.gy.toFixed(2)}) rotate(${p.grot.toFixed(2)})`);
      const sh = p.shine || 0, gl = p.gloss || 0;
      e.shine.setAttribute("transform", `translate(${(-200 + 400 * sh).toFixed(1)},0) skewX(-22)`);
      e.shine.setAttribute("opacity", sh > 0 && sh < 1 ? .8 : 0);
      e.gloss.setAttribute("opacity", gl.toFixed(3));
      const sp = Math.sin(Math.min(1, Math.max(0, (sh - .55) / .45)) * Math.PI);
      e.spark.setAttribute("transform", `translate(118,-34) rotate(${(sp * 45).toFixed(1)}) scale(${(sp * 1.3).toFixed(3)})`);
      for (const side of ["l", "r"]) {
        for (const v of ["open", "fist", "thumb", "point"]) {
          const n = e.h[side + v]; if (n) n.style.display = p[side + "Hand"] === v ? "" : "none";
        }
        const j = e.j[side.toUpperCase()]; if (j) j.setAttribute("transform", `translate(0,${-(p[side + "j"] || 0)})`);
      }
    }
  }

  // ── 타임라인 ──
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, Yf = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => { let t = x; for (let i = 0; i < 6; i++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d; } t = Math.min(1, Math.max(0, t)); return Yf(t); };
  }
  const EASE = {
    L: (x) => x, S: bez(.37, 0, .63, 1), C: bez(.65, 0, .35, 1), EO: bez(.16, 1, .3, 1), BO: bez(.34, 1.56, .64, 1), EI: bez(.7, 0, .84, 0),
  };
  /** tracks: {키: [[퍼센트, 값, 이징?], ...]}  — 이징은 그 키에서 다음 키까지의 구간에 적용 (CSS와 동일)
   *  값이 문자열이면 계단식(손 모양 등) */
  function sample(tracks, pct) {
    const out = {};
    for (const k in tracks) {
      const fr = tracks[k];
      if (fr.length === 1) { out[k] = fr[0][1]; continue; }
      let i = fr.length - 1;
      while (i > 0 && fr[i][0] > pct) i--;
      const a = fr[i], b = fr[Math.min(i + 1, fr.length - 1)];
      if (typeof a[1] !== "number" || a === b || b[0] === a[0]) { out[k] = a[1]; continue; }
      const t = (pct - a[0]) / (b[0] - a[0]);
      out[k] = a[1] + (b[1] - a[1]) * (EASE[a[2] || "S"])(Math.min(1, Math.max(0, t)));
    }
    return out;
  }

  global.FeelemonRig = { Rig, sample, EASE, M };
})(window);
