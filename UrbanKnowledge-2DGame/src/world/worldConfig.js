export const WORLD = {
  // Asset_Mappa_Gioco.jpeg is 2560x2560
  width: 2560,
  height: 2560,
  areas: [
    // 2 colonne x 3 righe (zone bloccabili via quest)
    // requires: lista di quest (npcId) che devono essere COMPLETE prima di entrare nella zona.
    { key: "networking",   name: "Reti",            x:   0, y:    0, w: 1280, h:  853, color: 0x1f3a5f, requires: [] },
    { key: "security",     name: "Sicurezza",       x:1280, y:    0, w: 1280, h:  853, color: 0x2a5a3b, requires: ["npc_net"] },
    { key: "programming",  name: "Programmazione",  x:   0, y:  853, w: 1280, h:  853, color: 0x4a2b6b, requires: ["npc_sec"] },
    { key: "databases",    name: "Database",        x:1280, y:  853, w: 1280, h:  853, color: 0x6b4a2b, requires: ["npc_prog"] },
    { key: "systems",      name: "Sistemi",         x:   0, y: 1706, w: 1280, h:  854, color: 0x3b3b3b, requires: ["npc_db"] },
    { key: "cloud",        name: "Cloud",           x:1280, y: 1706, w: 1280, h:  854, color: 0x2b5e6b, requires: ["npc_sys"] }
  ],
  npcs: [
    // Posizionati grossolanamente al centro di ogni zona.
    { id:"npc_net",  name:"Tecnico",  topic:"Reti",           area:"networking",  x:  640, y:  420, spriteKey: "npc_net" },
    { id:"npc_sec",  name:"Analista", topic:"Sicurezza",      area:"security",    x: 1920, y:  420, spriteKey: "npc_sec" },
    { id:"npc_prog", name:"Dev",      topic:"Programmazione", area:"programming", x:  640, y: 1270, spriteKey: "npc_prog" },
    { id:"npc_db",   name:"DBA",      topic:"Database",       area:"databases",   x: 1920, y: 1270, spriteKey: "npc_db" },
    { id:"npc_sys",  name:"Admin",    topic:"Sistemi",        area:"systems",     x:  640, y: 2140, spriteKey: "npc_sys" },
    { id:"npc_cld",  name:"CloudOps", topic:"Cloud",          area:"cloud",       x: 1920, y: 2140, spriteKey: "npc_cld" }
  ]
};

export function getAreaAt(x, y) {
  for (const a of WORLD.areas) {
    if (x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h) return a;
  }
  return null;
}

export function isAreaUnlocked(area, questState) {
  if (!area) return true;
  const req = area.requires || [];
  if (req.length === 0) return true;

  const quests = questState?.quests || {};
  for (const npcId of req) {
    const q = quests[npcId];
    if (!q || q.status !== "complete") return false;
  }
  return true;
}
