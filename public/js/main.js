import Game from "./game.js";
import Menu from "./menu.js";

var config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { debug: false }

  },
  scene: [Menu, Game],
   scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH
}
};

const game = new Phaser.Game(config);
