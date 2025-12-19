// Avatar options + renderer (Phaser Graphics)

export const AVATAR_STORAGE_KEY = "ukg_avatar_v1";

export const SKINS = [
  { name: "Chiaro", value: 0xffd6c2 },
  { name: "Beige", value: 0xf1c7a3 },
  { name: "Oliva", value: 0xd2a377 },
  { name: "Ambrato", value: 0xb97c4b },
  { name: "Scuro", value: 0x7a4a2d }
];

export const EYES = [
  { name: "Marroni", value: 0x5a3b2e },
  { name: "Verdi", value: 0x2f6b4f },
  { name: "Azzurri", value: 0x3a7bd5 },
  { name: "Grigi", value: 0x7d8aa0 }
];

export const HAIR_COLORS = [
  { name: "Nero", value: 0x151515 },
  { name: "Castano", value: 0x3a2315 },
  { name: "Biondo", value: 0xd2b06a },
  { name: "Rame", value: 0xb65a2a },
  { name: "Viola", value: 0x7c5cff }
];

export const HAIR_STYLES = [
  { key: "short", label: "Corti" },
  { key: "side", label: "Ciuffo" },
  { key: "mohawk", label: "Cresta" },
  { key: "bun", label: "Chignon" }
];

export const TOPS = [
  { key: "tee", label: "T-Shirt" },
  { key: "hoodie", label: "Felpa" },
  { key: "jacket", label: "Giacca" }
];

export const BOTTOMS = [
  { key: "jeans", label: "Jeans" },
  { key: "shorts", label: "Short" },
  { key: "cargo", label: "Cargo" }
];

export const BODY_TYPES = [
  { key: "slim", label: "Snello" },
  { key: "normal", label: "Normale" },
  { key: "wide", label: "Robusto" }
];

export const ACCESSORIES = [
  { key: "none", label: "Nessuno" },
  { key: "cap", label: "Cappello" },
  { key: "antenna", label: "Antenna" },
  { key: "backpack", label: "Zaino" }
];

export const COLORS = [
  { name: "Viola", value: 0x7c5cff },
  { name: "Ciano", value: 0x5fe1ff },
  { name: "Verde", value: 0x3b7840 },
  { name: "Arancio", value: 0xffb86b },
  { name: "Rosso", value: 0xff5c7a }
];

export function defaultAvatar() {
  return {
    name: "Player",
    skin: SKINS[0].value,
    eye: EYES[0].value,
    hairStyle: HAIR_STYLES[0].key,
    hairColor: HAIR_COLORS[1].value,
    topStyle: TOPS[1].key,
    topColor: COLORS[0].value,
    bottomStyle: BOTTOMS[0].key,
    bottomColor: 0x1e2d4a,
    bodyType: BODY_TYPES[1].key,
    accessory: ACCESSORIES[0].key,
    accentColor: COLORS[1].value
  };
}

export function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomAvatar() {
  const d = defaultAvatar();
  return {
    ...d,
    skin: pickRandom(SKINS).value,
    eye: pickRandom(EYES).value,
    hairStyle: pickRandom(HAIR_STYLES).key,
    hairColor: pickRandom(HAIR_COLORS).value,
    topStyle: pickRandom(TOPS).key,
    topColor: pickRandom(COLORS).value,
    bottomStyle: pickRandom(BOTTOMS).key,
    bottomColor: PhaserColor(0x182236, 0x314b7d, Math.random()),
    bodyType: pickRandom(BODY_TYPES).key,
    accessory: pickRandom(ACCESSORIES).key,
    accentColor: pickRandom(COLORS).value
  };
}

function clampHex(n) {
  return Math.max(0, Math.min(0xffffff, n >>> 0));
}

function PhaserColor(a, b, t) {
  // lerp 0xRRGGBB without Phaser dependency
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return clampHex((rr << 16) | (rg << 8) | rb);
}

