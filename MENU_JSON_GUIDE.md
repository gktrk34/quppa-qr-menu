# QUPPA menu.json Rehberi

Sürüm: 3.0.0

Bu aşamada menü verisi `menu.json` dosyasına ayrıldı.

## Mantık

- `app.js` hâlâ gömülü menüyü fallback olarak tutar.
- Sayfa açılınca `./menu.json?v=APP_VERSION` yüklenmeye çalışılır.
- `menu.json` başarılıysa menü bu dosyadan gelir.
- `menu.json` yoksa, bozuksa veya local `file://` testinde yüklenemezse gömülü menüyle devam edilir.

## Ürün/fiyat güncelleme

1. `menu.json` içinde ürün fiyatını veya metnini değiştir.
2. `npm run release:patch` çalıştır.
3. `dist/` klasörünü yayınla.
4. Müşteri QR linkini test et: `?mode=live&panel=off`

## Dikkat

`menu.json` JSON formatında olmalı. Son virgül, yorum satırı veya tek tırnak kullanma.

## Avantaj

Yeni işletmeye uyarlarken çoğu ürün/fiyat değişikliği artık `app.js` açmadan yapılabilir.
