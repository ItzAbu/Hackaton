import Phaser from "phaser";
import { WORLD, getAreaAt, isAreaUnlocked } from "../world/worldConfig.js";

export default class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Dim background via camera background color
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0.72)");

    // Map objects
    this.mapObjects = [];

    // Background map image (loaded in WorldScene.preload)
    const bg = this.add.image(0, 0, "world_map").setOrigin(0, 0);
    bg.displayWidth = WORLD.width;
    bg.displayHeight = WORLD.height;
    bg.setAlpha(0.92);
    bg.setDepth(0);
    this.mapObjects.push(bg);

    // Zone overlays (lock status based on quest state)
    const questState = this.registry.get("questState") || { quests: {}, activeQuestId: null };
    for (const a of WORLD.areas) {
      const unlocked = isAreaUnlocked(a, questState);
      const rect = this.add.rectangle(a.x + a.w / 2, a.y + a.h / 2, a.w, a.h, a.color, unlocked ? 0.12 : 0.05)
        .setStrokeStyle(2, 0x000000, 0.35);
      rect.setDepth(1);

      const lock = unlocked ? "" : " [LOCK]";
      const label = this.add.text(a.x + 18, a.y + 12, `${a.name}${lock}`, {
        fontSize: "16px",
        fontStyle: "900",
        color: "rgba(255,255,255,0.85)"
      }).setShadow(0, 1, "rgba(0,0,0,0.45)", 2);
      label.setDepth(2);

      if (!unlocked) {
        const req = (a.requires || []).map(id => questState.quests?.[id]?.topic || id).join(", ");
        const hint = this.add.text(a.x + 18, a.y + 32, `Richiede: ${req}`, {
          fontSize: "11px",
          fontStyle: "800",
          color: "rgba(232,238,252,0.70)"
        }).setShadow(0, 1, "rgba(0,0,0,0.40)", 2);
        hint.setDepth(2);
        this.mapObjects.push(hint);
      }

      this.mapObjects.push(rect, label);
    }

    // NPC markers
    for (const n of WORLD.npcs) {
      const dot = this.add.circle(n.x, n.y, 9, 0xffffff, 0.16).setStrokeStyle(2, 0x5fe1ff, 0.55);
      const t = this.add.text(n.x, n.y + 14, n.topic, {
        fontSize: "11px",
        fontStyle: "800",
        color: "rgba(232,238,252,0.78)"
      }).setOrigin(0.5, 0);
      dot.setDepth(3);
      t.setDepth(3);
      this.mapObjects.push(dot, t);
    }

    // Player marker
    this.playerMarker = this.add.circle(0, 0, 12, 0x000000, 0.0).setStrokeStyle(3, 0xffffff, 1);
    this.playerMarker.setDepth(10);

    // Current area highlight
    this.highlight = this.add.graphics().setDepth(9);

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.width, WORLD.height);

    // Fit world into view with margin
    const fitZoom = Math.min(w / WORLD.width, h / WORLD.height) * 0.92;
    cam.setZoom(fitZoom);
    cam.centerOn(WORLD.width / 2, WORLD.height / 2);

    // UI overlay (fixed)
    this.ui = [];
    this.title = this.add.text(18, 16, "Mappa (zoom + pan)", {
      fontSize: "14px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.92)"
    }).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.title);

    this.hint = this.add.text(18, 38, "Mouse wheel: zoom — trascina: muovi — ESC: chiudi", {
      fontSize: "12px",
      fontStyle: "800",
      color: "rgba(232,238,252,0.65)"
    }).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.hint);

    this.areaInfo = this.add.text(18, h - 32, "Area: —", {
      fontSize: "12px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.75)"
    }).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.areaInfo);

    const closeBtn = this.add.rectangle(w - 88, 28, 160, 34, 0xffffff, 0.08)
      .setStrokeStyle(1, 0xffffff, 0.16)
      .setScrollFactor(0).setDepth(1001)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(closeBtn.x, closeBtn.y, "Chiudi", {
      fontSize: "12px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.92)"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
    this.ui.push(closeBtn, closeTxt);

    closeBtn.on("pointerdown", () => this.close());

    // Drag-to-pan
    this.dragging = false;
    this.dragStart = { x: 0, y: 0, sx: 0, sy: 0 };

    this.input.on("pointerdown", (p) => {
      if (p.rightButtonDown()) return;
      this.dragging = true;
      this.dragStart.x = p.x;
      this.dragStart.y = p.y;
      this.dragStart.sx = cam.scrollX;
      this.dragStart.sy = cam.scrollY;
    });

    this.input.on("pointerup", () => {
      this.dragging = false;
    });

    this.input.on("pointermove", (p) => {
      if (!this.dragging) return;
      const dx = (p.x - this.dragStart.x) / cam.zoom;
      const dy = (p.y - this.dragStart.y) / cam.zoom;
      cam.scrollX = this.dragStart.sx - dx;
      cam.scrollY = this.dragStart.sy - dy;
    });

    // Wheel zoom (zoom around pointer)
    this.input.on("wheel", (pointer, _dx, dy) => {
      const before = cam.getWorldPoint(pointer.x, pointer.y);

      const factor = Math.exp(-dy * 0.0012);
      const next = Phaser.Math.Clamp(cam.zoom * factor, 0.12, 3.0);
      cam.setZoom(next);

      const after = cam.getWorldPoint(pointer.x, pointer.y);
      cam.scrollX += (before.x - after.x);
      cam.scrollY += (before.y - after.y);
    });

    // Close on ESC
    this.input.keyboard.on("keydown-ESC", () => this.close());

    this.syncFromRegistry();
  }

  update() {
    this.syncFromRegistry();
  }

  syncFromRegistry() {
    const pos = this.registry.get("playerPos") || { x: WORLD.width / 2, y: WORLD.height / 2 };
    this.playerMarker.setPosition(pos.x, pos.y);

    const area = getAreaAt(pos.x, pos.y);
    this.areaInfo.setText(`Area: ${area ? area.name : "Fuori mappa"}`);

    // Highlight current area
    this.highlight.clear();
    if (area) {
      this.highlight.lineStyle(6, 0xffffff, 0.35);
      this.highlight.strokeRect(area.x, area.y, area.w, area.h);
      this.highlight.lineStyle(2, 0x5fe1ff, 0.75);
      this.highlight.strokeRect(area.x, area.y, area.w, area.h);
    }
  }

  close() {
    // Resume world and stop map scene
    this.scene.stop("MapScene");
    this.scene.resume("WorldScene");
  }
}