export function sanitizeAvatar(raw) {
  const d = defaultAvatar();
  const a = raw && typeof raw === "object" ? raw : {};

  const safe = {
    ...d,
    ...a
  };

  if (typeof safe.name !== "string" || !safe.name.trim()) safe.name = d.name;
  safe.name = safe.name.trim().slice(0, 14);

  const ok = (list, key, val) => list.some(x => (x.key ?? x.value) === val);

  if (!SKINS.some(x => x.value === safe.skin)) safe.skin = d.skin;
  if (!EYES.some(x => x.value === safe.eye)) safe.eye = d.eye;
  if (!HAIR_STYLES.some(x => x.key === safe.hairStyle)) safe.hairStyle = d.hairStyle;
  if (!HAIR_COLORS.some(x => x.value === safe.hairColor)) safe.hairColor = d.hairColor;
  if (!TOPS.some(x => x.key === safe.topStyle)) safe.topStyle = d.topStyle;
  if (!BOTTOMS.some(x => x.key === safe.bottomStyle)) safe.bottomStyle = d.bottomStyle;
  if (!BODY_TYPES.some(x => x.key === safe.bodyType)) safe.bodyType = d.bodyType;
  if (!ACCESSORIES.some(x => x.key === safe.accessory)) safe.accessory = d.accessory;
  if (!COLORS.some(x => x.value === safe.topColor)) safe.topColor = d.topColor;
  if (typeof safe.bottomColor !== "number") safe.bottomColor = d.bottomColor;
  if (!COLORS.some(x => x.value === safe.accentColor)) safe.accentColor = d.accentColor;

  return safe;
}

