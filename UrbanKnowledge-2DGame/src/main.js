import "./ui.css";
import Phaser from "phaser";

import BootScene from "./scenes/BootScene.js";
import CustomizeScene from "./scenes/CustomizeScene.js";
import WorldScene from "./scenes/WorldScene.js";
import MapScene from "./scenes/MapScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#0b0f17",
  // Needed for name input in CustomizeScene
  dom: {
    createContainer: true
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, CustomizeScene, WorldScene, MapScene]
};

new Phaser.Game(config);
