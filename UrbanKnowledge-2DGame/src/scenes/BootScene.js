import Phaser from "phaser";

import { AVATAR_STORAGE_KEY, defaultAvatar, sanitizeAvatar } from "../avatar/avatar.js";

const STORAGE_KEY = "ukg_questState_v1";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    // Avatar persisted across sessions
    let restoredAvatar = null;
    try {
      const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (raw) restoredAvatar = JSON.parse(raw);
    } catch {
      restoredAvatar = null;
    }
    this.registry.set("avatar", sanitizeAvatar(restoredAvatar || defaultAvatar()));

    // Quest state persisted across scenes + localStorage
    let restored = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = JSON.parse(raw);
    } catch {
      restored = null;
    }

    this.registry.set(
      "questState",
      restored && typeof restored === "object"
        ? restored
        : {
            activeQuestId: null,
            quests: {} // npcId -> {status, attempts, title, topic}
          }
    );

    this.scene.start("CustomizeScene");
  }
}
