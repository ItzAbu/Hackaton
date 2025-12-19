import Phaser from "phaser";

import {
  AVATAR_STORAGE_KEY,
  SKINS,
  EYES,
  HAIR_COLORS,
  HAIR_STYLES,
  TOPS,
  BOTTOMS,
  BODY_TYPES,
  ACCESSORIES,
  COLORS,
  defaultAvatar,
  randomAvatar,
  sanitizeAvatar,
  drawAvatar
} from "../avatar/avatar.js";

// Palette specifica pantaloni (più “neutra”)
const PANTS_COLORS = [
  { name: "Blu scuro", value: 0x1e2d4a },
  { name: "Nero", value: 0x151515 },
  { name: "Grigio", value: 0x4d5869 },
  { name: "Sabbia", value: 0xb79a6a },
  { name: "Verde", value: 0x2f4f3f }
];

export default class CustomizeScene extends Phaser.Scene {
  constructor() {
    super("CustomizeScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Backdrop
    this.add.rectangle(w / 2, h / 2, w, h, 0x0b0f17, 1).setDepth(-10);
    this.add.circle(w - 180, 130, 220, 0x5fe1ff, 0.05).setDepth(-9);
    this.add.circle(190, h - 130, 260, 0x7c5cff, 0.06).setDepth(-9);

    // Card
    const cardW = 1200;
    const cardH = 650;
    this.add
      .rectangle(w / 2, h / 2, cardW, cardH, 0x0f1624, 1)
      .setStrokeStyle(1, 0xffffff, 0.12);

    const title = this.add
      .text(w / 2, h / 2 - cardH / 2 + 26, "Personalizzazione personaggio", {
        fontSize: "28px",
        fontStyle: "900",
        color: "#e8eefc"
      })
      .setOrigin(0.5, 0);

    this.add
      .text(w / 2, title.y + 38, "Aspetto più ricco: nome, pelle, capelli, outfit, accessori.", {
        fontSize: "14px",
        color: "rgba(232,238,252,0.70)"
      })
      .setOrigin(0.5, 0);

    // Avatar state
    const fromRegistry = this.registry.get("avatar");
    this.avatar = sanitizeAvatar(fromRegistry || defaultAvatar());

    // Layout
    const leftX = w / 2 - 420;
    const topY = h / 2 - 205;

    const previewX = w / 2 + 285;
    const previewY = h / 2 - 10;

    // Preview panel
    this.add
      .rectangle(previewX, h / 2 - 5, 360, 420, 0xffffff, 0.03)
      .setStrokeStyle(1, 0xffffff, 0.10);

    this.previewG = this.add.graphics().setDepth(10);
    this.previewG.setPosition(previewX, previewY);
    this.redrawPreview();

    this.previewName = this.add
      .text(previewX, previewY + 118, this.avatar.name, {
        fontSize: "14px",
        fontStyle: "900",
        color: "rgba(232,238,252,0.85)"
      })
      .setOrigin(0.5, 0);

    this.add
      .text(previewX, previewY + 146, "Preview (si salva in automatico)", {
        fontSize: "12px",
        color: "rgba(232,238,252,0.55)"
      })
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: this.previewG,
      y: previewY - 6,
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });

    // Controls rows
    const rows = [];
    let ry = topY;

