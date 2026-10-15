/**
 * Vẽ ảnh bìa, ảnh nghệ sĩ và icon ứng dụng bằng SVG (sau đó sharp chuyển sang JPG/PNG).
 * Tất cả đều là hình minh hoạ tự sinh — không dùng ảnh có bản quyền.
 */
import { createRng, hashString } from './synth.mjs';

const W = 1000;

const fmt = (n) => Math.round(n * 10) / 10;

function grain(opacity = 0.07, freq = 0.85) {
  return `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="${W}" height="${W}" filter="url(#grain)" opacity="${opacity}"/>`;
}

function vignette(strength = 0.55) {
  return `
  <radialGradient id="vig" cx="50%" cy="50%" r="72%">
    <stop offset="55%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="${strength}"/>
  </radialGradient>
  <rect width="${W}" height="${W}" fill="url(#vig)"/>`;
}

function blurFilters() {
  return [2, 5, 10, 18, 30, 60]
    .map((s) => `<filter id="b${s}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`)
    .join('');
}

function svg(body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><defs>${blurFilters()}${defs}</defs>${body}</svg>`;
}

function bokeh(rng, colors, count, { yMin = 0, yMax = W, rMin = 12, rMax = 60, opacity = [0.2, 0.6] } = {}) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const r = rng.range(rMin, rMax);
    const blur = r > 40 ? 'b18' : r > 22 ? 'b10' : 'b5';
    out += `<circle cx="${fmt(rng.range(0, W))}" cy="${fmt(rng.range(yMin, yMax))}" r="${fmt(r)}" fill="${rng.pick(colors)}" opacity="${fmt(rng.range(...opacity) * 100) / 100}" filter="url(#${blur})"/>`;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Chủ đề ảnh bìa album                                                */
/* ------------------------------------------------------------------ */

/** Thành phố đêm mưa nhìn qua ô kính (Glass Hours). */
function cityRain(rng, palette) {
  const horizon = 640;
  let skyline = '';
  let windows = '';
  let neon = '';
  let x = -20;
  while (x < W + 20) {
    const w = rng.range(50, 120);
    const h = rng.range(180, 520);
    const y = horizon - h;
    skyline += `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h + 4)}" fill="#0e1430"/>`;
    for (let wy = y + 14; wy < horizon - 14; wy += 18) {
      for (let wx = x + 8; wx < x + w - 10; wx += 14) {
        if (rng.chance(0.33)) {
          windows += `<rect x="${fmt(wx)}" y="${fmt(wy)}" width="7" height="9" fill="${rng.pick(palette)}" opacity="${fmt(rng.range(0.35, 0.95) * 100) / 100}"/>`;
        }
      }
    }
    if (rng.chance(0.35)) {
      const c = rng.pick(palette);
      neon += `<rect x="${fmt(x + w * 0.3)}" y="${fmt(y + rng.range(20, 120))}" width="${fmt(rng.range(10, 18))}" height="${fmt(rng.range(60, 160))}" rx="4" fill="${c}" opacity="0.95"/>`;
    }
    x += w + rng.range(-6, 10);
  }
  let streaks = '';
  for (let i = 0; i < 140; i++) {
    const sx = rng.range(0, W);
    const sy = rng.range(-50, W);
    const len = rng.range(30, 120);
    streaks += `<line x1="${fmt(sx)}" y1="${fmt(sy)}" x2="${fmt(sx - len * 0.12)}" y2="${fmt(sy + len)}" stroke="#dbe9ff" stroke-width="${fmt(rng.range(0.8, 2.2))}" opacity="${fmt(rng.range(0.06, 0.2) * 100) / 100}"/>`;
  }
  let drops = '';
  for (let i = 0; i < 160; i++) {
    const r = rng.range(2, 10);
    const dx = rng.range(0, W);
    const dy = rng.range(0, W);
    drops += `<circle cx="${fmt(dx)}" cy="${fmt(dy)}" r="${fmt(r)}" fill="#ffffff" opacity="${fmt(rng.range(0.06, 0.18) * 100) / 100}"/><circle cx="${fmt(dx - r * 0.3)}" cy="${fmt(dy - r * 0.35)}" r="${fmt(r * 0.3)}" fill="#ffffff" opacity="0.45"/>`;
  }
  const reflect = Array.from({ length: 26 }, () => {
    const rx = rng.range(0, W);
    return `<rect x="${fmt(rx)}" y="${horizon}" width="${fmt(rng.range(6, 26))}" height="${fmt(rng.range(120, 340))}" fill="${rng.pick(palette)}" opacity="${fmt(rng.range(0.2, 0.55) * 100) / 100}"/>`;
  }).join('');
  return svg(
    `<rect width="${W}" height="${W}" fill="url(#sky)"/>
     ${bokeh(rng, palette, 14, { yMax: horizon - 100, rMin: 30, rMax: 90, opacity: [0.15, 0.35] })}
     <g filter="url(#b2)">${skyline}${windows}</g>
     <g filter="url(#b10)">${neon}</g><g opacity="0.8">${neon}</g>
     <rect y="${horizon}" width="${W}" height="${W - horizon}" fill="url(#water)"/>
     <g filter="url(#b10)">${reflect}</g>
     ${bokeh(rng, palette, 28, { rMin: 14, rMax: 70, opacity: [0.18, 0.55] })}
     <g filter="url(#b2)">${streaks}</g>
     ${drops}`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#091127"/><stop offset=".55" stop-color="#1b1d4a"/><stop offset="1" stop-color="#2a1236"/></linearGradient>
     <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1840"/><stop offset="1" stop-color="#07091a"/></linearGradient>`,
  ).replace('</svg>', `${vignette(0.6)}${grain(0.06)}</svg>`);
}

