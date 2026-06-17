// game.js — Orkestratör: config okur, patika ilerlemesi, puan + bitiş şifresi
import { Engine } from "./engine.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { Quiz } from "./quiz.js";

const config = JSON.parse(document.getElementById("game-config").textContent);
const bank = JSON.parse(document.getElementById("question-bank").textContent).questions;
console.log("Ders:", config.maarif.ders, "| Özel talimat:", config.ozel_talimat);

const engine = new Engine();
const world = new World(engine.scene);
const player = new Player(engine.scene, engine.camera);

const elGuc = document.getElementById("guc");
const elJoker = document.getElementById("joker");
const elPuan = document.getElementById("puan");
const elHedef = document.getElementById("hedef");
const ipucu = document.getElementById("ipucu");

let aktifIndex = 0;                       // patikada açık olan en son istasyon
const toplam = world.stations.length;

const quiz = new Quiz(bank, {
  onUpdate: (d) => {
    elGuc.textContent = d.guc;
    elJoker.textContent = d.joker;
    elPuan.textContent = d.puan;
  },
  onStationDone: (stationId) => {
    world.markComplete(stationId);
    aktifIndex++;
    elHedef.textContent = `İstasyon: ${aktifIndex}/${toplam}`;
    if (aktifIndex >= toplam) {
      _bitir();
    } else {
      world.setActiveIndex(aktifIndex);   // bir sonraki istasyonu aç
      _ipucuGoster(`✨ Yeni istasyon açıldı! Patikayı takip et.`);
    }
  },
});

// E tuşu: yakın istasyonu aç (kilitliyse uyar)
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && !quiz.isOpen) {
    const near = player.nearestStation(world.stations);
    if (!near) return;
    if (near.userData.acik) {
      quiz.open(near.userData.id);
    } else {
      _ipucuGoster("🔒 Bu istasyon kilitli — önce önceki istasyonu bitir!");
    }
  }
});

let ipucuTimer;
function _ipucuGoster(metin) {
  ipucu.textContent = metin;
  ipucu.style.opacity = "1";
  clearTimeout(ipucuTimer);
  ipucuTimer = setTimeout(() => {
    ipucu.textContent = "WASD ile hareket et · İstasyona yaklaş ve E ile soruyu aç";
  }, 2500);
}

engine.onUpdate((dt) => {
  world.update(dt);
  player.update(dt, quiz.isOpen);
  const near = player.nearestStation(world.stations);
  if (!ipucuTimer || ipucu.textContent.startsWith("WASD")) {
    ipucu.style.opacity = near && !quiz.isOpen ? "1" : "0.45";
  }
});

// Bitişte puana göre şifre üret
function _bitir() {
  const box = document.getElementById("kazandin");
  const puan = quiz.puan;

  // Şifre: çıktı baş harfleri + puan (basit, deterministik örnek)
  const harfler = config.maarif.ogrenme_ciktilari
    .map((c) => c.trim()[0].toUpperCase())
    .join("");
  const sifre = `${harfler}-${puan}-${quiz.guc}${quiz.joker}`;

  document.getElementById("final-skor").textContent =
    `🏆 Puan: ${puan}  ·  ⚡ Güç: ${quiz.guc}  ·  🃏 Joker: ${quiz.joker}`;
  document.getElementById("final-sifre").textContent = sifre;
  box.classList.remove("hidden");
}

engine.start();

// Ağır GLB modeli GitHub'dan yüklemek için:
// world.loadStationModel("ist_1", "assets/models/portal.glb");