    // Name row (DOM input)
    rows.push(this.makeNameRow(leftX, ry));
    ry += 40;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Corpo",
        get: () => this.avatar.bodyType,
        set: (v) => (this.avatar.bodyType = v),
        options: BODY_TYPES,
        kind: "key"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Pelle",
        get: () => this.avatar.skin,
        set: (v) => (this.avatar.skin = v),
        options: SKINS,
        kind: "value"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Occhi",
        get: () => this.avatar.eye,
        set: (v) => (this.avatar.eye = v),
        options: EYES,
        kind: "value"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Capelli",
        get: () => this.avatar.hairStyle,
        set: (v) => (this.avatar.hairStyle = v),
        options: HAIR_STYLES,
        kind: "key"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Colore capelli",
        get: () => this.avatar.hairColor,
        set: (v) => (this.avatar.hairColor = v),
        options: HAIR_COLORS,
        kind: "value"
      })
    );
    ry += 52;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Top",
        get: () => this.avatar.topStyle,
        set: (v) => (this.avatar.topStyle = v),
        options: TOPS,
        kind: "key"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Colore top",
        get: () => this.avatar.topColor,
        set: (v) => (this.avatar.topColor = v),
        options: COLORS,
        kind: "value"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Bottom",
        get: () => this.avatar.bottomStyle,
        set: (v) => (this.avatar.bottomStyle = v),
        options: BOTTOMS,
        kind: "key"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Colore bottom",
        get: () => this.avatar.bottomColor,
        set: (v) => (this.avatar.bottomColor = v),
        options: PANTS_COLORS,
        kind: "value"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Accessorio",
        get: () => this.avatar.accessory,
        set: (v) => (this.avatar.accessory = v),
        options: ACCESSORIES,
        kind: "key"
      })
    );
    ry += 44;

    rows.push(
      this.makeCyclerRow({
        x: leftX,
        y: ry,
        label: "Accento",
        get: () => this.avatar.accentColor,
        set: (v) => (this.avatar.accentColor = v),
        options: COLORS,
        kind: "value"
      })
    );

    // Actions
    const btnY = h / 2 + cardH / 2 - 66;

    const randBtn = this.makeActionButton(w / 2 + 200, btnY - 20, 160, 44, "Random", 0xffffff, 0.08);
    randBtn.on("pointerdown", () => {
      this.avatar = sanitizeAvatar(randomAvatar());
      this.applyAvatarToUI();
      this.persistAvatar();
    });

    const resetBtn = this.makeActionButton(w / 2 + 370, btnY - 20, 160, 44, "Reset", 0xffffff, 0.08);
    resetBtn.on("pointerdown", () => {
      this.avatar = sanitizeAvatar(defaultAvatar());
      this.applyAvatarToUI();
      this.persistAvatar();
    });

    const startBtn = this.makeActionButton(w / 2 + 285, btnY + 30, 260, 44, "Entra nella mappa", 0x7c5cff, 1);
    startBtn.on("pointerdown", () => this.startGame());

    this.add
      .text(w / 2, btnY + 80, "Invio: start  ·  R: random  ·  Backspace: reset", {
        fontSize: "12px",
        fontStyle: "800",
        color: "rgba(232,238,252,0.55)"
      })
      .setOrigin(0.5, 0);

    // Hotkeys
    this.input.keyboard.on("keydown-ENTER", () => this.startGame());
    this.input.keyboard.on("keydown-R", () => {
      this.avatar = sanitizeAvatar(randomAvatar());
      this.applyAvatarToUI();
      this.persistAvatar();
    });
    this.input.keyboard.on("keydown-BACKSPACE", () => {
      this.avatar = sanitizeAvatar(defaultAvatar());
      this.applyAvatarToUI();
      this.persistAvatar();
    });

    // Initial persist to keep registry/localStorage aligned
    this.persistAvatar();
  }

  redrawPreview() {
    drawAvatar(this.previewG, this.avatar, {
      scale: 3.1,
      shadow: true,
      glow: true,
      outlineAlpha: 0.75,
      shadowAlpha: 0.22
    });
  }

  persistAvatar() {
    this.registry.set("avatar", this.avatar);
    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(this.avatar));
    } catch {
      // ignore
    }
  }

  applyAvatarToUI() {
    this.avatar = sanitizeAvatar(this.avatar);
    if (this.nameInputEl) {
      this.nameInputEl.node.value = this.avatar.name;
    }
    this.previewName?.setText(this.avatar.name);
    this.redrawPreview();
    for (const row of this._cyclerRows || []) row.render();
  }

  makeNameRow(x, y) {
    const w = 520;
    const h = 44;

    this.add
      .rectangle(x + w / 2, y + h / 2 - 10, w , h, 0xffffff, 0.04)
      .setStrokeStyle(1, 0xffffff, 0.10);

    this.add.text(x + 14, y + 5, "Nome", {
      fontSize: "13px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.80)"
    });

    const input = document.createElement("input");
    input.className = "ukg-name-input";
    input.type = "text";
    input.maxLength = 14;
    input.value = this.avatar.name;

    this.nameInputEl = this.add.dom(x + 360, y + h / 2 - 10, input);
    this.nameInputEl.setDepth(50);

    input.addEventListener("input", () => {
      this.avatar.name = (input.value || "").trim().slice(0, 14) || "Player";
      this.previewName.setText(this.avatar.name);
      this.persistAvatar();
    });

    return { input };
  }

  makeCyclerRow({ x, y, label, get, set, options, kind }) {
    const rowW = 520;
    const rowH = 36;

    const bg = this.add
      .rectangle(x + rowW / 2, y + rowH / 2, rowW, rowH, 0xffffff, 0.03)
      .setStrokeStyle(1, 0xffffff, 0.10);

    const tLabel = this.add.text(x + 14, y + 10, label, {
      fontSize: "12px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.70)"
    });

    const swatch = this.add.rectangle(x + 286, y + rowH / 2, 16, 16, 0xffffff, 0.0);
    swatch.setStrokeStyle(1, 0xffffff, 0.14);

    const tValue = this.add.text(x + 306, y + 10, "", {
      fontSize: "12px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.88)"
    });

    const prev = this.makeMiniButton(x + rowW - 96, y + rowH / 2, "←");
    const next = this.makeMiniButton(x + rowW - 46, y + rowH / 2, "→");

    const getIndex = () => {
      const cur = get();
      const idx = options.findIndex(o => (kind === "key" ? o.key : o.value) === cur);
      return idx >= 0 ? idx : 0;
    };

    const apply = (dir) => {
      let idx = getIndex();
      idx = (idx + dir + options.length) % options.length;
      const v = kind === "key" ? options[idx].key : options[idx].value;
      set(v);
      this.avatar = sanitizeAvatar(this.avatar);
      this.redrawPreview();
      this.previewName.setText(this.avatar.name);
      render();
      this.persistAvatar();
    };

    prev.on("pointerdown", () => apply(-1));
    next.on("pointerdown", () => apply(1));

    const render = () => {
      const idx = getIndex();
      const opt = options[idx];
      tValue.setText(kind === "key" ? opt.label : opt.name);

      if (kind === "value") {
        swatch.setFillStyle(opt.value, 1);
        swatch.setAlpha(1);
      } else {
        swatch.setAlpha(0);
      }
    };

    if (!this._cyclerRows) this._cyclerRows = [];
    const rowApi = { render };
    this._cyclerRows.push(rowApi);

    render();

    // subtle hover
    bg.setInteractive({ useHandCursor: false });
    bg.on("pointerover", () => bg.setFillStyle(0xffffff, 0.05));
    bg.on("pointerout", () => bg.setFillStyle(0xffffff, 0.03));

    return rowApi;
  }

  makeMiniButton(x, y, label) {
    const r = this.add
      .rectangle(x, y, 38, 26, 0xffffff, 0.06)
      .setStrokeStyle(1, 0xffffff, 0.14)
      .setInteractive({ useHandCursor: true });

    const t = this.add
      .text(x, y, label, {
        fontSize: "12px",
        fontStyle: "900",
        color: "rgba(232,238,252,0.85)"
      })
      .setOrigin(0.5);

    r.on("pointerover", () => r.setFillStyle(0xffffff, 0.10));
    r.on("pointerout", () => r.setFillStyle(0xffffff, 0.06));
    return r;
  }

  makeActionButton(x, y, w, h, label, fill, alpha) {
    const r = this.add
      .rectangle(x, y, w, h, fill, alpha)
      .setStrokeStyle(1, 0x5fe1ff, fill === 0x7c5cff ? 0.25 : 0.12)
      .setInteractive({ useHandCursor: true });

    const t = this.add
      .text(x, y, label, {
        fontSize: "13px",
        fontStyle: "900",
        color: fill === 0x7c5cff ? "#0b0f17" : "rgba(232,238,252,0.92)"
      })
      .setOrigin(0.5);

    r.on("pointerover", () => r.setAlpha(Math.min(1, alpha + 0.06)));
    r.on("pointerout", () => r.setAlpha(alpha));
    return r;
  }

  startGame() {
    this.avatar = sanitizeAvatar(this.avatar);
    this.persistAvatar();
    this.scene.start("WorldScene");
  }
}