/** Mái nhà phố cổ lúc chạng vạng, mưa (lo-fi Hà Nội). */
function rooftops(rng, palette) {
  let houses = '';
  let lights = '';
  let x = -10;
  const base = 1000;
  while (x < W) {
    const w = rng.range(70, 130);
    const h = rng.range(260, 560);
    const y = base - h;
    const roof = rng.range(30, 70);
    houses += `<path d="M${fmt(x)} ${base} V${fmt(y + roof)} L${fmt(x + w / 2)} ${fmt(y)} L${fmt(x + w)} ${fmt(y + roof)} V${base} Z" fill="#1a1626"/>`;
    for (let wy = y + roof + 30; wy < base - 60; wy += rng.range(60, 90)) {
      if (rng.chance(0.55)) {
        const ww = rng.range(18, 30);
        const wx = x + rng.range(10, w - ww - 10);
        const c = rng.pick(['#ffcf7a', '#ffb35c', '#ffe3a8']);
        lights += `<rect x="${fmt(wx)}" y="${fmt(wy)}" width="${fmt(ww)}" height="${fmt(ww * 1.3)}" rx="2" fill="${c}" opacity="${fmt(rng.range(0.6, 1) * 100) / 100}"/>`;
      }
    }
    x += w + rng.range(-8, 4);
  }
  let wires = '';
  for (let i = 0; i < 4; i++) {
    const y1 = rng.range(220, 420);
    const y2 = rng.range(220, 420);
    wires += `<path d="M-20 ${fmt(y1)} Q 500 ${fmt(Math.max(y1, y2) + rng.range(40, 120))} 1020 ${fmt(y2)}" stroke="#14111f" stroke-width="3" fill="none" opacity="0.85"/>`;
  }
  let rain = '';
  for (let i = 0; i < 220; i++) {
    const sx = rng.range(0, W);
    const sy = rng.range(-40, W);
    const len = rng.range(18, 60);
    rain += `<line x1="${fmt(sx)}" y1="${fmt(sy)}" x2="${fmt(sx - len * 0.25)}" y2="${fmt(sy + len)}" stroke="#e8eeff" stroke-width="1.6" opacity="${fmt(rng.range(0.1, 0.32) * 100) / 100}"/>`;
  }
  return svg(
    `<rect width="${W}" height="${W}" fill="url(#sky)"/>
     <circle cx="${fmt(rng.range(250, 750))}" cy="380" r="210" fill="#ffb38a" opacity="0.35" filter="url(#b60)"/>
     ${bokeh(rng, palette, 10, { yMin: 100, yMax: 500, rMin: 30, rMax: 80, opacity: [0.1, 0.3] })}
     ${wires}${houses}
     <g filter="url(#b10)">${lights}</g>${lights}
     ${bokeh(rng, ['#ffcf7a', '#ffb35c'], 12, { yMin: 500, yMax: 1000, rMin: 18, rMax: 50, opacity: [0.25, 0.6] })}
     <g filter="url(#b2)">${rain}</g>`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262a4d"/><stop offset=".55" stop-color="#6b5576"/><stop offset="1" stop-color="#e3a07a"/></linearGradient>`,
  ).replace('</svg>', `${vignette(0.5)}${grain(0.09)}</svg>`);
}

