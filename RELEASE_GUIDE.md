# QUPPA Release Toolkit

Sürüm: 2.9.0

Bu aşama, fiyat veya ürün değişikliğinden sonra eski menünün cihazlarda kalmasına yol açan **manuel versiyon bump** riskini azaltmak için eklendi.

## Komutlar

Syntax kontrolü:

```bash
npm run check
```

Patch sürüm artırma:

```bash
npm run release:patch
```

Minor sürüm artırma:

```bash
npm run release:minor
```

Belirli sürüm verme:

```bash
npm run release -- --version 2.9.1
```

## Ne yapar?

`tools/release.mjs` şunları birlikte günceller:

- `app.js` içindeki `APP_VERSION`
- `style.css` sürüm yorumu
- `sw.js` sürümü ve cache asset yolları
- `index.html` içindeki `style.css?v=...`
- `index.html` içindeki `app.js?v=...`
- `README_DEPLOY.md` / `PUBLISH_CHECKLIST.md` sürüm notları

Sonra:

- `node --check app.js`
- `node --check sw.js`

çalıştırır ve `dist/` klasörüne yayınlanacak dosyaları kopyalar.

## GitHub Pages için

`dist/` içindeki dosyaları repository root'a koyabilir veya GitHub Actions ile `dist` klasörünü yayınlayabilirsin.

Şimdilik build/minify yok. Bu bilerek böyle bırakıldı: çalışan sistemi bozmadan sadece cache-busting otomasyonu eklendi.
