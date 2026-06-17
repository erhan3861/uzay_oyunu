// quiz.js — Soru akışı, vuruş değerlendirme, puan/güç/joker, doğru seri ödülü
import { sounds } from "./sound.js";

const SERI_JOKER_ESIGI = 3;   // kaç doğru seride 1 joker
const DOGRU_PUAN = 10;
const YANLIS_CEZA = 5;
const GUC_DOGRU = 1;

export class Quiz {
  constructor(questions, field, callbacks) {
    this.questions = questions;
    this.field = field;        // AsteroidField
    this.cb = callbacks;       // { onUpdate, onQuestion, onBildirim, onFinish }
    this.i = -1;
    this.puan = 0;
    this.guc = 0;
    this.joker = 0;
    this.seri = 0;

    // asteroid vuruşunu dinle
    this.field.onHit = (index, grup) => this._vurus(index, grup);
  }

  basla() {
    this._sonraki();
  }

  _sonraki() {
    this.i++;
    if (this.i >= this.questions.length) {
      this.cb.onFinish(this._durum());
      return;
    }
    const q = this.questions[this.i];
    this.cb.onQuestion(q, this.i + 1, this.questions.length);
    this.field.spawn(q.secenekler);
  }

  _vurus(index, grup) {
    const q = this.questions[this.i];
    if (index === q.dogru) {
      // DOĞRU — patlat, ödüllendir
      this.field.patlat(grup);
      this.puan += DOGRU_PUAN;
      this.guc += GUC_DOGRU;
      this.seri++;

      let mesaj = `✅ Doğru! +${DOGRU_PUAN} puan`;
      if (this.seri > 0 && this.seri % SERI_JOKER_ESIGI === 0) {
        this.joker++;
        mesaj = `🔥 ${this.seri}'li seri! 🃏 +1 JOKER kazandın!`;
      }
      this.cb.onBildirim(mesaj, true);
      this.cb.onUpdate(this._durum());
      setTimeout(() => this._sonraki(), 1100);
    } else {
      // YANLIŞ — puan düşer, seri sıfırlanır
      this.field.yanlisVurus(grup);
      this.puan = Math.max(0, this.puan - YANLIS_CEZA);
      this.seri = 0;
      this.cb.onBildirim(`❌ Yanlış! -${YANLIS_CEZA} puan`, false);
      this.cb.onUpdate(this._durum());
    }
  }

  kullanJoker() {
    if (this.i < 0 || this.i >= this.questions.length || this.field.kilit) return;

    if (this.joker > 0) {
      this.joker--;
      sounds.playJoker();
      this._jokerIleCoz("🃏 Joker kullanıldı!");
    } else if (this.puan >= 30) {
      this.puan -= 30;
      sounds.playJoker();
      this._jokerIleCoz("✨ 30 Puan karşılığı Joker kullanıldı!");
    } else {
      this.cb.onBildirim("❌ Yetersiz Joker veya Puan (En az 30 puan gerekir)!", false);
    }
  }

  _jokerIleCoz(mesaj) {
    const q = this.questions[this.i];
    const grup = this.field.aktifler.find((g) => g.userData.index === q.dogru);
    if (grup) {
      this.field._lazerAt(grup.position);
      this.field.patlat(grup);
      this.puan += DOGRU_PUAN;
      this.guc += GUC_DOGRU;
      this.seri++;

      this.cb.onBildirim(mesaj + ` +${DOGRU_PUAN} puan`, true);
      this.cb.onUpdate(this._durum());
      setTimeout(() => this._sonraki(), 1100);
    }
  }

  _durum() {
    return { puan: this.puan, guc: this.guc, joker: this.joker, seri: this.seri };
  }
}
