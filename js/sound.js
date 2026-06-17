// sound.js — Web Audio API Ses Sentezleyici (Offline/CORS sorunu olmadan çalışır)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // Başlangıçta ses kapalı
    this.bgmInterval = null;
    this.bgmNodes = [];
  }

  _initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute(btnElement) {
    this.isMuted = !this.isMuted;
    this._initContext();
    
    if (btnElement) {
      if (this.isMuted) {
        btnElement.textContent = "🔇 SES KAPALI";
        btnElement.classList.remove("aktif");
        this.stopBGM();
      } else {
        btnElement.textContent = "🔊 SES AÇIK";
        btnElement.classList.add("aktif");
        this.startBGM();
      }
    }
    return this.isMuted;
  }

  startBGM() {
    if (this.isMuted) return;
    this._initContext();
    if (this.bgmInterval) return; // Zaten çalıyor

    this.bgmNodes = [];
    
    // Uzay temalı yumuşak akorlar (sine dalgalarıyla derin ambient ped)
    const chords = [
      [110.00, 164.81, 246.94, 392.00], // Am9
      [87.31, 130.81, 164.81, 440.00],  // Fmaj7
      [130.81, 196.00, 293.66, 493.88], // Cmaj9
      [98.00, 146.83, 196.00, 329.63]   // G6
    ];

    let chordIndex = 0;
    
    const playNextChord = () => {
      if (this.isMuted || !this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const duration = 6.0; // Her akor 6 saniye sürer
      
      const chord = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      const currentChordNodes = [];

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.value = freq;
        
        // Çok derinden gelen arka plan sesi seviyesi
        const maxGain = idx === 0 ? 0.025 : 0.012; 
        
        // Attack (Yumuşak Giriş) - 2 saniye
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(maxGain, now + 2.0);
        
        // Sönümleme - akor bitimine doğru yavaşça azalır
        gain.gain.setValueAtTime(maxGain, now + duration - 2.5);
        gain.gain.linearRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + duration + 0.1);
        
        currentChordNodes.push(osc, gain);
        this.bgmNodes.push(osc);
      });
      
      setTimeout(() => {
        this.bgmNodes = this.bgmNodes.filter(node => currentChordNodes.indexOf(node) === -1);
      }, (duration + 1) * 1000);
    };

    playNextChord();
    this.bgmInterval = setInterval(playNextChord, 6000);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmNodes) {
      this.bgmNodes.forEach(node => {
        try {
          node.stop();
        } catch(e) {}
      });
      this.bgmNodes = [];
    }
  }

  // Lazer Atış Sesi (Yüksek frekanstan alçağa hızlı sweep)
  playLaser() {
    if (this.isMuted) return;
    this._initContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Doğru Cevap / Patlama Sesi (Tatlı bir majör akor ve hafif patlama uğultusu)
  playExplosion() {
    if (this.isMuted) return;
    this._initContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 1. Tatlı Akor (C Majör)
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((f, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + index * 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    });

    // 2. Patlama Uğultusu (Alçak frekanslı gürültü/titreşim)
    const oscLow = ctx.createOscillator();
    const gainLow = ctx.createGain();
    oscLow.type = "sawtooth";
    oscLow.frequency.setValueAtTime(120, now);
    oscLow.frequency.linearRampToValueAtTime(40, now + 0.35);

    gainLow.gain.setValueAtTime(0.12, now);
    gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);

    oscLow.connect(filter);
    filter.connect(gainLow);
    gainLow.connect(ctx.destination);

    oscLow.start(now);
    oscLow.stop(now + 0.4);
  }

  // Yanlış Cevap Sesi (Pes bir buzzer sesi)
  playWrong() {
    if (this.isMuted) return;
    this._initContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Joker Aktivasyon Sesi (Hızlı yükselen retro 8-bit tarzı arpej)
  playJoker() {
    if (this.isMuted) return;
    this._initContext();
    const ctx = this.ctx;
    let now = ctx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.06);

      gain.gain.setValueAtTime(0.1, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  }

  // Görev Tamamlandı Fanfarı (Triumphant chord progression)
  playFinish() {
    if (this.isMuted) return;
    this._initContext();
    const ctx = this.ctx;
    let now = ctx.currentTime;

    const chords = [
      [261.63, 329.63, 392.00], // C4, E4, G4
      [349.23, 440.00, 523.25], // F4, A4, C5
      [392.00, 493.88, 587.33], // G4, B4, D5
      [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    ];

    chords.forEach((chord, chordIdx) => {
      const timeOffset = chordIdx * 0.22;
      chord.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + timeOffset);

        gain.gain.setValueAtTime(0.06, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.45);
      });
    });
  }
}

export const sounds = new SoundManager();
