// player.js — Oyuncu küresi, WASD hareketi, kamera takibi, yakınlık algılama
import * as THREE from "three";

export class Player {
  constructor(scene, camera) {
    this.camera = camera;
    this.speed = 8;
    this.keys = {};

    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x90e0ef, emissive: 0x48cae4, emissiveIntensity: 0.4 })
    );
    this.mesh.position.set(0, 0.6, 6);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
  }

  update(dt, paused) {
    if (!paused) {
      const dir = new THREE.Vector3();
      if (this.keys["KeyW"]) dir.z -= 1;
      if (this.keys["KeyS"]) dir.z += 1;
      if (this.keys["KeyA"]) dir.x -= 1;
      if (this.keys["KeyD"]) dir.x += 1;
      dir.normalize().multiplyScalar(this.speed * dt);
      this.mesh.position.add(dir);

      // sınır
      this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -38, 38);
      this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -38, 38);
    }

    // kamera oyuncuyu takip eder
    const target = this.mesh.position.clone().add(new THREE.Vector3(0, 10, 12));
    this.camera.position.lerp(target, 0.08);
    this.camera.lookAt(this.mesh.position);
  }

  // En yakın istasyonu döndürür (kilitli/açık fark etmez, menzil içindeyse)
  nearestStation(stations, menzil = 2.8) {
    for (const s of stations) {
      if (s.userData.tamam) continue;
      if (this.mesh.position.distanceTo(s.position) < menzil) return s;
    }
    return null;
  }
}
