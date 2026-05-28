# QUPPA Görsel Yerelleştirme Rehberi

Sürüm: 3.2.0

Bu aşama dış görsel bağımlılığını azaltmak için yerel asset altyapısını hazırlar.

## Neden?

Unsplash/hotlink görseller:
- yavaşlayabilir,
- değişebilir,
- rate-limit yiyebilir,
- offline/PWA garantisini zayıflatır,
- premium müşteri tesliminde kontrolsüz görünür.

## Geçiş stratejisi

Bu sürümde mevcut görseller bozulmasın diye sistem varsayılan olarak remote `image` alanını kullanır.

`menu.json` içinde her ürüne `localImage` alanı eklendi.

Örnek:

```json
"image": "https://images.unsplash.com/...",
"localImage": "coffee/espresso-tonic.webp"
```

Local görseller hazır olduğunda `brand.json` içinde şu ayarı aç:

```json
"preferLocalImages": true,
"imageBasePath": "./assets/products/"
```

## Test

1. Görselleri ilgili klasörlere koy.
2. `brand.json` içinde `preferLocalImages: true` yap.
3. Local server aç:
   `python -m http.server 8080`
4. Test et:
   `http://localhost:8080/index.html?mode=demo`
5. Network sekmesinde görsellerin `assets/products/...` üzerinden geldiğini doğrula.

## Tavsiye

İlk müşteri demosunda remote görseller kalabilir. Gerçek müşteri tesliminde self-host WebP görseller kullanılmalı.
