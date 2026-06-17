// quiz.js — Soru paneli, 50:50 joker kullanımı, puan ve ödül yönetimi
export class Quiz {
  constructor(questionBank, callbacks) {
    this.bank = questionBank;
    this.cb = callbacks; // { onUpdate, onStationDone }
    this.guc = 0;
    this.joker = 0;
    this.puan = 0;
    this.activeStation = null;
    this.queue = [];
    this.jokerKullanildi = false;

    this.overlay = document.getElementById("quiz-overlay");
    this.elCikti = document.getElementById("quiz-cikti");
    this.elSoru = document.getElementById("quiz-soru");
    this.elSecenekler = document.getElementById("quiz-secenekler");
    this.elSonuc = document.getElementById("quiz-sonuc");
    this.elJokerBtn = document.getElementById("joker-btn");

    this.elJokerBtn.onclick = () => this._jokerKullan();
  }

  open(stationId) {
    this.activeStation = stationId;
    this.queue = this.bank.filter((q) => q.station_id === stationId);
    this.overlay.classList.remove("hidden");
    this._showNext();
  }

  _showNext() {
    if (this.queue.length === 0) {
      this.close();
      this.cb.onStationDone(this.activeStation);
      return;
    }
    const q = this.queue[0];
    this.jokerKullanildi = false;
    this.elCikti.textContent = "🎯 " + q.ciktilar;
    this.elSoru.textContent = q.soru;
    this.elSonuc.textContent = "";
    this.elSecenekler.innerHTML = "";

    q.secenekler.forEach((metin, i) => {
      const btn = document.createElement("button");
      btn.className = "secenek";
      btn.dataset.index = i;
      btn.textContent = metin;
      btn.onclick = () => this._cevapla(q, i, btn);
      this.elSecenekler.appendChild(btn);
    });

    this.elJokerBtn.disabled = this.joker <= 0;
    this.elJokerBtn.textContent = `🃏 Joker kullan (${this.joker})`;
  }

  // 50:50 — yanlış şıklardan ikisini eler
  _jokerKullan() {
    if (this.joker <= 0 || this.jokerKullanildi) return;
    const q = this.queue[0];
    this.jokerKullanildi = true;
    this.joker--;

    const yanlislar = q.secenekler
      .map((_, i) => i)
      .filter((i) => i !== q.dogru);
    yanlislar.sort(() => Math.random() - 0.5);
    const elenecek = yanlislar.slice(0, 2);

    this.elSecenekler.querySelectorAll(".secenek").forEach((btn) => {
      if (elenecek.includes(Number(btn.dataset.index))) {
        btn.classList.add("elendi");
        btn.disabled = true;
      }
    });

    this.elJokerBtn.disabled = true;
    this.elJokerBtn.textContent = "🃏 Joker kullanıldı";
    this.cb.onUpdate(this._durum());
  }

  _cevapla(q, secilen, btn) {
    if (secilen === q.dogru) {
      btn.classList.add("dogru");
      const kazanilanPuan = this.jokerKullanildi ? 3 : 5;
      this.puan += kazanilanPuan;

      if (q.odul === "joker") {
        this.joker++;
        this.elSonuc.textContent = `✅ Doğru! 🃏 +1 Joker, +${kazanilanPuan} puan`;
      } else {
        this.guc++;
        this.elSonuc.textContent = `✅ Doğru! ⚡ +1 Güç, +${kazanilanPuan} puan`;
      }
      this.cb.onUpdate(this._durum());
      this.queue.shift();
      setTimeout(() => this._showNext(), 1000);
    } else {
      btn.classList.add("yanlis");
      btn.disabled = true;
      this.elSonuc.textContent = "❌ Yanlış! Diğer şıkları dene.";
    }
  }

  _durum() {
    return { guc: this.guc, joker: this.joker, puan: this.puan };
  }

  close() {
    this.overlay.classList.add("hidden");
    this.activeStation = null;
  }

  get isOpen() {
    return !this.overlay.classList.contains("hidden");
  }
}
