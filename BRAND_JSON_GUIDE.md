# QUPPA brand.json Rehberi

Sürüm: 3.1.0

Bu aşamada işletme/marka ayarları `brand.json` dosyasına ayrıldı.

## Mantık

- `app.js` hâlâ gömülü `BRAND_CONFIG` ve `APP_CONFIG` fallback değerlerini tutar.
- Sayfa açılınca `./brand.json?v=APP_VERSION` yüklenmeye çalışılır.
- `brand.json` başarılıysa marka ve uygulama ayarları bu dosyadan merge edilir.
- `brand.json` yoksa, bozuksa veya local `file://` testinde yüklenemezse gömülü ayarlarla devam edilir.

## Dosya yapısı

```json
{
  "brand": {
    "name": "QUPPA",
    "shortName": "QUPPA",
    "logoLetter": "Q",
    "slogan": {
      "tr": "Butik kahve & bar deneyimi",
      "en": "Boutique coffee & bar experience"
    },
    "menuLabel": {
      "tr": "QR Menü",
      "en": "QR Menu"
    },
    "wifiName": "QUPPA Guest",
    "wifiPassword": "quppa2025",
    "instagram": "@quppa",
    "defaultTheme": "espresso"
  },
  "app": {
    "mode": "demo",
    "liveTheme": "espresso",
    "liveLocksTheme": true,
    "showThemeSwitcher": true,
    "showDemoBadge": true,
    "showFeatured": true,
    "showTodaySuggestion": true,
    "enableFavorites": true,
    "enableSmartUpsell": true,
    "enablePwa": true
  }
}
```

## Yeni işletmeye uyarlama

Genellikle iki dosya değişir:

- `brand.json`
- `menu.json`

`app.js` motor dosyası olarak aynı kalır.

## Dikkat

- `brand.json` geçerli JSON olmalı.
- App ayarlarında sadece `APP_CONFIG` içinde tanımlı anahtarlar kabul edilir.
- Tema adı final 6 tema id'lerinden biri olmalı:
  - `light`
  - `espresso`
  - `noir-jazz`
  - `velvet-patisserie`
  - `aegean-taverna`
  - `cyber-luxe`