/** Mặt trời synthwave, núi và lưới phối cảnh. */
function gridSun(rng) {
  const horizon = 600;
  let grid = '';
  for (let i = -14; i <= 14; i++) {
    grid += `<line x1="${500 + i * 18}" y1="${horizon}" x2="${500 + i * 150}" y2="${W}" stroke="#ff2fb3" stroke-width="2.5"/>`;
  }
  for (let j = 1; j < 12; j++) {
    const y = horizon + Math.pow(j / 11, 2.1) * (W - horizon);
    grid += `<line x1="0" y1="${fmt(y)}" x2="${W}" y2="${fmt(y)}" stroke="#ff2fb3" stroke-width="2.5"/>`;
  }
  let stripes = '';
  for (let k = 0; k < 7; k++) {
    const y = 470 + k * 20;
    stripes += `<rect x="0" y="${y}" width="${W}" height="${4 + k * 1.6}" fill="#000"/>`;
  }
  let stars = '';
  for (let i = 0; i < 90; i++) {
    stars += `<circle cx="${fmt(rng.range(0, W))}" cy="${fmt(rng.range(0, 420))}" r="${fmt(rng.range(0.8, 2.6))}" fill="#fff" opacity="${fmt(rng.range(0.3, 0.9) * 100) / 100}"/>`;
  }
  const mountain = (seed, color, amp, yBase) => {
    const r = createRng(seed);
    let d = `M0 ${horizon}`;
    for (let px = 0; px <= W; px += 50) d += ` L${px} ${fmt(yBase - r.range(0, amp))}`;
    return `<path d="${d} L${W} ${horizon} Z" fill="${color}"/>`;
  };
  return svg(
    `<rect width="${W}" height="${W}" fill="url(#sky)"/>${stars}
     <circle cx="500" cy="440" r="250" fill="#ff2fb3" opacity="0.5" filter="url(#b60)"/>
     <g mask="url(#sunmask)"><circle cx="500" cy="440" r="200" fill="url(#sun)"/></g>
     ${mountain(11, '#2a0d4a', 120, horizon - 10)}
     ${mountain(23, '#12062a', 70, horizon)}
     <rect y="${horizon}" width="${W}" height="${W - horizon}" fill="url(#floor)"/>
     <g filter="url(#b5)" opacity="0.9">${grid}</g><g opacity="0.85">${grid}</g>
     <rect y="${horizon - 6}" width="${W}" height="12" fill="#ff7ad9" opacity="0.6" filter="url(#b10)"/>`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0420"/><stop offset=".6" stop-color="#2a0f4f"/><stop offset="1" stop-color="#5c1a5c"/></linearGradient>
     <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff2f8f"/></linearGradient>
     <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0631"/><stop offset="1" stop-color="#05010f"/></linearGradient>
     <mask id="sunmask"><rect width="${W}" height="${W}" fill="#fff"/>${stripes}</mask>`,
  ).replace('</svg>', `${grain(0.06)}</svg>`);
}

/** Bông hoa trừu tượng ấm áp (neo-soul). */
function bloom(rng, palette) {
  let petals = '';
  const cx = 500;
  const cy = 520;
  const count = 9;
  for (let i = 0; i < count; i++) {
    const a = (360 / count) * i + rng.range(-6, 6);
    petals += `<ellipse cx="${cx}" cy="${cy - 190}" rx="${fmt(rng.range(80, 110))}" ry="210" fill="${palette[i % palette.length]}" opacity="0.55" transform="rotate(${fmt(a)} ${cx} ${cy})"/>`;
  }
  return svg(
    `<rect width="${W}" height="${W}" fill="url(#bg)"/>
     ${bokeh(rng, palette, 12, { rMin: 60, rMax: 160, opacity: [0.2, 0.45] })}
     <g filter="url(#b18)">${petals}</g>
     <g opacity="0.55" style="mix-blend-mode:screen">${petals}</g>
     <circle cx="${cx}" cy="${cy}" r="90" fill="#ffe3b0" opacity="0.9" filter="url(#b30)"/>
     <circle cx="${cx}" cy="${cy}" r="46" fill="#fff4dc" opacity="0.95" filter="url(#b5)"/>`,
    `<radialGradient id="bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#7a2e3a"/><stop offset=".6" stop-color="#3a1424"/><stop offset="1" stop-color="#1a0a12"/></radialGradient>`,
  ).replace('</svg>', `${vignette(0.45)}${grain(0.1, 0.7)}</svg>`);
}

/** Biển đêm và cực quang (ambient). */
function ocean(rng, palette) {
  let aurora = '';
  for (let i = 0; i < 4; i++) {
    const y = rng.range(150, 330);
    aurora += `<path d="M-80 ${fmt(y + 60)} C 220 ${fmt(y - rng.range(120, 220))}, 620 ${fmt(y + rng.range(80, 180))}, 1080 ${fmt(y - rng.range(60, 160))}" stroke="${palette[i % palette.length]}" stroke-width="${fmt(rng.range(70, 130))}" fill="none" opacity="0.8"/>`;
  }
  let waves = '';
  const layers = ['#0f4a5e', '#0b3a4c', '#082c3b', '#061f2b', '#04141d'];
  layers.forEach((c, i) => {
    const y0 = 610 + i * 78;
    const amp = 10 + i * 5;
    const len = 260 + i * 60;
    const phase = rng.range(0, Math.PI * 2);
    let d = `M0 ${fmt(y0 + Math.sin(phase) * amp)}`;
    for (let px = 20; px <= W; px += 20) d += ` L${px} ${fmt(y0 + Math.sin(phase + (px / len) * Math.PI * 2) * amp)}`;
    waves += `<path d="${d} L${W} ${W} L0 ${W} Z" fill="${c}"/><path d="${d}" stroke="#9fe8ff" stroke-width="2.5" fill="none" opacity="${fmt((0.32 - i * 0.05) * 100) / 100}"/>`;
  });
  let stars = '';
  for (let i = 0; i < 80; i++) {
    stars += `<circle cx="${fmt(rng.range(0, W))}" cy="${fmt(rng.range(0, 520))}" r="${fmt(rng.range(0.8, 2.4))}" fill="#fff" opacity="${fmt(rng.range(0.25, 0.85) * 100) / 100}"/>`;
  }
  return svg(
    `<rect width="${W}" height="${W}" fill="url(#sky)"/>${stars}
     <g filter="url(#b60)">${aurora}</g><g filter="url(#b30)" opacity="0.55">${aurora}</g>
     <circle cx="720" cy="230" r="46" fill="#f1fbff" opacity="0.95"/><circle cx="720" cy="230" r="110" fill="#bdefff" opacity="0.25" filter="url(#b30)"/>
     <rect x="700" y="600" width="40" height="400" fill="#bdefff" opacity="0.25" filter="url(#b18)"/>
     ${waves}`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040b18"/><stop offset=".6" stop-color="#0b2a3d"/><stop offset="1" stop-color="#103f52"/></linearGradient>`,
  ).replace('</svg>', `${vignette(0.4)}${grain(0.06)}</svg>`);
}

