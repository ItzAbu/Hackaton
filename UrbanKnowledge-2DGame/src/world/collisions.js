// src/world/collisions.js
// Collisioni robuste (tilemap invisibile) generate automaticamente dalla texture della mappa.
// Approccio:
// 1) Downscale dell'immagine a griglia (cell px). Ogni pixel della griglia rappresenta una cella.
// 2) Classificazione HSV: erba / terra / strada = camminabile. Resto = ostacolo (edifici, alberi, recinzioni...).
// 3) Pulizia con morfologia (opening + closing) per ridurre rumore e micro-buchi.
// 4) Tilemap layer con collisione (Arcade) -> più stabile e meno "snag" rispetto a migliaia di rettangoli.

function rgbToHsv01(r, g, b) {
  // r,g,b: 0..255 -> h:0..1 s:0..1 v:0..1
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function isWalkablePixel(r, g, b) {
  const { h, s, v } = rgbToHsv01(r, g, b);
  const hue = h * 360;

  // Strade/piazzali (grigi): bassa saturazione, luminosità medio-alta.
  const pavement = s < 0.18 && v > 0.45 && v < 0.96;

  // Erba: verde con luminosità abbastanza alta (blocca alberi: verde scuro = ostacolo)
  const grass = hue >= 80 && hue <= 170 && s > 0.20 && v > 0.38;

  // Terra/sentieri: marrone/arancio
  const dirt = hue >= 15 && hue <= 55 && s > 0.20 && v > 0.22;

  // Aree chiare/beige (marciapiedi/ghiaia)
  const lightWalk = hue >= 35 && hue <= 80 && s < 0.35 && v > 0.60;

  return pavement || grass || dirt || lightWalk;
}

function morphDilate(src, w, h) {
  // 8-neighborhood dilate (r=1)
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let dy = -1; dy <= 1 && !v; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          if (src[yy * w + xx]) { v = 1; break; }
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

function morphErode(src, w, h) {
  // 8-neighborhood erode (r=1)
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 1;
      for (let dy = -1; dy <= 1 && v; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) { v = 0; break; }
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) { v = 0; break; }
          if (!src[yy * w + xx]) { v = 0; break; }
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

function opening(src, w, h) {
  return morphDilate(morphErode(src, w, h), w, h);
}

function closing(src, w, h) {
  return morphErode(morphDilate(src, w, h), w, h);
}

function ensureCollisionTilesTexture(scene, key, cell) {
  if (scene.textures.exists(key)) return;

  const c = scene.textures.createCanvas(key, cell * 2, cell);
  const ctx = c.getContext();

  // tile 0: trasparente
  ctx.clearRect(0, 0, cell, cell);

  // tile 1: pieno (visibile solo in debug se layer alpha > 0)
  ctx.fillStyle = "#ff3b3b";
  ctx.fillRect(cell, 0, cell, cell);

  c.refresh();
}

export function buildCollisionLayer(scene, mapTextureKey, worldW, worldH, opts = {}) {
  const cell = opts.cell ?? 8;              // 8 = più preciso, 16 = più leggero
  const debug = !!opts.debug;
  const cleanup = opts.cleanup ?? true;
  const marginCells = opts.marginCells ?? 0; // >0 dilata ostacoli, <0 erode
  const forceBlocked = opts.forceBlocked || [];   // [{x,y,w,h}] in world px
  const forceWalkable = opts.forceWalkable || []; // [{x,y,w,h}] in world px

  const gw = Math.floor(worldW / cell);
  const gh = Math.floor(worldH / cell);

  const img = scene.textures.get(mapTextureKey).getSourceImage();

  // downscale -> canvas gw x gh: ogni pixel rappresenta una cella media
  const canvas = document.createElement("canvas");
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, gw, gh);
  const id = ctx.getImageData(0, 0, gw, gh).data;

  // blocked: 1 = ostacolo, 0 = walkable
  let blocked = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = (y * gw + x) * 4;
      const r = id[i], g = id[i + 1], b = id[i + 2];
      blocked[y * gw + x] = isWalkablePixel(r, g, b) ? 0 : 1;
    }
  }

  if (cleanup) {
    // opening (rimuove puntini) + closing (chiude buchi piccoli)
    blocked = opening(blocked, gw, gh);
    blocked = closing(blocked, gw, gh);
  }

  // Margin: espande o restringe gli ostacoli per stabilizzare i bordi
  if (marginCells !== 0) {
    const steps = Math.min(6, Math.abs(marginCells));
    for (let k = 0; k < steps; k++) {
      blocked = (marginCells > 0)
        ? morphDilate(blocked, gw, gh)
        : morphErode(blocked, gw, gh);
    }
  }

  // Override manuali: utile quando alcuni dettagli della texture vengono classificati male.
  // forceBlocked: rettangoli che devono essere SEMPRE ostacoli
  // forceWalkable: rettangoli che devono essere SEMPRE camminabili
  const applyRect = (rect, value) => {
    const x0 = Math.max(0, Math.floor(rect.x / cell));
    const y0 = Math.max(0, Math.floor(rect.y / cell));
    const x1 = Math.min(gw - 1, Math.floor((rect.x + rect.w) / cell));
    const y1 = Math.min(gh - 1, Math.floor((rect.y + rect.h) / cell));
    for (let y = y0; y <= y1; y++) {
      const base = y * gw;
      for (let x = x0; x <= x1; x++) blocked[base + x] = value;
    }
  };

  for (const r of forceBlocked) applyRect(r, 1);
  for (const r of forceWalkable) applyRect(r, 0);

  // Tilemap data: 0 = vuoto, 1 = collidable
  const data = new Array(gh);
  for (let y = 0; y < gh; y++) {
    const row = new Array(gw);
    const base = y * gw;
    for (let x = 0; x < gw; x++) row[x] = blocked[base + x] ? 1 : 0;
    data[y] = row;
  }

  const tilesKey = "ukg_collision_tiles";
  ensureCollisionTilesTexture(scene, tilesKey, cell);

  const map = scene.make.tilemap({ data, tileWidth: cell, tileHeight: cell });
  const tileset = map.addTilesetImage(tilesKey, tilesKey, cell, cell, 0, 0);
  const layer = map.createLayer(0, tileset, 0, 0);

  layer.setDepth(-50);
  layer.setAlpha(debug ? 0.22 : 0);
  layer.setCollision([1]);

  // toggle debug
  layer.__toggleDebug = () => {
    const on = layer.alpha === 0;
    layer.setAlpha(on ? 0.22 : 0);
    return on;
  };

  return { layer, cell, gw, gh, blocked };
}