// Draw centered avatar at (0,0). Use g.setPosition(x,y) externally.
export function drawAvatar(g, avatar, opts = {}) {
  const s = opts.scale ?? 1;
  const outline = 0x0b0f17;
  const outlineA = opts.outlineAlpha ?? 0.70;
  const shadowA = opts.shadowAlpha ?? 0.18;

  const bodyW = avatar.bodyType === "slim" ? 22 : avatar.bodyType === "wide" ? 28 : 24;
  const torsoW = bodyW * s;
  const torsoH = 18 * s;
  const legW = 8 * s;
  const legH = 12 * s;
  const headR = 11 * s;

  const yTorso = -2 * s;
  const yHead = yTorso - torsoH / 2 - headR + 2 * s;

  g.clear();

  // shadow
  if (opts.shadow !== false) {
    g.fillStyle(0x000000, shadowA);
    g.fillEllipse(0, 16 * s, 34 * s, 12 * s);
  }

  // backpack
  if (avatar.accessory === "backpack") {
    g.fillStyle(outline, 0.45);
    g.fillRoundedRect(-torsoW / 2 - 7 * s, yTorso - 6 * s, 12 * s, 20 * s, 6 * s);
    g.fillStyle(avatar.accentColor, 0.28);
    g.fillRoundedRect(-torsoW / 2 - 5 * s, yTorso - 4 * s, 8 * s, 16 * s, 5 * s);
  }

  // torso outline
  g.fillStyle(outline, outlineA);
  g.fillRoundedRect(-torsoW / 2 - 2 * s, yTorso - torsoH / 2 - 2 * s, torsoW + 4 * s, torsoH + 4 * s, 10 * s);

  // torso fill
  g.fillStyle(avatar.topColor, 0.95);
  g.fillRoundedRect(-torsoW / 2, yTorso - torsoH / 2, torsoW, torsoH, 10 * s);

  // top details
  if (avatar.topStyle === "hoodie") {
    g.fillStyle(outline, 0.22);
    g.fillRoundedRect(-10 * s, yTorso + 1 * s, 20 * s, 8 * s, 5 * s);
    g.lineStyle(2 * s, outline, 0.35);
    g.beginPath();
    g.moveTo(-6 * s, yTorso - 8 * s);
    g.lineTo(-2 * s, yTorso + 1 * s);
    g.moveTo(6 * s, yTorso - 8 * s);
    g.lineTo(2 * s, yTorso + 1 * s);
    g.strokePath();
  } else if (avatar.topStyle === "jacket") {
    g.fillStyle(outline, 0.18);
    g.fillRoundedRect(-torsoW / 2 + 2 * s, yTorso - torsoH / 2 + 2 * s, torsoW - 4 * s, torsoH - 4 * s, 9 * s);
    g.fillStyle(avatar.accentColor, 0.22);
    g.fillRoundedRect(-2 * s, yTorso - torsoH / 2 + 1 * s, 4 * s, torsoH - 2 * s, 2 * s);
  } else {
    // tee
    g.fillStyle(outline, 0.16);
    g.fillCircle(0, yTorso - torsoH / 2 + 5 * s, 4.5 * s);
  }

  // legs outline
  g.fillStyle(outline, outlineA);
  g.fillRoundedRect(-legW - 3 * s, yTorso + torsoH / 2 - 1 * s, legW + 6 * s, legH + 4 * s, 6 * s);
  g.fillRoundedRect(0 - 3 * s, yTorso + torsoH / 2 - 1 * s, legW + 6 * s, legH + 4 * s, 6 * s);

  // legs fill
  g.fillStyle(avatar.bottomColor, 0.95);
  if (avatar.bottomStyle === "shorts") {
    g.fillRoundedRect(-legW - 1 * s, yTorso + torsoH / 2, legW, 6 * s, 5 * s);
    g.fillRoundedRect(0 + 1 * s, yTorso + torsoH / 2, legW, 6 * s, 5 * s);
  } else {
    g.fillRoundedRect(-legW - 1 * s, yTorso + torsoH / 2, legW, legH, 5 * s);
    g.fillRoundedRect(0 + 1 * s, yTorso + torsoH / 2, legW, legH, 5 * s);
  }
  if (avatar.bottomStyle === "cargo") {
    g.fillStyle(outline, 0.18);
    g.fillRoundedRect(-legW - 1 * s, yTorso + torsoH / 2 + 5 * s, legW, 5 * s, 3 * s);
    g.fillRoundedRect(0 + 1 * s, yTorso + torsoH / 2 + 5 * s, legW, 5 * s, 3 * s);
  }

  // shoes
  g.fillStyle(outline, 0.55);
  g.fillRoundedRect(-legW - 2 * s, yTorso + torsoH / 2 + legH - 1 * s, legW + 2 * s, 4 * s, 2 * s);
  g.fillRoundedRect(0 + 1 * s, yTorso + torsoH / 2 + legH - 1 * s, legW + 2 * s, 4 * s, 2 * s);

  // head outline
  g.fillStyle(outline, outlineA);
  g.fillCircle(0, yHead, headR + 2 * s);

  // head fill
  g.fillStyle(avatar.skin, 1);
  g.fillCircle(0, yHead, headR);

  // eyes
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(-4 * s, yHead - 1 * s, 2.6 * s);
  g.fillCircle(4 * s, yHead - 1 * s, 2.6 * s);
  g.fillStyle(avatar.eye, 0.95);
  g.fillCircle(-4 * s, yHead - 1 * s, 1.3 * s);
  g.fillCircle(4 * s, yHead - 1 * s, 1.3 * s);
  g.fillStyle(outline, 0.25);
  g.fillCircle(-4 * s, yHead - 1.8 * s, 0.55 * s);
  g.fillCircle(4 * s, yHead - 1.8 * s, 0.55 * s);

  // mouth
  g.lineStyle(2 * s, outline, 0.25);
  g.beginPath();
  g.moveTo(-4 * s, yHead + 5 * s);
  g.lineTo(4 * s, yHead + 5 * s);
  g.strokePath();

  // hair
  g.fillStyle(avatar.hairColor, 0.95);
  if (avatar.hairStyle === "short") {
    g.fillEllipse(0, yHead - 6 * s, 22 * s, 14 * s);
  } else if (avatar.hairStyle === "side") {
    g.fillEllipse(-3 * s, yHead - 6 * s, 20 * s, 14 * s);
    g.fillRoundedRect(-headR * 0.7, yHead - 10 * s, 10 * s, 14 * s, 6 * s);
  } else if (avatar.hairStyle === "mohawk") {
    g.fillRoundedRect(-3 * s, yHead - 16 * s, 6 * s, 18 * s, 4 * s);
  } else if (avatar.hairStyle === "bun") {
    g.fillEllipse(0, yHead - 6 * s, 22 * s, 14 * s);
    g.fillCircle(0, yHead - 16 * s, 6 * s);
  }

  // accessory
  if (avatar.accessory === "cap") {
    g.fillStyle(outline, 0.60);
    g.fillRoundedRect(-14 * s, yHead - 18 * s, 28 * s, 10 * s, 5 * s);
    g.fillStyle(0xffffff, 0.10);
    g.fillRoundedRect(-12 * s, yHead - 17 * s, 24 * s, 8 * s, 5 * s);
    g.fillStyle(outline, 0.60);
    g.fillRoundedRect(6 * s, yHead - 10 * s, 14 * s, 6 * s, 3 * s);
  }

  if (avatar.accessory === "antenna") {
    g.lineStyle(3 * s, 0xffffff, 0.55);
    g.beginPath();
    g.moveTo(0, yHead - 8 * s);
    g.lineTo(0, yHead - 26 * s);
    g.strokePath();
    g.fillStyle(avatar.accentColor, 0.95);
    g.fillCircle(0, yHead - 30 * s, 4.5 * s);
  }

  if (opts.glow) {
    g.lineStyle(3 * s, avatar.accentColor, 0.22);
    g.strokeRoundedRect(-torsoW / 2 - 6 * s, yTorso - torsoH / 2 - 8 * s, torsoW + 12 * s, torsoH + legH + 22 * s, 16 * s);
  }
}