/** Bầu trời pastel, trăng và mây (dreamy). */
function moon(rng, palette) {
  let clouds = '';
  for (let i = 0; i < 9; i++) {
    clouds += `<ellipse cx="${fmt(rng.range(-100, 1100))}" cy="${fmt(rng.range(520, 950))}" rx="${fmt(rng.range(160, 320))}" ry="${fmt(rng.range(50, 110))}" fill="${rng.pick(['#ffffff', palette[0], palette[1]])}" opacity="${fmt(rng.range(0.25, 0.55) * 100) / 100}"/>`;
  }
  let stars = '';
  for (let i = 0; i < 60; i++) {
    stars += `<circle cx="${fmt(rng.range(0, W))}" cy="${fmt(rng.range(0, 500))}" r="${fmt(rng.range(0.8, 2.4))}" fill="#fff" opacity="${fmt(rng.range(0.3, 0.9) * 100) / 100}"/>`;
  }
  return svg(
    `<rect width="${W}" height="${W}" fill="url(#sky)"/>${stars}
     <circle cx="560" cy="400" r="260" fill="${palette[0]}" opacity="0.45" filter="url(#b60)"/>
     <circle cx="560" cy="400" r="170" fill="url(#moon)"/>
     <circle cx="500" cy="360" r="26" fill="#000" opacity="0.06"/><circle cx="620" cy="450" r="38" fill="#000" opacity="0.05"/>
     <g filter="url(#b30)">${clouds}</g>`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette[3]}"/><stop offset=".55" stop-color="${palette[2]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient>
     <radialGradient id="moon" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fffaf2"/><stop offset="1" stop-color="${palette[0]}"/></radialGradient>`,
  ).replace('</svg>', `${grain(0.08)}</svg>`);
}

