# 🌙 GSC & GA Dark Mode

Google Search Console, Google Analytics, AdSense, Blogger ve Google Maps için — ve
**istediğiniz herhangi bir site** için — hafif, bağımlılıksız bir karanlık mod Chrome eklentisi (Manifest V3).

![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Bağımlılık yok](https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-yok-success)
![Sürüm](https://img.shields.io/badge/s%C3%BCr%C3%BCm-1.4.0-blue)

---

## ✨ Özellikler

| | |
|---|---|
| ⚡ **Beyaz parlama yok** | CSS `document_start` anında uygulanır; sayfa açılırken ekran bir an bile beyaz yanmaz. |
| 🎨 **Renkler korunur** | `invert + hue-rotate(180deg)` sayesinde grafik ve marka renklerinin tonları bozulmaz. |
| 🖼️ **Medya doğal renkte** | Görseller, videolar, avatarlar ve logolar tekrar çevrilir, orijinal halleriyle görünür. |
| 🧩 **Akıllı iframe desteği** | Açık zeminli iframe'ler kararır; zaten koyu olanlar (Google hesap menüsü) ve haritalar olduğu gibi kalır. |
| ➕ **Özel siteler** | Açılır pencereden istediğiniz siteyi ekleyin; izin sadece o site için istenir. |
| 🎚️ **İnce ayar** | Koyuluk, kontrast ve parlaklık kaydırıcıları — canlı önizlemeli. |
| 🔀 **Site bazında kontrol** | Her siteyi ayrı ayrı açıp kapatın. |
| ⌨️ **Kısayol** | `Alt+Shift+D` ile genel aç/kapat. |

### Hazır desteklenen siteler

| Site | Adres |
|---|---|
| Google Search Console | `search.google.com` |
| Google Analytics | `analytics.google.com` |
| Google AdSense | `adsense.google.com` |
| Blogger | `www.blogger.com` |
| Google Maps | `www.google.com/maps` — menüler kararır, harita doğal renkte kalır |

---

## 📦 Kurulum

1. Depoyu indirin:
   ```bash
   git clone https://github.com/yusuf-polat/gsc-ga-dark-mode.git
   ```
   ya da **Code → Download ZIP** ile indirip bir klasöre çıkarın.
2. Chrome'da `chrome://extensions` adresini açın.
3. Sağ üstten **Geliştirici modu**nu açın.
4. **Paketlenmemiş öğe yükle** → indirdiğiniz klasörü seçin.

> Chromium tabanlı diğer tarayıcılarda da (Edge, Brave, Opera) aynı şekilde çalışır.

### Güncelleme
`git pull` yaptıktan sonra `chrome://extensions` sayfasında eklentinin ⟳ (yeniden yükle) düğmesine basın.

---

## 🚀 Kullanım

Araç çubuğundaki eklenti simgesine tıklayın:

- **Karanlık mod** — tüm siteler için ana anahtar.
- **Site anahtarları** — her siteyi ayrı ayrı açıp kapatın.
- **Özel siteler**
  - Açık sekme desteklenmeyen bir siteyse **“+ ornek.com sitesini ekle”** düğmesi çıkar.
  - Ya da alan adını (`ornek.com` veya tam URL) kutuya yazıp **Ekle**'ye basın.
  - Chrome yalnızca o site için erişim izni ister. Site **×** ile kaldırıldığında izin de geri alınır.
- **Koyuluk / Kontrast / Parlaklık** — kaydırdıkça sayfa anında güncellenir.
- **Varsayılanlara dön** — görünüm ayarlarını sıfırlar, eklediğiniz siteler korunur.

Kısayolu `chrome://extensions/shortcuts` adresinden değiştirebilirsiniz.

---

## 🔒 İzinler

| İzin | Neden |
|---|---|
| `storage` | Ayarları (açık/kapalı, kaydırıcılar, özel siteler) saklamak için. |
| `scripting` | Eklediğiniz siteler için karanlık mod script'lerini dinamik olarak kaydetmek için. |
| `activeTab` | Açılır pencerede “bu siteyi ekle” düğmesi için açık sekmenin adresini okumak için. |
| Site erişimi (isteğe bağlı) | Kurulumda **istenmez**; yalnızca siz bir site eklediğinizde, sadece o site için sorulur. |

Eklenti hiçbir veri toplamaz ve dışarıya hiçbir istek göndermez.

---

## 🛠️ Nasıl çalışır

```
┌──────────── Üst sayfa (content.js + dark.css) ────────────┐
│  <html> → invert(0.92) hue-rotate(180deg)                 │
│     ├─ img / video / background-image → tekrar çevrilir   │
│     └─ iframe → tekrar çevrilir (doğal renk)              │
│          └─ frame.js iframe içinde karar verir:           │
│               • zemin açık  → kendini karartır            │
│               • zemin koyu  → dokunmaz                    │
│               • harita      → dokunmaz                    │
└───────────────────────────────────────────────────────────┘
```

- **Filtre tabanlı yaklaşım:** Google'ın Angular/Material arayüzlerinde sınıf adları sık değişir.
  Tek tek renk ezmek yerine tüm sayfa ters çevrilir; bu yüzden arayüz güncellemelerinden etkilenmez.
- **Varsayılan açık:** `dark.css`, ayarlar okunmadan önce de etkindir (`data-gdm="off"` değilse).
  Böylece yükleme sırasında beyaz ekran görünmez.
- **Kendini onarma:** `MutationObserver`, uygulama `<html>` özniteliklerini veya stil etiketini silerse geri ekler.
- **Özel siteler:** `background.js`, eklenen siteler için `chrome.scripting.registerContentScripts`
  ile aynı script'leri kaydeder. Liste veya izinler değişince kayıtlar yeniden senkronize edilir.

### Dosya yapısı

```
├── manifest.json   # Eklenti tanımı, izinler, sabit content script'ler
├── background.js   # Kısayol + özel sitelerin dinamik kaydı
├── defaults.js     # Ortak varsayılan ayarlar
├── content.js      # Üst sayfada ayarları uygular
├── frame.js        # iframe'lerin içinde karartma kararı
├── dark.css        # Filtre kuralları
├── popup.html/js   # Ayarlar penceresi
└── icons/          # Eklenti simgeleri
```

---

## ⚠️ Bilinen sınırlamalar

- Özel sitelerde, **başka alan adlarından** gelen iframe'ler (ör. YouTube gömmeleri) karartılmaz.
- Filtre yaklaşımı bazı sitelerde, arka plan görseli olan alanları beklenmedik tonlarda gösterebilir.
- Windows'ta izin penceresi açıldığında eklenti penceresi kapanabilir; site yine de eklenir,
  sadece sayfayı elle yenilemeniz gerekebilir.

---

## 🤝 Katkı

Hata bildirimleri ve öneriler için [Issues](https://github.com/yusuf-polat/gsc-ga-dark-mode/issues)
sekmesini kullanabilirsiniz. Bir sitede görünüm bozuksa, sorunun ekran görüntüsünü ve sayfa adresini eklemeniz yeterli.
