import Phaser from "phaser";
import { WORLD, getAreaAt, isAreaUnlocked } from "../world/worldConfig.js";
import { QUIZZES } from "../world/quizBank.js";
import { defaultAvatar, sanitizeAvatar, drawAvatar } from "../avatar/avatar.js";
import { buildCollisionLayer } from "../world/collisions.js";

const STORAGE_KEY = "ukg_questState_v1";

const SPEED = 260;

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super("WorldScene");
  }

  preload() {
    // Map 
    this.load.image("world_map", "/assets/Asset_Mappa_Gioco.jpeg");

    // NPC assets (immagini singole; evita di mostrare spritesheet interi)
    this.load.image("npc_net", "/assets/npc/npc_net.png");
    this.load.image("npc_sec", "/assets/npc/npc_sec.png");
    this.load.image("npc_prog", "/assets/npc/npc_prog.png");
    this.load.image("npc_db", "/assets/npc/npc_db.png");
    this.load.image("npc_sys", "/assets/npc/npc_sys.png");
    this.load.image("npc_cld", "/assets/npc/npc_cld.png");
  }
  create() {
    this.state = {
      dialogOpen: false,
      dialogNpcId: null,
      toastTimer: null,
      quests: this.registry.get("questState")?.quests || {},
      activeQuestId: this.registry.get("questState")?.activeQuestId || null
    };

    // World bounds
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

    // Background map image
    this.bg = this.add.image(0, 0, "world_map").setOrigin(0, 0);
    // Force exact world size (prevents weird scaling differences in export)
    this.bg.displayWidth = WORLD.width;
    this.bg.displayHeight = WORLD.height;
    this.bg.setDepth(-100);

    // Collision layer (tilemap invisibile) generato dalla mappa.
    // Più stabile rispetto a tanti rettangoli e riduce gli incastri sugli spigoli.
    this.collision = buildCollisionLayer(this, "world_map", WORLD.width, WORLD.height, {
      cell: 8,
      debug: false,
      cleanup: true,
      marginCells: 1
    });

    // Background areas
    this.areaObjects = [];
    this.areaLabels = [];
    for (const a of WORLD.areas) {
      // Zone overlay: quasi trasparente (serve per “vedere” la divisione in zone)
      const rect = this.add.rectangle(a.x + a.w / 2, a.y + a.h / 2, a.w, a.h, a.color, 0.10)
        .setStrokeStyle(2, 0x000000, 0.18);
      rect.setDepth(-5);

      const label = this.add.text(a.x + 18, a.y + 12, a.name, {
        fontSize: "16px",
        fontStyle: "900",
        color: "rgba(255,255,255,0.85)"
      }).setShadow(0, 1, "rgba(0,0,0,0.35)", 2);
      label.setDepth(-4);

      this.areaObjects.push(rect);
      this.areaLabels.push(label);
    }

    // NPCs
    this.npcs = this.add.group();
    this.npcData = new Map();

    for (const n of WORLD.npcs) {
      const spriteKey = n.spriteKey || "npc_net";
      const base = this.add.image(n.x, n.y, spriteKey);
      // Normalize sprite size to ~64px height
      const targetH = 64;
      const s = targetH / Math.max(1, base.height);
      base.setScale(s);
      base.setDepth(2);

      const tag = this.add.text(n.x, n.y + 38, `${n.name} · ${n.topic}`, {
        fontSize: "12px",
        fontStyle: "800",
        color: "rgba(232,238,252,0.78)"
      }).setOrigin(0.5, 0);
      tag.setDepth(3);

      const icon = this.add.text(n.x, n.y - 44, "!", {
        fontSize: "18px",
        fontStyle: "900",
        color: "#5fe1ff"
      }).setOrigin(0.5, 0.5);
      icon.setDepth(4);
      icon.setVisible(false);

      this.npcs.addMultiple([base, tag, icon]);
      this.npcData.set(base, { ...n, label: tag, prompt: icon });
    }

    // Player (physics body) + rendered avatar
    const avatar = sanitizeAvatar(this.registry.get("avatar") || defaultAvatar());
    const spawn = { x: 240, y: 240 };

    this.spawn = { ...spawn };

    // invisible physics body (rendered avatar is a Graphics overlay)
    this.player = this.add.rectangle(spawn.x, spawn.y, 28, 36, 0x000000, 0);
    this.player.setDepth(5);

    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    // Collider più piccolo per non incastrarsi sugli spigoli delle collisioni
    this.player.body.setSize(20, 24, true);

    // Collider con la mappa (tile collisions)
    this.physics.add.collider(this.player, this.collision.layer);

    this.playerAvatar = this.add.graphics().setDepth(6);
    this.playerAvatar.setPosition(spawn.x, spawn.y);
    drawAvatar(this.playerAvatar, avatar, { scale: 1.15, shadow: false, glow: false, outlineAlpha: 0.70 });

    this.playerName = this.add.text(spawn.x, spawn.y - 44, avatar.name, {
      fontSize: "12px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.80)"
    }).setOrigin(0.5, 0.5).setDepth(7);

    // Zone gating: last allowed position
    this.lastAllowedPos = { x: spawn.x, y: spawn.y };
    this.lastLockToastAt = 0;

    // Main camera
    const mainCam = this.cameras.main;
    mainCam.setBounds(0, 0, WORLD.width, WORLD.height);
    mainCam.startFollow(this.player, true, 0.12, 0.12);
    mainCam.setDeadzone(180, 120);
    mainCam.setRoundPixels(true);

    // Minimap camera
    this.minimap = this.cameras.add(20, 20, 260, 170);
    this.minimap.setName("minimap");
    this.minimap.setBackgroundColor("rgba(11,15,23,0.35)");
    this.minimap.setBounds(0, 0, WORLD.width, WORLD.height);
    const z = Math.min(this.minimap.width / WORLD.width, this.minimap.height / WORLD.height);
    this.minimap.setZoom(z);
    this.minimap.centerOn(WORLD.width / 2, WORLD.height / 2);
    this.minimap.setRoundPixels(true);

    // Minimap border + label (UI pinned)
    this.ui = [];
    this.minimapBorder = this.add.rectangle(
      this.minimap.x + this.minimap.width / 2,
      this.minimap.y + this.minimap.height / 2,
      this.minimap.width + 6,
      this.minimap.height + 6,
      0x000000,
      0
    ).setStrokeStyle(2, 0xffffff, 0.18).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.minimapBorder);

    this.minimapLabel = this.add.text(this.minimap.x + 10, this.minimap.y + this.minimap.height + 10, "Minimappa (click = mappa)", {
      fontSize: "12px",
      fontStyle: "800",
      color: "rgba(232,238,252,0.70)"
    }).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.minimapLabel);

    // Minimap marker only on minimap
    this.marker = this.add.circle(this.player.x, this.player.y, 10, 0x000000, 0.0)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(999);
    this.cameras.main.ignore(this.marker); // not on main cam

    // UI: area + quest + help
    this.areaText = this.add.text(20, 210, "Area: —", {
      fontSize: "14px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.85)"
    }).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.areaText);

    this.questText = this.add.text(20, 236, "Quest: —", {
      fontSize: "13px",
      fontStyle: "800",
      color: "rgba(232,238,252,0.70)",
      wordWrap: { width: 520 }
    }).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.questText);

    this.helpText = this.add.text(20, 682, "WASD/Frecce: muovi — E: NPC — M: mappa", {
      fontSize: "12px",
      fontStyle: "800",
      color: "rgba(232,238,252,0.55)"
    }).setScrollFactor(0).setDepth(1000);
    this.ui.push(this.helpText);


    // Reset progress (quest)
    this.resetText = this.add.text(20, 706, "Reset", {
      fontSize: "12px",
      fontStyle: "900",
      color: "rgba(255,90,90,0.78)"
    }).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
    this.resetText.on("pointerdown", () => this.resetProgress());
    this.ui.push(this.resetText);


    // Dialog + quiz overlays (hidden by default)
    this.dialog = this.createDialog();
    this.quiz = this.createQuiz();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC
    });

    // Minimap click -> open map
    this.input.on("pointerdown", (p) => {
      if (this.isPointInsideMinimap(p.x, p.y)) this.openMap();
    });

    // Map key
    this.keys.m.on("down", () => this.openMap());

    // Debug collisioni (C) -> mostra/nasconde l'overlay del layer collisioni
    this.keys.c.on("down", () => {
      if (this.collision?.layer?.__toggleDebug) this.collision.layer.__toggleDebug();
    });

    // Debug collisioni (toggle overlay)
    this.keys.c.on("down", () => {
      this.collision.layer.__toggleDebug?.();
    });

    // Ensure minimap doesn't render UI/dialog
    this.minimap.ignore(this.collision.layer);
    this.minimap.ignore(this.ui);
    this.minimap.ignore(this.dialog.all);
    this.minimap.ignore(this.quiz.all);
    // keep minimap clean (use marker only)
    this.minimap.ignore(this.playerAvatar);
    this.minimap.ignore(this.playerName);
    // NOTE: do NOT ignore marker on minimap; marker is already ignored by main cam above.

    // Init quest state for NPCs
    for (const n of WORLD.npcs) {
      if (!this.state.quests[n.id]) {
        this.state.quests[n.id] = {
          status: "not_started",
          title: `Quest: ${n.topic}`,
          topic: n.topic,
          attempts: 0
        };
      }
    }
    this.persistQuestState();

    this.toast("Vai da un NPC e premi E per fare il quiz della quest.");
  }

  update() {
    if (this.state.dialogOpen) {
      this.player.body.setVelocity(0, 0);
      this.syncAvatar();
      this.syncMinimapMarker();
      return;
    }

    // Movement
    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const up = this.cursors.up.isDown || this.keys.w.isDown;
    const down = this.cursors.down.isDown || this.keys.s.isDown;

    let vx = 0, vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * SPEED;
      vy = (vy / len) * SPEED;
    }

    this.player.body.setVelocity(vx, vy);
    this.syncAvatar();
    this.syncMinimapMarker();

    // Zone gating: se entri in una zona bloccata, vieni respinto
    const questState = this.registry.get("questState") || { quests: {}, activeQuestId: null };
    const here = getAreaAt(this.player.x, this.player.y);
    if (here && !isAreaUnlocked(here, questState)) {
      this.player.body.setVelocity(0, 0);
      this.player.setPosition(this.lastAllowedPos.x, this.lastAllowedPos.y);
      this.syncAvatar();
      this.syncMinimapMarker();

      if (this.time.now - this.lastLockToastAt > 900) {
        const req = (here.requires || []).map(id => this.state.quests?.[id]?.topic || id).join(", ");
        this.toast(`Zona bloccata: completa la quest richiesta (${req}).`);
        this.lastLockToastAt = this.time.now;
      }
      return;
    }

    // Aggiorna posizione consentita
    this.lastAllowedPos.x = this.player.x;
    this.lastAllowedPos.y = this.player.y;

    // Area detection
    const area = getAreaAt(this.player.x, this.player.y);
    this.areaText.setText(`Area: ${area ? area.name : "Fuori mappa"}`);

    // NPC prompts
    const nearNpc = this.getNearestNpc(this.player.x, this.player.y, 90);
    for (const [base, data] of this.npcData.entries()) {
      data.prompt.setVisible(nearNpc && nearNpc.base === base);
    }

    // Interact
    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      if (nearNpc) this.openNpcDialog(nearNpc.data);
    }

    // Quest panel
    this.refreshQuestPanel();

    // Share player pos for MapScene
    this.registry.set("playerPos", { x: this.player.x, y: this.player.y });
  }

  syncAvatar() {
    if (this.playerAvatar) this.playerAvatar.setPosition(this.player.x, this.player.y);
    if (this.playerName) this.playerName.setPosition(this.player.x, this.player.y - 44);
  }

  // ---------------------------
  // Minimap + Map
  // ---------------------------
  isPointInsideMinimap(px, py) {
    const x0 = this.minimap.x;
    const y0 = this.minimap.y;
    return (px >= x0 && px <= x0 + this.minimap.width && py >= y0 && py <= y0 + this.minimap.height);
  }

  syncMinimapMarker() {
    if (!this.marker) return;
    this.marker.setPosition(this.player.x, this.player.y);
  }

  openMap() {
    if (this.scene.isActive("MapScene")) return;

    this.registry.set("playerPos", { x: this.player.x, y: this.player.y });
    this.scene.launch("MapScene");
    this.scene.pause();
  }

  // ---------------------------
  // NPC + Quest
  // ---------------------------
  getNearestNpc(x, y, maxDist) {
    let best = null;
    let bestD = maxDist;

    for (const [base, data] of this.npcData.entries()) {
      const d = Phaser.Math.Distance.Between(x, y, data.x, data.y);
      if (d < bestD) {
        bestD = d;
        best = { base, data };
      }
    }
    return best;
  }

  openNpcDialog(npc) {
    const q = this.state.quests[npc.id];
    if (!q) return;

    const quiz = QUIZZES[npc.id];
    const pass = quiz?.passCorrect ?? 4;
    const total = quiz?.questions?.length ?? 5;

    const title = `${npc.name} · ${npc.topic}`;
    let body = "";
    let buttons = [{ id: "close", label: "Chiudi" }];

    if (q.status === "not_started") {
      body = `Quest a quiz: ${total} domande. Serve almeno ${pass} risposte corrette per sbloccare la prossima zona.`;
      buttons = [
        { id: "accept", label: "Inizia" },
        { id: "close", label: "Chiudi" }
      ];
    } else if (q.status === "active") {
      body = `Quest in corso: fai il quiz. Tentativi: ${q.attempts || 0}.`;
      buttons = [
        { id: "quiz", label: "Quiz" },
        { id: "close", label: "Chiudi" }
      ];
    } else {
      body = `Quest completata. Zona sbloccata.`;
      buttons = [{ id: "close", label: "Chiudi" }];
    }

    // IMPORTANT: open() prima di setButtons(), altrimenti open() distrugge i bottoni appena creati.
    this.dialog.open(title, body, (actionId) => {
      // chiudi sempre il pannello, poi esegui l'azione
      this.dialog.close();

      if (actionId === "accept") this.startQuest(npc);
      if (actionId === "quiz") this.openQuiz(npc);
    });
    this.dialog.setButtons(buttons);

    this.state.dialogOpen = true;
    this.state.dialogNpcId = npc.id;
  }

  startQuest(npc) {
    const q = this.state.quests[npc.id];
    if (!q || q.status !== "not_started") return;

    q.status = "active";
    this.state.activeQuestId = npc.id;
    this.persistQuestState();
    this.toast(`Quest avviata: ${npc.topic}.`);

    this.openQuiz(npc);
  }

  refreshQuestPanel() {
    let text = "Quest: —";

    const activeId = this.state.activeQuestId;
    if (activeId) {
      const q = this.state.quests[activeId];
      if (q) text = `Quest: ${q.topic} — quiz in corso`;
    } else {
      // Show first incomplete quest count
      const remaining = Object.values(this.state.quests).filter(q => q.status !== "complete").length;
      text = `Quest: ${remaining} disponibili/in corso`;
    }

    this.questText.setText(text);
  }

  resetProgress() {
    // Wipe progress (set everything back to not started)
    this.state.activeQuestId = null;
    this.state.dialogOpen = false;
    this.state.dialogNpcId = null;

    // Close any open overlays
    try { this.dialog?.close(); } catch {}
    try { this.quiz?.close(); } catch {}

    // Rebuild default quest state for every NPC
    this.state.quests = {};
    for (const n of WORLD.npcs) {
      this.state.quests[n.id] = {
        status: "not_started",
        title: `Quest: ${n.topic}`,
        topic: n.topic,
        attempts: 0
      };
    }

    // Persist (and overwrite any previous saved state)
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    this.persistQuestState();

    // Teleport back to spawn to avoid being stuck in a locked zone
    const sp = this.spawn || { x: 240, y: 240 };
    if (this.player?.body?.reset) this.player.body.reset(sp.x, sp.y);
    this.player.x = sp.x;
    this.player.y = sp.y;
    this.lastAllowedPos = { x: sp.x, y: sp.y };

    // UI refresh now (update loop may be paused while overlays are open)
    this.refreshQuestPanel?.();
    this.toast("Progressi resettati.");
  }

  persistQuestState() {
    const payload = {
      activeQuestId: this.state.activeQuestId,
      quests: this.state.quests
    };

    this.registry.set("questState", payload);

    // Persist su refresh
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  // ---------------------------
  // Quiz
  // ---------------------------
  openQuiz(npc) {
    const qState = this.state.quests[npc.id];
    if (!qState || qState.status === "complete") return;

    const quiz = QUIZZES[npc.id];
    if (!quiz) {
      this.toast("Quiz mancante per questo NPC.");
      return;
    }

    qState.attempts = (qState.attempts || 0) + 1;
    this.persistQuestState();

    this.state.dialogOpen = true;
    this.quiz.open(quiz.title, quiz, (result) => {
      if (result?.passed) {
        qState.status = "complete";
        this.state.activeQuestId = null;
        this.persistQuestState();
        this.toast(`Quest completata: ${qState.topic}.`);
      } else {
        // resta active
        this.toast("Quiz fallito. Ripeti.");
      }

      this.quiz.close();
      this.state.dialogOpen = false;
    });
  }

  // ---------------------------
  // Dialog + Toast
  // ---------------------------

  createQuiz() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(2100).setVisible(false);

    const panel = this.add.rectangle(w / 2, h / 2, 840, 460, 0x0f1624, 1)
      .setStrokeStyle(1, 0xffffff, 0.12)
      .setScrollFactor(0).setDepth(2101).setVisible(false);

    const title = this.add.text(w / 2 - 380, h / 2 - 200, "", {
      fontSize: "18px",
      fontStyle: "900",
      color: "#e8eefc"
    }).setScrollFactor(0).setDepth(2102).setVisible(false);

    const progress = this.add.text(w / 2 + 380, h / 2 - 200, "", {
      fontSize: "12px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.70)"
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(2102).setVisible(false);

    const question = this.add.text(w / 2 - 380, h / 2 - 160, "", {
      fontSize: "16px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.92)",
      wordWrap: { width: 760 }
    }).setScrollFactor(0).setDepth(2102).setVisible(false);

    const resultText = this.add.text(w / 2, h / 2 - 30, "", {
      fontSize: "18px",
      fontStyle: "900",
      color: "rgba(232,238,252,0.92)",
      align: "center",
      wordWrap: { width: 760 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2102).setVisible(false);

    const optionRects = [];
    const optionTexts = [];
    const btns = [];

    const makeButton = (x, y, label, onClick) => {
      const bw = 170;
      const bh = 38;
      const r = this.add.rectangle(x, y, bw, bh, 0xffffff, 0.08)
        .setStrokeStyle(1, 0xffffff, 0.16)
        .setScrollFactor(0).setDepth(2104)
        .setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, label, {
        fontSize: "12px",
        fontStyle: "900",
        color: "rgba(232,238,252,0.92)"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2105);
      r.on("pointerdown", () => onClick && onClick());
      btns.push(r, t);
      return { r, t };
    };

    for (let i = 0; i < 4; i++) {
      const y = h / 2 - 70 + i * 68;

      const rect = this.add.rectangle(w / 2, y, 780, 52, 0xffffff, 0.06)
        .setStrokeStyle(1, 0xffffff, 0.10)
        .setScrollFactor(0).setDepth(2103).setVisible(false)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(w / 2 - 360, y, "", {
        fontSize: "14px",
        fontStyle: "800",
        color: "rgba(232,238,252,0.85)",
        wordWrap: { width: 720 }
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2104).setVisible(false);

      optionRects.push(rect);
      optionTexts.push(txt);
    }

    const api = {
      all: [overlay, panel, title, progress, question, resultText, ...optionRects, ...optionTexts],
      _visible: false,
      _quiz: null,
      _idx: 0,
      _correct: 0,
      _locked: false,
      _onDone: null,
      _mode: "q",

      open: (t, quiz, onDone) => {
        api._quiz = quiz;
        api._idx = 0;
        api._correct = 0;
        api._locked = false;
        api._onDone = onDone;
        api._mode = "q";

        title.setText(t);
        overlay.setVisible(true);
        panel.setVisible(true);
        title.setVisible(true);
        progress.setVisible(true);
        question.setVisible(true);
        resultText.setVisible(false);

        for (const b of btns) b.destroy();
        btns.length = 0;

        for (let i = 0; i < 4; i++) {
          optionRects[i].setVisible(true);
          optionTexts[i].setVisible(true);
        }

        api.render();
        api._visible = true;
      },

      close: () => {
        overlay.setVisible(false);
        panel.setVisible(false);
        title.setVisible(false);
        progress.setVisible(false);
        question.setVisible(false);
        resultText.setVisible(false);
        for (let i = 0; i < 4; i++) {
          optionRects[i].setVisible(false);
          optionTexts[i].setVisible(false);
        }

        for (const b of btns) b.destroy();
        btns.length = 0;

        api._visible = false;
        api._quiz = null;
        api._onDone = null;
        api._locked = false;
        api._mode = "q";
      },

      render: () => {
        const quiz = api._quiz;
        const total = quiz?.questions?.length ?? 0;
        const passCorrect = quiz?.passCorrect ?? Math.max(1, Math.ceil(total * 0.8));

        if (!quiz || total === 0) {
          question.setText("Quiz non disponibile");
          progress.setText("");
          return;
        }

        // reset styles
        for (let i = 0; i < 4; i++) {
          optionRects[i].setFillStyle(0xffffff, 0.06);
          optionRects[i].setStrokeStyle(1, 0xffffff, 0.10);
          optionRects[i].removeAllListeners();
        }

        const item = quiz.questions[api._idx];
        progress.setText(`Domanda ${api._idx + 1}/${total}  |  Corrette: ${api._correct}`);
        question.setText(item.q);

        for (let i = 0; i < 4; i++) {
          optionTexts[i].setText(item.options[i] ?? "");
          optionRects[i].on("pointerdown", () => {
            if (api._locked) return;
            api._locked = true;

            const isRight = i === item.correct;
            if (isRight) api._correct += 1;

            // evidenzia risposta corretta/sbagliata (solo per feedback visivo)
            optionRects[item.correct].setFillStyle(0xffffff, 0.14);
            optionRects[i].setStrokeStyle(2, 0x5fe1ff, isRight ? 0.75 : 0.25);

            this.time.delayedCall(380, () => {
              api._idx += 1;
              api._locked = false;

              if (api._idx >= total) {
                const passed = api._correct >= passCorrect;
                api.showResult({ passed, correct: api._correct, total, passCorrect });
              } else {
                api.render();
              }
            });
          });
        }
      },

      showResult: ({ passed, correct, total, passCorrect }) => {
        api._mode = "r";

        for (let i = 0; i < 4; i++) {
          optionRects[i].setVisible(false);
          optionTexts[i].setVisible(false);
          optionRects[i].removeAllListeners();
        }

        progress.setText("");
        question.setVisible(false);
        resultText.setVisible(true);

        const verdict = passed ? "PASS" : "FAIL";
        resultText.setText(`${verdict}\nPunteggio: ${correct}/${total}\nRichiesto: ${passCorrect}/${total}`);

        for (const b of btns) b.destroy();
        btns.length = 0;

        if (!passed) {
          makeButton(w / 2 - 92, h / 2 + 170, "Riprova", () => {
            // restart same quiz without leaving
            question.setVisible(true);
            resultText.setVisible(false);
            for (let i = 0; i < 4; i++) {
              optionRects[i].setVisible(true);
              optionTexts[i].setVisible(true);
            }
            api._idx = 0;
            api._correct = 0;
            api._locked = false;
            api._mode = "q";
            api.render();
          });
          makeButton(w / 2 + 92, h / 2 + 170, "Chiudi", () => {
            api._onDone && api._onDone({ passed: false, correct, total });
          });
        } else {
          makeButton(w / 2, h / 2 + 170, "Conferma", () => {
            api._onDone && api._onDone({ passed: true, correct, total });
          });
        }
      }
    };

    // ESC closes quiz (treated as fail/abort)
    this.input.keyboard.on("keydown-ESC", () => {
      if (!api._visible) return;
      const total = api._quiz?.questions?.length ?? 0;
      api._onDone && api._onDone({ passed: false, aborted: true, correct: api._correct, total });
    });

    return api;
  }

  createDialog() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(2000).setVisible(false);

    const panel = this.add.rectangle(w / 2, h / 2, 720, 220, 0x0f1624, 1)
      .setStrokeStyle(1, 0xffffff, 0.12)
      .setScrollFactor(0).setDepth(2001).setVisible(false);

    const title = this.add.text(w / 2 - 320, h / 2 - 88, "", {
      fontSize: "18px",
      fontStyle: "900",
      color: "#e8eefc"
    }).setScrollFactor(0).setDepth(2002).setVisible(false);

    const body = this.add.text(w / 2 - 320, h / 2 - 58, "", {
      fontSize: "14px",
      color: "rgba(232,238,252,0.78)",
      wordWrap: { width: 640 }
    }).setScrollFactor(0).setDepth(2002).setVisible(false);

    const buttons = [];

    const api = {
      all: [overlay, panel, title, body],
      open: (t, b, onAction) => {
        title.setText(t);
        body.setText(b);

        overlay.setVisible(true);
        panel.setVisible(true);
        title.setVisible(true);
        body.setVisible(true);

        api._onAction = onAction;
        api._visible = true;

        for (const btn of buttons) btn.destroy();
        buttons.length = 0;
      },
      close: () => {
        overlay.setVisible(false);
        panel.setVisible(false);
        title.setVisible(false);
        body.setVisible(false);
        for (const btn of buttons) btn.destroy();
        buttons.length = 0;

        api._visible = false;
        this.state.dialogOpen = false;
        this.state.dialogNpcId = null;
      },
      setButtons: (defs) => {
        const baseY = h / 2 + 70;
        let x = w / 2 + 320;

        for (let i = defs.length - 1; i >= 0; i--) {
          const d = defs[i];
          const bw = 130;
          const bh = 36;

          const r = this.add.rectangle(x - bw / 2, baseY, bw, bh, 0xffffff, d.id === "accept" ? 0.12 : 0.06)
            .setStrokeStyle(1, 0x5fe1ff, d.id === "accept" ? 0.45 : 0.12)
            .setScrollFactor(0).setDepth(2003)
            .setInteractive({ useHandCursor: true });

          const tx = this.add.text(r.x, r.y, d.label, {
            fontSize: "13px",
            fontStyle: "900",
            color: "#e8eefc"
          }).setOrigin(0.5).setScrollFactor(0).setDepth(2004);

          r.on("pointerdown", () => api._onAction && api._onAction(d.id));

          this.minimap.ignore([r, tx]);
          buttons.push(r, tx);
          x -= (bw + 12);
        }
      },
      _onAction: null,
      _visible: false
    };

    // Close by ESC when visible
    this.input.keyboard.on("keydown-ESC", () => {
      if (api._visible) api.close();
    });

    return api;
  }

  toast(msg) {
    if (!this.toastText) {
      this.toastText = this.add.text(this.scale.width / 2, this.scale.height - 28, "", {
        fontSize: "13px",
        fontStyle: "900",
        color: "rgba(232,238,252,0.92)",
        backgroundColor: "rgba(15,22,36,0.75)",
        padding: { left: 12, right: 12, top: 8, bottom: 8 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(3000);
      this.minimap.ignore(this.toastText);
    }

    this.toastText.setText(msg);
    this.toastText.setVisible(true);

    if (this.state.toastTimer) this.state.toastTimer.remove(false);
    this.state.toastTimer = this.time.delayedCall(1800, () => {
      if (this.toastText) this.toastText.setVisible(false);
    });
  }
}
