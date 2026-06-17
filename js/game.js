// game.js — Orkestratör: config okur, tüm modülleri bağlar, HUD + bitiş şifresi
import { Engine } from "./engine.js";
import { AsteroidField } from "./asteroids.js";
import { Quiz } from "./quiz.js";
import { sounds } from "./sound.js";

const config = JSON.parse(document.getElementById("game-config").textContent);
const bank = JSON.parse(document.getElementById("question-bank").textContent).questions;
console.log("Ders:", config.maarif.ders, "| Özel talimat:", config.ozel_talimat);

// Ses kontrolü butonu ve dinleyicisi
const elSesKontrol = document.getElementById("ses-kontrol");
if (elSesKontrol) {
  elSesKontrol.addEventListener("click", () => {
    sounds.toggleMute(elSesKontrol);
  });
}

const engine = new Engine();
const field = new AsteroidField(engine.scene, engine);

// HUD elemanları
const elPuan = document.getElementById("puan");
const elGuc = document.getElementById("guc");
const elJoker = document.getElementById("joker");
const elSeri = document.getElementById("seri");
const elIlerleme = document.getElementById("ilerleme");
const elJokerHud = document.getElementById("joker-hud");
const elJokerAction = document.getElementById("joker-action");

const soruBandi = document.getElementById("soru-bandi");
const soruCikti = document.getElementById("soru-cikti");
const soruMetni = document.getElementById("soru-metni");
const bildirim = document.getElementById("bildirim");

let bildirimTimer;

// HUD değer değişim animasyonu (darbe/pulse efekti)
function animateValue(element, newValue) {
  const oldValue = element.textContent;
  if (oldValue !== String(newValue)) {
    element.textContent = newValue;
    const parent = element.parentElement;
    if (parent) {
      parent.classList.remove("pulse");
      void parent.offsetWidth; // Reflow tetikleme (animasyonu sıfırlamak için)
      parent.classList.add("pulse");
    }
  }
}

// Joker butonunun görsel durumunu güncelle
function updateJokerUI(joker, puan) {
  if (!elJokerAction || !elJokerHud) return;
  if (joker > 0) {
    elJokerAction.textContent = " [Kullan: J]";
    elJokerAction.style.color = "#4fffa8";
    elJokerAction.style.display = "inline";
    elJokerHud.style.borderColor = "rgba(79, 255, 168, 0.6)";
  } else if (puan >= 30) {
    elJokerAction.textContent = " [Al (30P)]";
    elJokerAction.style.color = "#ffb03f";
    elJokerAction.style.display = "inline";
    elJokerHud.style.borderColor = "rgba(255, 176, 63, 0.6)";
  } else {
    elJokerAction.style.display = "none";
    elJokerHud.style.borderColor = "rgba(63, 216, 255, 0.35)";
  }
}

const quiz = new Quiz(bank, field, {
  onUpdate: (d) => {
    animateValue(elPuan, d.puan);
    animateValue(elGuc, d.guc);
    animateValue(elJoker, d.joker);
    animateValue(elSeri, d.seri);
    updateJokerUI(d.joker, d.puan);
  },
  onQuestion: (q, n, toplam) => {
    soruBandi.classList.remove("hidden");
    soruCikti.textContent = "🎯 " + q.ciktilar;
    soruMetni.textContent = q.soru;
    elIlerleme.textContent = `SORU ${n}/${toplam}`;
  },
  onBildirim: (metin, basarili) => {
    bildirim.textContent = metin;
    bildirim.className = basarili ? "basarili" : "hata";
    bildirim.classList.remove("hidden");
    clearTimeout(bildirimTimer);
    bildirimTimer = setTimeout(() => bildirim.classList.add("hidden"), 1500);
  },
  onFinish: (d) => _bitir(d),
});

// Joker'i tıkla veya J tuşuna basarak kullanma desteği
if (elJokerHud) {
  elJokerHud.addEventListener("click", () => quiz.kullanJoker());
}
window.addEventListener("keydown", (e) => {
  if (e.key && e.key.toLowerCase() === "j") {
    quiz.kullanJoker();
  }
});

// Oyun döngüsü
engine.onUpdate((dt) => field.update(dt));
engine.start();

// Başlat butonu
document.getElementById("basla-btn").addEventListener("click", () => {
  document.getElementById("baslangic").classList.add("hidden");
  quiz.basla();
});

// Bitiş + görev şifresi
function _bitir(d) {
  field.temizle();
  soruBandi.classList.add("hidden");
  sounds.playFinish(); // Görev tamamlandığında fanfar çal
  const harfler = config.maarif.ogrenme_ciktilari
    .map((c) => c.trim()[0].toUpperCase()).join("");
  const sifre = `${harfler}-${d.puan}-${d.guc}${d.joker}`;
  document.getElementById("bitis-skor").textContent =
    `🏆 Puan: ${d.puan}  ·  ⚡ Güç: ${d.guc}  ·  🃏 Joker: ${d.joker}`;
  document.getElementById("bitis-sifre").textContent = sifre;
  document.getElementById("bitis").classList.remove("hidden");
}

// Ağır GLB gemi/asteroid modeli yüklemek istersen burada GLTFLoader kullan:
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
