# 🚀 Asteroid Bilgi Savaşı — 3D Uzay Öğrenme Oyunu

Three.js tabanlı uzay temalı eğitici oyun. Sorular ekranın üstünde belirir,
4 şık birer **asteroid** olarak karşıdan üzerine akar. Doğru cevabı taşıyan
asteroide tıklayınca lazerle patlar, puan ve güç kazanırsın. Üst üste doğru
cevaplarla **joker** kazanırsın; yanlış atışta puan düşer.

Konu `{maarif}` öğrenme çıktıları ve `{ozel_talimat}` girdisine göre şekillenir.

## Oynanış
- Karşıdan akan 4 asteroidden **doğru cevabı** taşıyana fareyle tıkla.
- Doğru → asteroid patlar, +10 puan, +1 güç.
- **3'lü doğru seri** → +1 joker.
- Yanlış → asteroid kırmızı yanar, -5 puan, seri sıfırlanır.
- Tüm sorular bitince **görev şifresi** ekrana gelir.

## Mimari
`index2.html` **temiz** kalır: base enjeksiyonu (dağıtık sunucu), gömülü
`#game-config` + `#question-bank`, Three.js importmap. Ağır mantık modüllerde:

```
uzay/
├── index2.html         # temiz: base + config/soru JSON + importmap
├── css/style.css       # uzay teması (Orbitron/Rajdhani, HUD, paneller)
├── js/
│   ├── engine.js       # sahne, yıldız alanı, nebula, raycaster, döngü
│   ├── asteroids.js    # şık→asteroid, akış, tıklama, patlama, lazer
│   ├── quiz.js         # soru akışı, puan/güç/joker/seri mantığı
│   └── game.js         # orkestratör (config okur, bağlar, HUD+şifre)
└── assets/models/      # opsiyonel ağır .glb (gemi/asteroid)
```

## Çalıştırma
ES modülleri nedeniyle yerel sunucu gerekir:
```bash
python3 -m http.server 8000   # http://localhost:8000/index2.html
```

## Dağıtık Sunucu (başka sitede çalıştırma)
`index2.html`'i istediğin sunucuya koy; css/js/model dosyaları GitHub'dan
yüklenir. URL'ye `?base=https://kullanici.github.io/depo/` ekle ya da
`index2.html` içindeki `CONFIG_BASE_URL`'i ayarla.

## Değişken Entegrasyonu
Build/export adımında `#game-config` ve `#question-bank` bloklarını formdan/
üretimden doldur. Soru bankası bu oyunda **istasyonsuz akış** olduğu için
`station_id` içermez — sadece `ciktilar`, `soru`, `secenekler`, `dogru`.
