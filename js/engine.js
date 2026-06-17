// engine.js — Uzay sahnesi: yıldız alanı, nebula ışıkları, render döngüsü, fare raycaster
import * as THREE from "three";

export class Engine {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05010f);
    this.scene.fog = new THREE.FogExp2(0x05010f, 0.012);

    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.1, 600
    );
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, -1);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    this._addLights();
    this._addStarfield();
    this._addNebula();

    this.clock = new THREE.Clock();
    this.updaters = [];

    // Fare nişanı için raycaster
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    window.addEventListener("resize", () => this._onResize());
  }

  _addLights() {
    this.scene.add(new THREE.AmbientLight(0x6688ff, 0.6));
    const key = new THREE.PointLight(0x66ccff, 2.2, 300);
    key.position.set(20, 30, 30);
    this.scene.add(key);
    const rim = new THREE.PointLight(0xff5577, 1.6, 300);
    rim.position.set(-30, -10, 10);
    this.scene.add(rim);
  }

  // Binlerce yıldız (Points)
  _addStarfield() {
    const N = 2500;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 500;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 500;
      pos[i * 3 + 2] = -Math.random() * 500;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.7, sizeAttenuation: true,
      transparent: true, opacity: 0.9,
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  // Renkli sis bulutları (uzak büyük küreler, hafif parlayan)
  _addNebula() {
    const renkler = [0x3a1c71, 0x1c3a71, 0x4a1c5c];
    renkler.forEach((c, i) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(60, 16, 16),
        new THREE.MeshBasicMaterial({
          color: c, transparent: true, opacity: 0.06,
        })
      );
      mesh.position.set((i - 1) * 90, (i % 2 ? 1 : -1) * 40, -260);
      this.scene.add(mesh);
    });
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ekran koordinatından sahnedeki ışınları hesapla
  setPointer(clientX, clientY) {
    this.pointer.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  onUpdate(fn) { this.updaters.push(fn); }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      // yıldız alanı yavaşça ileri aksın (uzayda süzülme hissi)
      if (this.stars) {
        const p = this.stars.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          let z = p.getZ(i) + dt * 6;
          if (z > 5) z = -500;
          p.setZ(i, z);
        }
        p.needsUpdate = true;
      }
      this.updaters.forEach((fn) => fn(dt));
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }
}
