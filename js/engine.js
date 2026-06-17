// engine.js — Three.js çekirdek: sahne, kamera, ışık, render döngüsü
import * as THREE from "three";

export class Engine {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1b2a);
    this.scene.fog = new THREE.Fog(0x0d1b2a, 20, 60);

    this.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 200
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    this._addLights();

    this.clock = new THREE.Clock();
    this.updaters = []; // her frame çağrılacak fonksiyonlar

    window.addEventListener("resize", () => this._onResize());
  }

  _addLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    this.scene.add(dir);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onUpdate(fn) {
    this.updaters.push(fn);
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = this.clock.getDelta();
      this.updaters.forEach((fn) => fn(dt));
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }
}
