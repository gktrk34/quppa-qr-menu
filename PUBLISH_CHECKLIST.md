# QUPPA QR Menu — Yayın Hazırlık Kontrol Listesi

Sürüm: 3.8.3

## Önerilen linkler

Sunum / işletme demo linki:

```text
index.html?mode=demo
```

Canlı önizleme linki:

```text
index.html?mode=live
```

Müşteri QR kod linki:

```text
index.html?mode=live&panel=off
```

Alternatif müşteri linki:

```text
index.html?mode=live&ui=customer
```

## Test sırası

1. Chrome desktop: demo linki açılır.
2. Chrome desktop: live linki açılır, tema seçici görünmez.
3. Chrome desktop: müşteri linki açılır, demo/live paneli de görünmez.
4. Android Chrome: QR linki test edilir.
5. iPhone Safari: QR linki test edilir.
6. Instagram içi tarayıcı: localStorage engellenirse menü çökmemeli.
7. WhatsApp içi tarayıcı: sepet ve garsona göster çalışmalı.
8. Çok ürünlü sepet: garsona göster en baştan başlamalı.
9. Offline test: GitHub Pages üzerinde bir kere açıldıktan sonra yeniden yükleme denenmeli.
10. Fiyat güncellemesi sonrası `APP_VERSION` ve `?v=` değerleri artırılmalı.

## Console uyarıları

Yerel dosya olarak açarken şu uyarı normaldir:

```text
Service Worker file:// üzerinde çalışmaz
```

PWA testini dosyaya çift tıklayarak değil, local server veya GitHub Pages üzerinde yap.

## Low-risk polish kontrolü

- [ ] WhatsApp/Telegram link önizlemesi başlık ve açıklama gösteriyor mu?
- [ ] Ürün görselleri yüklenirken kartlarda belirgin layout kayması yok mu?
- [ ] Arapça modda font daha okunaklı mı?
- [ ] `prefers-reduced-motion` açık cihazlarda animasyonlar rahatsız etmiyor mu?
- [ ] Open Graph / JSON-LD canlı URL üzerinde görünüyor mu?

## Release toolkit kontrolü

- [ ] Fiyat/ürün değişikliğinden sonra `npm run release:patch` çalıştırıldı mı?
- [ ] `dist/` klasörü güncellendi mi?
- [ ] GitHub Pages'e çıkan dosyalar `dist/` ile aynı mı?
- [ ] Canlı linkte `app.js?v=` ve `style.css?v=` yeni sürümü gösteriyor mu?

## menu.json kontrolü

- [ ] `menu.json` geçerli JSON mu?
- [ ] Fiyat değişikliğinden sonra `npm run release:patch` çalıştırıldı mı?
- [ ] GitHub Pages üzerinde `menu.json` 200 dönüyor mu?
- [ ] Network kapatılınca gömülü/cache fallback ile menü açılıyor mu?

## brand.json kontrolü

- [ ] `brand.json` geçerli JSON mu?
- [ ] İşletme adı, logo harfi, slogan, Wi-Fi ve Instagram doğru mu?
- [ ] `liveTheme` final 6 tema id'sinden biri mi?
- [ ] `?mode=live&panel=off` müşteri linkinde tema seçici ve demo paneli gizli mi?
- [ ] GitHub Pages üzerinde `brand.json` 200 dönüyor mu?

## Yerel görsel kontrolü

- [ ] `assets/products/...` klasörlerine WebP görseller eklendi mi?
- [ ] `brand.json` içinde `preferLocalImages` doğru ayarda mı?
- [ ] Network sekmesinde görseller local asset path'ten geliyor mu?
- [ ] Görseller 900x600 veya 1200x800 oranında mı?
- [ ] Görsel başına dosya boyutu makul mü? Hedef: 80-180 KB.

## Admin editor kontrolü

- [ ] `admin.html` açılıyor mu?
- [ ] Mevcut `menu.json` yükleniyor mu?
- [ ] Ürün fiyatı değiştirip local preview'da görülebiliyor mu?
- [ ] `menu.json indir` çıktısı geçerli JSON mu?

## Admin Studio kontrolü

- [ ] `admin.html` premium arayüzle açılıyor mu?
- [ ] `index.html?mode=demo&admin=show` Admin Studio kısayolunu gösteriyor mu?
- [ ] Hazır tag/ikon butonları çalışıyor mu?
- [ ] Mobil önizleme local menüyü açıyor mu?

## Premium Admin UX Final kontrolü

- [ ] İkon seçince kartta emoji/ikon önizlemesi oluşuyor mu?
- [ ] Tag seçince kartta tag chipleri görünür mü?
- [ ] Preset seçince rozet + tag + ikonlar birlikte uygulanıyor mu?
- [ ] Kart kalite skoru doğru artıp azalıyor mu?
- [ ] Düzenlenen alan kartta glow efektiyle vurgulanıyor mu?

## Admin görsel seçim polish kontrolü

- [ ] Rozetlerin simgeleri birbirinden farklı mı?
- [ ] Tagler ikonlu/açıklamalı seçim kartı olarak görünüyor mu?
- [ ] Kaydet butonu taslağı localStorage'a yazıyor mu?

## Final Admin Studio kontrolü

- [ ] Ürün kartına tıklayınca sağ düzenleme paneli açılıyor mu?
- [ ] Kaydet butonu değişiklik özeti modalı açıyor mu?
- [ ] Modalda eski/yeni alanlar görünüyor mu?
- [ ] Modalda ürün kartı önizlemesi görünüyor mu?
- [ ] Onayla ve kaydet sonrası Değişiklikler paneline log düşüyor mu?
- [ ] Geri al butonu değişiklikleri son onaylı hale döndürüyor mu?
- [ ] Ürün ekleme modalında kategori/şablon/özet doğru mu?
- [ ] Görsel yoksa kırık ikon yerine placeholder görünüyor mu?
- [ ] Önizle modu local taslağı gösteriyor mu?
