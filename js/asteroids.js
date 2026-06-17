// asteroids.js — Şıkları asteroid olarak üretir, karşıdan akıtır, vuruş + patlama efekti
import * as THREE from "three";
import { sounds } from "./sound.js";

const ASTEROID_RENK = 0x8a7f6b;
const ETIKET_RENK = "#e8f4ff";

export class AsteroidField {
  constructor(scene, engine) {
    this.scene = scene;
    this.engine = engine;
    this.aktifler = [];       // ekranda akan asteroidler
    this.parcaciklar = [];    // patlama parçacıkları
    this.lazerler = [];       // lazer ışınları
    this.onHit = null;        // (index, asteroidGroup) => void
    this.kilit = false;       // soru çözülürken yeni tık alma

    // tıklama
    this.engine.renderer.domElement.addEventListener("click", (e) => this._tik(e));
  }

  // Bir sorunun 4 şıkkını asteroid olarak sahneye serpiştir
  spawn(secenekler) {
    this.temizle();
    this.kilit = false;
    const slotX = [-15, -5, 5, 15];     // yatay yerleşim (şıkların çakışmaması için genişletildi)
    secenekler.forEach((metin, i) => {
      const g = this._asteroidYap(metin, i);
      g.position.set(
        slotX[i] + (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 6,           // dikey yerleşim aralığı
        -140 - Math.random() * 45           // uzaktan başla (derinlik aralığı genişletildi)
      );
      g.userData = {
        index: i,
        hiz: 9 + Math.random() * 2,         // bize doğru akış hızı
        donus: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6
        ),
      };
      this.scene.add(g);
      this.aktifler.push(g);
    });
  }

  _asteroidYap(metin, i) {
    const group = new THREE.Group();

    // pürüzlü kaya — icosahedron + rastgele vertex sapması
    const geo = new THREE.IcosahedronGeometry(2.2, 1);
    const p = geo.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const f = 1 + (Math.random() - 0.5) * 0.35;
      p.setXYZ(v, p.getX(v) * f, p.getY(v) * f, p.getZ(v) * f);
    }
    geo.computeVertexNormals();
    const kaya = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: ASTEROID_RENK, roughness: 0.95, metalness: 0.05,
        emissive: 0x221a10, emissiveIntensity: 0.4,
      })
    );
    group.add(kaya);
    group.userData_kaya = kaya;

    // şık metni — canvas texture ile sprite etiket
    const etiket = this._etiketSprite(metin);
    etiket.position.set(0, 3.4, 0);
    group.add(etiket);

    return group;
  }

  _etiketSprite(metin) {
    const cnv = document.createElement("canvas");
    cnv.width = 512; cnv.height = 128;
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = "rgba(5,10,25,0.78)";
    this._roundRect(ctx, 6, 6, 500, 116, 24); ctx.fill();
    ctx.strokeStyle = "#3fd8ff"; ctx.lineWidth = 4;
    this._roundRect(ctx, 6, 6, 500, 116, 24); ctx.stroke();
    ctx.fillStyle = ETIKET_RENK;
    ctx.font = "bold 44px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // uzun metni kısalt
    let t = metin; if (t.length > 22) t = t.slice(0, 21) + "…";
    ctx.fillText(t, 256, 66);

    const tex = new THREE.CanvasTexture(cnv);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    spr.scale.set(8, 2, 1);
    return spr;
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  _tik(e) {
    if (this.kilit || this.aktifler.length === 0) return;
    this.engine.setPointer(e.clientX, e.clientY);
    const meshler = this.aktifler.map((g) => g.userData_kaya);
    const kesisim = this.engine.raycaster.intersectObjects(meshler, false);
    if (kesisim.length === 0) return;

    const vurulanKaya = kesisim[0].object;
    const grup = this.aktifler.find((g) => g.userData_kaya === vurulanKaya);
    if (!grup) return;

    this._lazerAt(grup.position);
    if (this.onHit) this.onHit(grup.userData.index, grup);
  }

  // doğru vuruşta asteroidi patlat
  patlat(grup) {
    this.kilit = true;
    sounds.playExplosion();
    const merkez = grup.position.clone();
    const renk = 0xff8a3c;
    for (let i = 0; i < 26; i++) {
      const par = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.3 + Math.random() * 0.4),
        new THREE.MeshBasicMaterial({ color: i % 3 ? renk : 0xffd27a })
      );
      par.position.copy(merkez);
      par.userData = {
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 22
        ),
        omur: 1,
      };
      this.scene.add(par);
      this.parcaciklar.push(par);
    }
    this._kaldir(grup);
  }

  // yanlış vuruşta hafif sarsıntı/kırmızı flaş
  yanlisVurus(grup) {
    sounds.playWrong();
    const m = grup.userData_kaya.material;
    const eski = m.color.getHex();
    m.color.set(0xff3344);
    setTimeout(() => m.color.set(eski), 250);
  }

  _lazerAt(hedef) {
    sounds.playLaser();
    const baslangic = new THREE.Vector3(0, -6, -2); // gemi altından
    const yon = hedef.clone().sub(baslangic);
    const uzunluk = yon.length();
    const geo = new THREE.CylinderGeometry(0.08, 0.08, uzunluk, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x3fd8ff, transparent: true, opacity: 0.9 });
    const lazer = new THREE.Mesh(geo, mat);
    lazer.position.copy(baslangic).add(hedef).multiplyScalar(0.5);
    lazer.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), yon.clone().normalize()
    );
    lazer.userData = { omur: 1 };
    this.scene.add(lazer);
    this.lazerler.push(lazer);
  }

  _kaldir(grup) {
    this.scene.remove(grup);
    this.aktifler = this.aktifler.filter((g) => g !== grup);
  }

  temizle() {
    this.aktifler.forEach((g) => this.scene.remove(g));
    this.aktifler = [];
  }

  update(dt) {
    // asteroidleri bize doğru ilerlet + döndür
    this.aktifler.forEach((g) => {
      g.position.z += g.userData.hiz * dt;
      g.userData_kaya.rotation.x += g.userData.donus.x * dt;
      g.userData_kaya.rotation.y += g.userData.donus.y * dt;
      // çok yaklaşırsa yeniden uzağa gönder (kaçırma → tekrar şans)
      if (g.position.z > 6) g.position.z = -150;
    });

    // patlama parçacıkları
    this.parcaciklar.forEach((par) => {
      par.position.addScaledVector(par.userData.vel, dt);
      par.userData.omur -= dt * 1.6;
      par.scale.setScalar(Math.max(par.userData.omur, 0.01));
    });
    this.parcaciklar = this.parcaciklar.filter((par) => {
      if (par.userData.omur <= 0) { this.scene.remove(par); return false; }
      return true;
    });

    // lazerler hızla sönsün
    this.lazerler.forEach((l) => { l.userData.omur -= dt * 5; l.material.opacity = l.userData.omur; });
    this.lazerler = this.lazerler.filter((l) => {
      if (l.userData.omur <= 0) { this.scene.remove(l); return false; }
      return true;
    });
  }
}
