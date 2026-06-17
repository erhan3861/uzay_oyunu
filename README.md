# 3D Bilgi İstasyonları — Öğrenme Oyunu

Three.js tabanlı, istasyonlara gidip soru cevaplayarak **güç** ve **joker**
kazanılan 3D eğitici oyun. `maarif` öğrenme çıktıları ve `ozel_talimat`
girdisine göre konusu şekillenir.

## Mimari Felsefesi

`index.html` **saf ve temiz** kalır. İçinde yalnızca:
1. Dinamik değişkenler (`#game-config` — formdan gelmiş gibi)
2. Gömülü statik soru bankası (`#question-bank`)
3. CDN import map (ağır Three.js kütüphanesi)

Tüm ağır mantık ayrı modüllerde, ağır 3D modeller `assets/`'te.

```
oyun/
├── index.html          # temiz giriş + değişkenler + gömülü JSON
├── css/style.css       # HUD, quiz, kazanma ekranı
├── js/
│   ├── engine.js       # Three.js sahne/kamera/ışık/render
│   ├── world.js        # zemin + istasyonlar + GLB yükleyici
│   ├── player.js       # WASD + kamera + yakınlık algılama
│   ├── quiz.js         # soru/cevap + güç/joker ödülü
│   └── game.js         # orkestratör (config okur, bağlar)
└── assets/models/      # ağır .glb modeller (opsiyonel)
```

## Çalıştırma

ES modülleri nedeniyle yerel sunucu gerekir:

```bash
python3 -m http.server 8000
# tarayıcı: http://localhost:8000
```

## GitHub Pages'e Yükleme

Depoya it, **Settings → Pages → Source: main /(root)** seç.
Three.js zaten CDN'den geldiği için depo şişmez; yalnızca
kendi `.glb` modellerin yer kaplar.

## Değişken Entegrasyonu (form bağlanınca)

Build/export adımında `#game-config` içeriğini formdan dolduracaksın:

```js
const config = { maarif: {...}, ozel_talimat: "..." };
htmlTemplate.replace("__CONFIG__", JSON.stringify(config));
```

Aynı şekilde `#question-bank`, çıktılara göre üretilen sorularla doldurulur.
Her sorudaki `station_id` bir istasyona, `odul` ("guc"/"joker") ödüle eşlenir.

## Ağır 3D Model Ekleme

`game.js` sonundaki satırı aç:

```js
world.loadStationModel("ist_1", "assets/models/portal.glb");
```

Model yüklenemezse prosedürel (sütun+halka) istasyon fallback olarak çalışır.

## Dağıtık Sunucu & `index2.html` Yapılandırması

Eğer `index2.html` dosyasını kendi bağımsız sunucunuzda (örn. başka bir web sitesinde veya yerel sunucunuzda) barındırmak ve geri kalan tüm dosya ve klasörleri (`css/`, `js/`, `assets/` vb.) GitHub üzerinde tutmak istiyorsanız, **`index2.html`** bu mimariye özel olarak tasarlanmıştır.

### Nasıl Çalışır?

`index2.html`, sayfa yüklenirken dinamik olarak bir `<base>` HTML etiketi oluşturur ve head içerisine enjekte eder. Tarayıcı, bu sayede sayfa içerisindeki tüm göreli (relative) bağlantıları (`css/style.css`, `js/game.js`, resimler, 3D modeller vb.) sizin belirteceğiniz GitHub deponuzun base adresi üzerinden çeker. GitHub Pages veya jsDelivr CDN varsayılan olarak **CORS (Cross-Origin Resource Sharing)** izinlerine sahip olduğu için (`Access-Control-Allow-Origin: *`), tarayıcı güvenliği bu kaynakların başka bir sunucuda çalıştırılmasına engel olmaz.

### Kurulum ve Yapılandırma Adımları

#### 1. Adım: Tüm Dosyaları GitHub'a Yükleyin
`index2.html` de dahil olmak üzere (veya hariç) projedeki tüm dosyalarınızı GitHub deponuza yükleyin.

#### 2. Adım: Kaynak URL'nizi Belirleyin (İki Yöntem)

*   **A Yöntemi: GitHub Pages (Önerilen)**
    *   GitHub deponuzda **Settings → Pages** sekmesine gidin.
    *   **Build and deployment** kısmında kaynak (Source) olarak **Deploy from a branch** seçin.
    *   Dalı (Branch) `main` veya `master` yapıp klasörü `/ (root)` olarak belirleyin ve **Save** butonuna tıklayın.
    *   Birkaç dakika içinde size verilen yayın adresi (örn. `https://kullaniciadi.github.io/depo-adi/`) sizin **Base URL** adresiniz olacaktır.
*   **B Yöntemi: jsDelivr CDN (Kurulumsuz & Anında)**
    *   Eğer GitHub Pages ayarları ile uğraşmak istemiyorsanız, doğrudan jsDelivr CDN adresini kullanabilirsiniz.
    *   Base URL formatınız şu şekilde olacaktır: `https://cdn.jsdelivr.net/gh/kullaniciadi/depo-adi@main/` (Burada `kullaniciadi` ve `depo-adi` kısımlarını kendi deponuza göre güncelleyin. `@main` kısmı hangi daldan (branch) dosyaların çekileceğini belirtir).

#### 3. Adım: `index2.html` Dosyasını Başka Sunucuya Yükleme ve Bağlama

`index2.html` dosyasını kendi sunucunuza yükledikten sonra, kaynakların GitHub'dan yüklenmesini sağlamak için şu iki yöntemden birini kullanabilirsiniz:

*   **Yöntem 1: Query Parametresi ile Dinamik Bağlantı (En Esnek Yöntem)**
    *   Sunucunuzdaki `index2.html` sayfasına erişirken sonuna sorgu parametresi olarak `?base=GITHUB_PAGES_VEYA_CDN_LINKI` ekleyebilirsiniz.
    *   *Örnek:* `https://siteniz.com/index2.html?base=https://kullaniciadi.github.io/depo-adi/`
    *   *Örnek 2 (CDN ile):* `https://siteniz.com/index2.html?base=https://cdn.jsdelivr.net/gh/kullaniciadi/depo-adi@main/`
    *   Bu yöntem sayesinde dosyanın içeriğini hiç değiştirmeden istediğiniz adrese bağlayabilirsiniz.

*   **Yöntem 2: Dosya İçi Statik Ayar (Kolay ve Kalıcı)**
    *   Kendi sunucunuza yüklediğiniz `index2.html` dosyasını bir metin editörüyle açın.
    *   En üstteki `<script>` bloğunun içindeki `CONFIG_BASE_URL` değerini kendi base adresinizle güncelleyin.
    *   *Örnek:*
        ```javascript
        const CONFIG_BASE_URL = "https://kullaniciadi.github.io/depo-adi/";
        ```
    *   Kaydedip sunucunuza yükleyin. Artık `index2.html` sayfasına normal olarak (`https://siteniz.com/index2.html`) girildiğinde tüm kaynaklar otomatik olarak GitHub'dan çekilecektir.

