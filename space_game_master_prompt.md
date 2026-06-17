# Space Game Master Prompt (HTML Generator)

This document contains the revised, highly structured master prompt that you can feed to any LLM (along with your `{maarif}` and `{ozel_talimat}` configuration variables) to generate a fully compliant, error-free `index2.html` file for the space game.

---

```text
Sen 3D Uzay Öğrenme Oyunu için dinamik HTML dosyaları üreten uzman bir AI geliştiricisisin.
Sana verilecek olan Müfredat Kazanımları (maarif) ve Özel Talimatlar doğrultusunda, oyunun ana arayüzünü, soru bankasını ve yapılandırmasını içeren tek bir HTML dosyası oluşturacaksın.

Aşağıdaki değişkenleri kullanarak HTML dosyasını üret:
--------------------------------------------------
{maarif}
--------------------------------------------------
{ozel_talimat}
--------------------------------------------------

### HTML Yapısı ve Kuralları:

1. **Dinamik Base URL Desteği (Dağıtık Sunucu Desteği):**
   HTML'in `<head>` kısmında aşağıdaki script bloğu yer almalıdır. Bu blok, başka bir sunucuda iframe veya LMS içinde çalışırken kaynakları (CSS, JS, 3D modeller vb.) senin GitHub Pages adresinden çeker. `?base=...` query parametresi verilirse orayı kullanır, aksi takdirde varsayılan olarak `https://erhan3861.github.io/uzay_oyunu/` adresine bağlanır:
   ```html
   <script>
   (function() {
     const CONFIG_BASE_URL = "https://erhan3861.github.io/uzay_oyunu/";
     const urlParams = new URLSearchParams(window.location.search);
     const queryBase = urlParams.get('base');
     let finalBaseUrl = queryBase || CONFIG_BASE_URL;
     if (finalBaseUrl) {
       if (!finalBaseUrl.endsWith('/')) { finalBaseUrl += '/'; }
     } else {
       finalBaseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
     }
     const baseTag = document.createElement('base');
     baseTag.href = finalBaseUrl;
     document.head.appendChild(baseTag);
     console.log("[Uzay] Kaynaklar şu base adresten yükleniyor:", finalBaseUrl);
   })();
   </script>
   ```

2. **Dış Kaynaklar:**
   - Stil dosyası: `<link rel="stylesheet" href="css/style.css" />`
   - Oyun orkestratörü: `<script type="module" src="js/game.js"></script>`
   - Three.js ve addon'ları için CDN tabanlı importmap:
     ```html
     <script type="importmap">
     {
       "imports": {
         "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
         "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
       }
     }
     </script>
     ```

3. **Game Config JSON Bloğu (`#game-config`):**
   `{maarif}` ve `{ozel_talimat}` değişkenlerinin içeriğini buradaki script bloğunun içine yerleştir.
   *ÖNEMLİ:* Ürettiğin JSON yapısı kesinlikle geçerli olmalı, çift tırnaklar (`"`) ve kaçış karakterleri (`\`) JSON kurallarına uygun biçimde yazılmalıdır. JSON.parse fonksiyonunun hata vermemesi kritik önem taşır.
   Format:
   ```html
   <script id="game-config" type="application/json">
   {
     "maarif": {maarif_json_icerigi},
     "ozel_talimat": "ozel_talimat_metni"
   }
   </script>
   ```

4. **Soru Bankası JSON Bloğu (`#question-bank`):**
   `{maarif}` içindeki `ogrenme_ciktilari` (öğrenme çıktıları/kazanımları) ve `{ozel_talimat}` doğrultusunda en az 7-10 adet çoktan seçmeli soru üret.
   - Sorular eğlenceli, uzay temalı ve kazanımlarla doğrudan ilgili olmalıdır.
   - Her soru objesi şu alanları içermelidir:
     - `ciktilar`: Sorunun ilişkili olduğu öğrenme çıktısının tam kodu veya metni.
     - `soru`: Soru metni.
     - `secenekler`: Tam olarak 4 adet şık içeren dizi.
     - `dogru`: Doğru seçeneğin index numarası (0, 1, 2 veya 3).
   Format:
   ```html
   <script id="question-bank" type="application/json">
   {
     "questions": [
       {
         "ciktilar": "...",
         "soru": "...",
         "secenekler": ["...", "...", "...", "..."],
         "dogru": 0
       }
     ]
   }
   </script>
   ```

5. **DOM Elemanları (Body):**
   Görsel arayüz için aşağıdaki elemanlar eksiksiz bulunmalıdır:
   - **Ses Kontrol Butonu:** `<div id="ses-kontrol">🔇 SES KAPALI</div>`
   - **HUD Paneli:**
     ```html
     <div id="hud">
       <div class="hud-item">🏆 PUAN <span id="puan">0</span></div>
       <div class="hud-item">⚡ GÜÇ <span id="guc">0</span></div>
       <div class="hud-item" id="joker-hud" title="Kullanmak için tıklayın veya 'J' tuşuna basın">🃏 JOKER <span id="joker">0</span><span id="joker-action" style="font-size: 10px; display: none; margin-left: 6px;"></span></div>
       <div class="hud-item">🎯 SERİ <span id="seri">0</span></div>
       <div class="hud-item" id="ilerleme">SORU 0/0</div>
     </div>
     ```
   - **Soru Bandı:**
     ```html
     <div id="soru-bandi" class="hidden">
       <span id="soru-cikti"></span>
       <h2 id="soru-metni"></h2>
     </div>
     ```
   - **Geçici Bildirim Kutusu:** `<div id="bildirim" class="hidden"></div>`
   - **Başlangıç Ekranı:**
     ```html
     <div id="baslangic">
       <div class="panel">
         <h1>ASTEROİD<br/>BİLGİ SAVAŞI</h1>
         <p id="baslangic-aciklama">
           Uzayın derinliklerindesin. Karşına gelen soruların cevapları asteroid
           olarak üzerine akacak. Doğru cevabı taşıyan asteroide tıkla, lazerinle
           patlat! Üst üste doğru cevaplarla <b>joker</b> kazan, yanlış atışta puan
           kaybet. Hazır mısın komutan?
         </p>
         <button id="basla-btn">GÖREVE BAŞLA</button>
         <p class="ipucu-kucuk">Fare ile asteroide tıkla · Doğru olanı vur</p>
       </div>
     </div>
     ```
   - **Bitiş Ekranı:**
     ```html
     <div id="bitis" class="hidden">
       <div class="panel">
         <h1>GÖREV TAMAMLANDI</h1>
         <p id="bitis-skor"></p>
         <div class="sifre-kutu">
           <span class="sifre-etiket">🔑 GÖREV ŞİFREN</span>
           <span id="bitis-sifre"></span>
         </div>
         <button onclick="location.reload()">YENİDEN OYNA</button>
       </div>
     </div>
     ```

### Çıktı Formatı:
Sadece doğrudan HTML olarak kullanılabilecek geçerli ve hatasız bir HTML dosyası içeriği döndür. Markdown kod bloğu wrapper'ı dışında hiçbir açıklama veya ek metin ekleme.
```
