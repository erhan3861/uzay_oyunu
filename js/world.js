// world.js — Zemin, patika, kilitli/açık istasyonlar, GLB yükleyici
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// İstasyonlar PATİKA sırasına göre dizili — index 0 başta açık
export const STATION_LAYOUT = [
  { id: "ist_1", pos: new THREE.Vector3(0, 0, 4),   renk: 0x4cc9f0 },
  { id: "ist_2", pos: new THREE.Vector3(-8, 0, -8), renk: 0xf72585 },
  { id: "ist_3", pos: new THREE.Vector3(8, 0, -18), renk: 0xffd60a },
];

export class World {
  constructor(scene) {
    this.scene = scene;
    this.stations = [];
    this._buildGround();
    this._buildPath();
    this._buildStations();
    this.setActiveIndex(0); // sadece ilk istasyon açık başlar
  }

  _buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x1b263b })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(new THREE.GridHelper(80, 40, 0x415a77, 0x2a3a52));
  }

  // İstasyonları birbirine bağlayan görsel patika
  _buildPath() {
    for (let i = 0; i < STATION_LAYOUT.length - 1; i++) {
      const a = STATION_LAYOUT[i].pos;
      const b = STATION_LAYOUT[i + 1].pos;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      const yol = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.05, len),
        new THREE.MeshStandardMaterial({ color: 0x3a506b })
      );
      yol.position.copy(mid).setY(0.03);
      yol.lookAt(b.x, 0.03, b.z);
      this.scene.add(yol);
    }
  }

  _buildStations() {
    STATION_LAYOUT.forEach((s) => {
      const group = new THREE.Group();

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 2.5, 16),
        new THREE.MeshStandardMaterial({ color: s.renk, emissive: s.renk, emissiveIntensity: 0.3 })
      );
      pillar.position.y = 1.25;
      pillar.castShadow = true;
      group.add(pillar);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.12, 12, 40),
        new THREE.MeshStandardMaterial({ color: s.renk, emissive: s.renk, emissiveIntensity: 0.6 })
      );
      ring.position.y = 1.25;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      // kilit ikonu (kilitliyken görünür)
      const kilit = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      kilit.position.y = 3.2;
      group.add(kilit);

      group.position.copy(s.pos);
      group.userData = {
        id: s.id, pillar, ring, kilit,
        renk: s.renk, tamam: false, acik: false,
      };
      this.scene.add(group);
      this.stations.push(group);
    });
  }

  // Belirli index'e kadar olanları açık, sonrasını kilitli yapar
  setActiveIndex(idx) {
    this.stations.forEach((g, i) => {
      const acik = i <= idx && !g.userData.tamam;
      g.userData.acik = i <= idx;
      this._setVisual(g);
    });
  }

  _setVisual(g) {
    const d = g.userData;
    if (d.tamam) {
      d.pillar.material.color.set(0x06d6a0);
      d.ring.material.color.set(0x06d6a0);
      d.ring.material.emissive.set(0x06d6a0);
      d.kilit.visible = false;
    } else if (d.acik) {
      d.pillar.material.color.set(d.renk);
      d.ring.material.color.set(d.renk);
      d.ring.material.emissive.set(d.renk);
      d.ring.material.emissiveIntensity = 0.6;
      d.kilit.visible = false;
    } else {
      // kilitli: sönük gri
      d.pillar.material.color.set(0x404a5a);
      d.ring.material.color.set(0x404a5a);
      d.ring.material.emissive.set(0x000000);
      d.kilit.visible = true;
    }
  }

  markComplete(stationId) {
    const g = this.stations.find((s) => s.userData.id === stationId);
    if (g) { g.userData.tamam = true; this._setVisual(g); }
  }

  loadStationModel(stationId, url) {
    const station = this.stations.find((g) => g.userData.id === stationId);
    if (!station) return;
    new GLTFLoader().load(url, (gltf) => {
      gltf.scene.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      station.add(gltf.scene);
    });
  }

  update(dt) {
    this.stations.forEach((g) => {
      if (g.userData.acik || g.userData.tamam) g.userData.ring.rotation.z += dt * 1.5;
      g.userData.kilit.rotation.y += dt;
    });
  }
}