/** Ảnh trừu tượng theo một màu chủ đạo (playlist, tâm trạng, thể loại). */
function abstract(rng, color, accent = '#ffffff') {
  let rings = '';
  for (let i = 0; i < 3; i++) {
    rings += `<circle cx="${fmt(rng.range(250, 750))}" cy="${fmt(rng.range(250, 750))}" r="${fmt(rng.range(150, 380))}" stroke="${accent}" stroke-width="${fmt(rng.range(2, 6))}" fill="none" opacity="${fmt(rng.range(0.08, 0.2) * 100) / 100}"/>`;
  }
  return svg(
    `<rect width="${W}" height="${W}" fill="#0d1026"/>
     <circle cx="${fmt(rng.range(200, 400))}" cy="${fmt(rng.range(200, 400))}" r="420" fill="${color}" opacity="0.85" filter="url(#b60)"/>
     <circle cx="${fmt(rng.range(600, 850))}" cy="${fmt(rng.range(600, 850))}" r="360" fill="${accent}" opacity="0.45" filter="url(#b60)"/>
     <circle cx="${fmt(rng.range(300, 700))}" cy="${fmt(rng.range(500, 800))}" r="220" fill="#1b1f4a" opacity="0.6" filter="url(#b60)"/>
     ${rings}`,
  ).replace('</svg>', `${grain(0.1, 0.75)}</svg>`);
}

const THEMES = { 'city-rain': cityRain, rooftops, 'grid-sun': gridSun, bloom, ocean, moon };

export function albumCoverSvg(album) {
  const rng = createRng(hashString(album.id));
  const theme = THEMES[album.art.theme];
  if (!theme) throw new Error(`Không có theme ảnh bìa: ${album.art.theme}`);
  return theme(rng, album.art.palette);
}

export function abstractCoverSvg(seed, color, accent) {
  return abstract(createRng(hashString(seed)), color, accent);
}

/* ------------------------------------------------------------------ */
/* Ảnh nghệ sĩ: chân dung bóng đổ với viền sáng neon                  */
/* ------------------------------------------------------------------ */

function figure(cx, scale, hair) {
  const s = (v) => fmt(v * scale);
  const head = `<ellipse cx="${cx}" cy="${s(430)}" rx="${s(118)}" ry="${s(142)}"/>`;
  const neck = `<rect x="${fmt(cx - 48 * scale)}" y="${s(540)}" width="${s(96)}" height="${s(120)}"/>`;
  const shoulders = `<path d="M${fmt(cx - 330 * scale)} ${W} C ${fmt(cx - 310 * scale)} ${s(760)}, ${fmt(cx - 190 * scale)} ${s(650)}, ${cx} ${s(650)} C ${fmt(cx + 190 * scale)} ${s(650)}, ${fmt(cx + 310 * scale)} ${s(760)}, ${fmt(cx + 330 * scale)} ${W} Z"/>`;
  let extra = '';
  if (hair === 'long') {
    extra = `<path d="M${fmt(cx - 150 * scale)} ${s(420)} C ${fmt(cx - 175 * scale)} ${s(250)}, ${fmt(cx + 175 * scale)} ${s(250)}, ${fmt(cx + 150 * scale)} ${s(420)} C ${fmt(cx + 185 * scale)} ${s(560)}, ${fmt(cx + 200 * scale)} ${s(700)}, ${fmt(cx + 150 * scale)} ${s(760)} L ${fmt(cx - 150 * scale)} ${s(760)} C ${fmt(cx - 200 * scale)} ${s(700)}, ${fmt(cx - 185 * scale)} ${s(560)}, ${fmt(cx - 150 * scale)} ${s(420)} Z"/>`;
  } else if (hair === 'curly') {
    extra = `<circle cx="${cx}" cy="${s(380)}" r="${s(205)}"/>`;
  } else if (hair === 'bun') {
    extra = `<circle cx="${cx}" cy="${s(268)}" r="${s(62)}"/><ellipse cx="${cx}" cy="${s(380)}" rx="${s(128)}" ry="${s(110)}"/>`;
  } else if (hair === 'beanie') {
    extra = `<path d="M${fmt(cx - 132 * scale)} ${s(400)} C ${fmt(cx - 140 * scale)} ${s(220)}, ${fmt(cx + 140 * scale)} ${s(220)}, ${fmt(cx + 132 * scale)} ${s(400)} Z"/>`;
  } else {
    extra = `<ellipse cx="${cx}" cy="${s(372)}" rx="${s(128)}" ry="${s(102)}"/>`;
  }
  let phones = '';
  if (hair === 'headphones') {
    phones = `<path d="M${fmt(cx - 140 * scale)} ${s(440)} C ${fmt(cx - 150 * scale)} ${s(220)}, ${fmt(cx + 150 * scale)} ${s(220)}, ${fmt(cx + 140 * scale)} ${s(440)}" stroke-width="${s(22)}" fill="none"/><rect x="${fmt(cx - 168 * scale)}" y="${s(400)}" width="${s(50)}" height="${s(96)}" rx="${s(20)}"/><rect x="${fmt(cx + 118 * scale)}" y="${s(400)}" width="${s(50)}" height="${s(96)}" rx="${s(20)}"/>`;
  }
  return { body: `${extra}${neck}${shoulders}${head}`, phones };
}

