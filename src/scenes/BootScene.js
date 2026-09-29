import Phaser from 'phaser';
import { makeTextures } from '../systems/textures.js';
import { loadSave } from '../systems/save.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    loadSave();
    makeTextures(this);
    this.scene.start('menu');
  }
}