export function artistSvg(artist) {
  const rng = createRng(hashString(artist.id));
  const { hair, rim, bokeh: colors, bg } = artist.art;
  const people =
    hair === 'duo'
      ? [
          { cx: 330, scale: 0.86, hair: 'short' },
          { cx: 680, scale: 0.92, hair: 'bun' },
        ]
      : [{ cx: 500, scale: 1, hair }];
  let figures = '';
  for (const p of people) {
    const f = figure(p.cx, p.scale, p.hair);
    figures += `
      <g fill="${rim[0]}" stroke="${rim[0]}" transform="translate(-14 -4)" filter="url(#b10)" opacity="0.95">${f.body}${f.phones}</g>
      <g fill="${rim[1]}" stroke="${rim[1]}" transform="translate(14 0)" filter="url(#b10)" opacity="0.8">${f.body}${f.phones}</g>
      <g fill="url(#skin)" stroke="url(#skin)">${f.body}${f.phones}</g>`;
  }
  return svg(
    `<rect width="${W}" height="${W}" fill="url(#bg)"/>
     ${bokeh(rng, colors, 34, { rMin: 16, rMax: 90, opacity: [0.2, 0.6] })}
     <circle cx="500" cy="420" r="320" fill="${rim[0]}" opacity="0.18" filter="url(#b60)"/>
     ${figures}`,
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
     <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1426"/><stop offset="1" stop-color="#07060d"/></linearGradient>`,
  ).replace('</svg>', `${vignette(0.5)}${grain(0.08)}</svg>`);
}

/* ------------------------------------------------------------------ */
/* Logo / icon ứng dụng                                               */
/* ------------------------------------------------------------------ */

/** Biểu tượng: các vạch sóng âm + trăng lưỡi liềm. `padding` 0..1 để làm icon maskable. */
export function logoSvg({ size = 512, background = true, padding = 0, rounded = true } = {}) {
  const inner = 1 - padding * 2;
  const tx = (size * padding).toFixed(1);
  const sc = ((size / 512) * inner).toFixed(4);
  const bars = [
    [112, 212, 300],
    [168, 160, 352],
    [224, 112, 400],
    [280, 168, 344],
    [336, 220, 292],
  ]
    .map(([x, y1, y2]) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`)
    .join('');
  const bg = background
    ? `<rect width="${size}" height="${size}" ${rounded ? `rx="${(size * 0.22).toFixed(1)}"` : ''} fill="url(#lg)"/>
       <circle cx="${size * 0.25}" cy="${size * 0.2}" r="${size * 0.45}" fill="#5cc8f0" opacity="0.25" filter="url(#lb)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d3566"/><stop offset=".55" stop-color="#43297a"/><stop offset="1" stop-color="#b13f7e"/></linearGradient>
    <filter id="lb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${size * 0.08}"/></filter>
    <mask id="crescent"><rect width="512" height="512" fill="#fff"/><circle cx="420" cy="112" r="46" fill="#000"/></mask>
  </defs>
  ${bg}
  <g transform="translate(${tx} ${tx}) scale(${sc})">
    <g stroke="#ffffff" stroke-width="30" stroke-linecap="round">${bars}</g>
    <circle cx="396" cy="134" r="50" fill="#ffffff" mask="url(#crescent)"/>
  </g>
</svg>`;
}
