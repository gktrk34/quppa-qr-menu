# QUPPA QR Menu — Yayına Hazır Paket

Sürüm: 3.8.3

## Dosyalar

- `index.html` — HTML iskeleti, meta etiketleri ve bağlantılar
- `style.css` — tüm tasarım, responsive yapı, tema sistemi
- `app.js` — menü verisi, sepet, favoriler, demo/live mod, upsell ve PWA register
- `sw.js` — offline cache ve runtime image cache

## Test linkleri

Yerelde veya GitHub Pages üzerinde:

- Demo: `index.html?mode=demo`
- Canlı: `index.html?mode=live`

Demo mod işletme sahibine sunum içindir. Live mod gerçek müşteri kullanımı içindir.

## GitHub Pages yayın adımları

1. GitHub üzerinde yeni repository oluştur.
2. Bu klasördeki dosyaları repository kök dizinine yükle.
3. Repository Settings → Pages bölümüne gir.
4. Source olarak `main` branch ve `/root` seç.
5. Yayın linki oluştuktan sonra QR kodu bu linke bağla.
6. İşletme için gerçek kullanımda `?mode=live` linkini kullan.

Örnek:

```text
https://kullaniciadi.github.io/quppa-qr-menu/?mode=live
```

## Her güncellemede unutma

- `APP_VERSION` değişmeli.
- `index.html` içindeki `style.css?v=...` ve `app.js?v=...` değişmeli.
- `sw.js` içindeki `APP_VERSION` değişmeli.
- Yeni sürümden sonra test cihazında bir kez sayfayı yenile.

## Geliştirici test komutları

Local server önerilir:

```bash
python -m http.server 5500
```

Sonra:

```text
http://localhost:5500/index.html?mode=demo
http://localhost:5500/index.html?mode=live
```

## Cache temizleme

Demo modda console üzerinden:

```js
QUPPA_DEBUG.resetCache()
```

Sonra sayfayı yenile.

## Mobil test listesi

- iPhone Safari
- Android Chrome
- Instagram iç tarayıcı
- WhatsApp iç tarayıcı
- Edge / Chrome desktop
- Offline açılış testi
- QR okutma testi
- Sepete ekleme
- Garsona göster listesi
- Kahve ekleyince upsell kartı
- Tema ve dil değişimi
- Live modda tema seçicinin gizlenmesi


## Önemli Service Worker Notu

Service Worker `file://` üzerinden çalışmaz. Bu normaldir. PWA/offline testleri için dosyayı çift tıklayarak açmak yerine local server veya GitHub Pages kullan:

```bash
python -m http.server 5500
```

Sonra:

```text
http://localhost:5500/index.html?mode=demo
```

## Garsona göster modu

Sipariş özeti iki modludur: düzenleme modu ve garsona göster modu. Garsona göster modunda ürün satırı fiyatları, artı/eksi/sil kontrolleri ve tekrar eden bilgiler gizlenir; sadece kategori, ürün adı, adet ve en altta toplam görünür.

## Sipariş özeti modu

Sipariş özeti footerındaki ana buton artık kopyalama yapmaz. Düzenleme modu ile garsona göster modu arasında geçiş yapar. Kopyalama özelliği bilerek pasifleştirildi; operasyon odağı garsona okunabilir liste göstermektir.

## Premium Konsept Temalar

Bu sürümde klasik 6 temaya ek olarak 6 premium konsept tema eklendi: Kyoto Matcha, Riviera Aperitivo, Noir Jazz Club, Bauhaus Pop, Velvet Patisserie ve Cyber Luxe. Demo modda tema menüsü Klasik Temalar ve Premium Konseptler olarak gruplanır.

## Hotfix 2.0.1

Premium tema menüsünde eksik `swatch()` fonksiyonu yüzünden renderAll akışı kırılıp menünün görünmemesi düzeltildi. Klasik Cyberpunk tema ID'si mevcut CSS ile uyumlu olacak şekilde `cyber` olarak korundu.

## Theme Studio

Tema seçimi artık düz dropdown değil, işletme sahibine sunum yapılabilecek kart tabanlı Theme Studio deneyimi olarak çalışır. Bu sürümde ayrıca Aegean Taverna ve Latin Cantina konseptleri eklendi.

## Hotfix 2.1.3

Theme Studio paneli header içinden çıkarılıp body seviyesinde global overlay/sheet olarak çalışacak hale getirildi. Mobilde sipariş özeti mantığına benzer şekilde alttan açılır.

## Version 2.3.0

Ana sayfa kompakt dijital vitrin mantığına çekildi. Açık/koyu temalar için surface token sistemi eklendi; ürün kartları daha hızlı taranabilir hale getirildi; hero, öneri, vitrin ve sticky alanlar mobilde daha verimli çalışacak şekilde sıkılaştırıldı.

## Version 2.3.1

Dil/tema butonları yanındaki dekoratif pseudo-dot kaldırıldı ve kontrastlı affordance eklendi. Ürün detay, sipariş sheet, dil modalı ve Theme Studio açıldığında arka sayfanın kayması engellendi.

## Version 2.3.2

close() helper'ına unlockPageScroll eklendi ve iOS için açık modal dışındaki touchmove engellendi.

## Version 2.4.0

Sepete ekleme, adet değiştirme, ürün silme ve favori işlemlerinde tam renderAll yerine partial render akışı eklendi. Ürün görsellerinin ve tüm menünün her tıklamada yeniden çizilmesi azaltıldı.

## Version 2.4.1

Öne çıkanlar kartlarının üst üste binmesi düzeltildi. 900px üzeri ekranlarda ürün ekleme ve detay modal aç/kapat işlemlerinde sayfanın başa dönmesi engellendi.

## Version 2.4.2

Öne çıkanlar kartları premium vitrin mantığıyla yeniden tasarlandı. Görsel üst alan, kategori/badge pill'leri, daha rafine tipografi ve yeniden kurgulanmış fiyat/aksiyon yerleşimi eklendi.

## Version 2.5.0

Tema seti final 6 temaya indirildi: Modern Light, Espresso, Noir Jazz Club, Velvet Patisserie, Aegean Taverna, Cyber Luxe. Demo modda küçük Demo Mode rozeti ve Live Preview bağlantısı eklendi. Eski tema seçimleri final temalara otomatik map edilir.

## Version 2.6.0

Final 6 tema için kontrast refactor yapıldı. Üst bar, ürün kartları, öne çıkan kartları, Theme Studio, sipariş özeti, modal/sheet yüzeyleri ve kontrol butonları ortak semantic surface token sistemiyle güçlendirildi.

## Version 2.6.1

Mode badge, çift yönlü demo/live geçiş yapan hizalı bir gösterge paneline dönüştürüldü. Demo modda LIVE, live modda DEMO hedefi gösterilir; üst barda daha dengeli yerleşir.

## Version 2.6.2

Header'daki mode dashboard fazla büyük göründüğü için kompakt profesyonel pill tasarımına çekildi. Büyük ikon/ellipse etkisi kaldırıldı.

## Version 2.6.3

Live modda tema seçici tamamen gizlendi; boş/minik tema paneli kalması engellendi. Sipariş özeti sheet yapısı grid tabanlı iç scroll ile güçlendirildi, yüksek çözünürlüklerde sheetBody scroll davranışı düzeltildi.

## Version 2.6.4

Garsona göster modunda kategori başlığı ile ilk ürün satırının çakışık görünmesi düzeltildi. Waiter view için kategori başlığı/ürün kartı spacing ve receipt hiyerarşisi güçlendirildi.

## Version 2.6.5

Garsona göster modunda kategori başlığı ile ilk ürün kartı arasındaki border çakışması giderildi. gbody üst padding/gap düzenlendi.

## Version 2.6.6

Sipariş özeti kategori içindeki ilk ürün kartı ile başlık arasında dengeli üst boşluk eklendi. Sepeti temizleyince öne çıkanlar kartlarındaki adet kontrolünün sıfırlanmaması düzeltildi.

## Version 2.6.7

Garsona göster modunda sadece ilk kategorinin ürünlerinin görünmesi düzeltildi. Waiter view artık tüm kategorileri açık render eder; kapalı grup sınıfı waiter modda ürünleri gizleyemez.

## Version 2.6.8

Çok ürünlü siparişlerde Garsona Göster moduna geçildiğinde sipariş özeti artık listenin sonunda kalmaz; sheet otomatik en başa alınır.

## Version 2.7.0

Live yayın hazırlığı yapıldı. `?mode=live&panel=off` müşteri QR linki olarak önerilir; bu modda tema seçici ve demo/live paneli görünmez. Manifest eklendi ve PUBLISH_CHECKLIST.md oluşturuldu.

## Version 2.7.1 (kararlılık & i18n düzeltmeleri)

Çalışan QR menü ve "Garsona Göster" akışlarına dokunulmadan yapılan cerrahi düzeltmeler:

- **Rebranding/config artık çalışıyor**: `applyBrandConfig()` init'te çağrılmıyordu; çağrı eklendi. Böylece `BRAND_CONFIG` (marka adı, logo, slogan, Wi-Fi, Instagram) düzenlemeleri DOM'a yansır, `showFeatured/showTodaySuggestion/enableFavorites` bayrakları etki eder ve live modda tema kilidi devreye girer.
- **Çift `normalizeSavedThemeId` temizlendi**: Hoisting nedeniyle eski/geçersiz (`neon→cyber`) sürüm çalışıyordu; final 6 temaya doğru map eden sağlam sürüm artık tek ve aktif. Eski sürümlerden kalan tema ID'leri demo modda artık güvenle final temalara düşer.
- **Öne çıkanlar açıklaması düzeldi**: `renderFeatured` yanlış alan adını (`p.description`) okuyordu; `p.desc`'e çevrildi. Vitrin kartlarında açıklama metni artık görünür.
- **Arapça i18n tamamlandı**: Favoriler, meta-rozet etiketleri (tatlı/soğuk/paylaşmalık vb.), kategori navigasyonu ve arama anahtarları AR'da eksikti ve Türkçe'ye düşüyordu; eklendi.
- **color-mix güvenlik ağı**: `@supports not (color-mix...)` ile eski webview'larda okunabilirlik token'ları düz tema renklerine düşer. Modern tarayıcılarda hiç uygulanmaz, mevcut kontrast sistemini ezmez.

Bu sürümde `APP_VERSION`, `style.css?v=`, `app.js?v=` ve `sw.js` cache adları birlikte 2.7.1'e yükseltildi.

## Version 2.8.0

Low-risk publish polish uygulandı: dinamik ürün görsellerine intrinsic width/height eklendi, Open Graph/Twitter meta ve Restaurant/Menu JSON-LD eklendi, Arapça/RTL font stack iyileştirildi, prefers-reduced-motion desteği güçlendirildi.

## Version 2.9.0

Release toolkit eklendi. `npm run check`, `npm run release:patch`, `npm run release -- --version x.y.z` komutlarıyla APP_VERSION, asset query parametreleri ve SW cache versiyonları birlikte güncellenir. `dist/` yayın klasörü oluşturulur.

## Version 3.0.0

`menu.json` ayrımı eklendi. Uygulama önce `./menu.json?v=APP_VERSION` yüklemeyi dener; JSON yoksa veya hatalıysa gömülü menü fallback olarak çalışmaya devam eder. Service Worker `menu.json` için network-first stratejisine alındı.

## Version 3.1.0

`brand.json` ayrımı eklendi. Uygulama önce `./brand.json?v=APP_VERSION` yüklemeyi dener; JSON yoksa veya hatalıysa gömülü marka/config değerleriyle devam eder. Service Worker `brand.json` için de network-first stratejisini kullanır.

## Version 3.2.0

Yerel ürün görsel altyapısı hazırlandı. `assets/products/` klasör yapısı, `localImage` alanları, `preferLocalImages` / `imageBasePath` config desteği ve görsel asset rehberi eklendi. Mevcut remote görseller varsayılan olarak korunur.

## Version 3.2.1

Service Worker `networkFirstMenuData()` cache.put parametre hatası düzeltildi. `menu.json` ve `brand.json` için fallback cache anahtarı artık doğru hesaplanır. `mobile-web-app-capable` meta etiketi eklendi.

## Version 3.2.2

Hafif ilk açılış performans polish uygulandı. `brand.json` ve `menu.json` bağımsız render yerine batch akışıyla yüklenir; JSON sonrası tek final render yapılır. No-op resize dispatch kullanan refresh helper'lar kaldırıldı.

## Version 3.3.0

Bağımsız `admin.html` menü editörü eklendi. `Canlı Önizle` localStorage tabanlı `index.html?mode=demo&preview=local` açar; `menu.json indir` gerçek yayın dosyasını üretir.

## Version 3.4.0

Admin panel premium Admin Studio arayüzüne yükseltildi. Hazır etiket/ikon araçları, ürün şablonları, mobil kart önizlemesi ve demo-only index yönlendirmesi eklendi: `index.html?mode=demo&admin=show`.

## Version 3.5.0

Admin panel inline menü düzenleme modeline geçirildi. Kartlar doğrudan düzenlenir; `menu.json` yüklenemezse gömülü hazır menüyle açılır.

## Version 3.6.0

Admin panel kart seçmeli premium düzenleme paneline geçirildi. İmza/öne çıkan/aktiflik toggle'ları, hazır badge, tag ve ikon seçimleri çocuk kadar basit olacak şekilde butonlaştırıldı.

## Version 3.7.0

Premium Admin UX Final uygulandı. Görsel ikon seçici, gruplu tag seçici, hazır kombinasyonlar, kart kalite skoru, alan bazlı glow rehberi ve canlı kart önizleme güçlendirildi.

## Version 3.7.1

Admin UX Final hotfix: tag/ikon görsel seçicilerin dosyaya uygulanmadığı paket sorunu düzeltildi. `ICON_OPTIONS`, `TAG_GROUPS`, `PRESETS`, görsel seçim kartları, kalite skoru ve glow efektleri admin dosyalarına işlendi.

## Version 3.7.2

Admin görsel seçim polish: rozetlerin her biri kendi anlamına uygun emoji/simgeyle gösterildi; tagler ikonlu ve açıklamalı görsel seçim kartlarına dönüştürüldü; edit paneline `Kaydet` butonu eklendi.

## Version 3.7.3

Admin taxonomy visual fix: mevcut `menu.json` içindeki çok dilli tag yapısı desteklendi, eski ikon sınıfları emoji/etiket karşılıklarıyla eşlendi, bilinmeyen ikonlarda nokta görünmesi engellendi ve aynı anlamlı rozetler/flagler kartta çift görünmeyecek şekilde dedupe edildi.

## Version 3.7.4

Admin üst alanı sadeleştirildi; ürün ekleme akışı kategori seçimi, ürün adı ve şablon seçimi olan modal yapıya alındı. Boş ürünlerde kırık görsel yerine varsayılan “Ürün fotoğrafı hazırlanıyor” görsel alanı eklendi.

## Version 3.7.5

Admin üst alanı yeniden hizalandı ve gereksiz briefing alanı kaldırıldı. Ürün ekleme akışı kategori seçimi + şablon + kaydetmeden önce özet önizlemesi olacak şekilde düzeltildi. Metrik kartları sola hizalı ve mobilde düzenli grid oldu.

## Version 3.7.6

Admin üst toolbar tam responsive grid yapısına alındı. Aksiyonlar primary/utility olarak gruplandı. Görsel düzenleme alanında kırık görsel ikonu yerine `Ürün fotoğrafı hazırlanıyor` placeholder'ı gösterilir.


## Version 3.8.0 — Final Admin Studio

Bu sürüm final admin onay akışını ekler:

- `Kaydet` butonu değişiklik özeti modalı açar.
- Modal eski/yeni alanları ve güncel ürün kartı önizlemesini gösterir.
- `Onayla ve kaydet` sonrası localStorage taslağı güncellenir.
- `Geri al` seçeneği ürün değişikliklerini son onaylı haline döndürür.
- `Değişiklikler` paneli son ürün/kategori işlemlerini localStorage logunda tutar.
- Panelden mobil önizleme, JSON indirme ve log temizleme yapılabilir.


## Version 3.8.1 — Final Hotfix

- `file://` ortamında `menu.json` fetch denenmez; CORS hatası yerine gömülü hazır menü açılır.
- Yeni ürünlerde boş görsel yolu korunur; var olmayan `starters/...webp` gibi local yol üretilmez.
- Modal kapatılırken odak önce blur edilir; `aria-hidden` focus uyarısı giderilir.
- Sol panele `Son değişenler` mini paneli eklendi.
- `Değişiklikler` drawer'ı ve mini panel aynı localStorage logunu gösterir.


## Version 3.8.2 — Mode Context Guard

- Demo, live ve admin preview sepet/not state'leri ayrıldı.
- Sepet artık `demo:cart`, `live:cart`, `demo-preview:cart` scope'larında saklanır.
- Not alanı da aynı scope mantığıyla ayrılır.
- Favoriler, dil ve tema bilinçli olarak ortak kalır.
- Eski demo sepeti yalnızca demo scope'a migrate edilir; live/preview temiz başlar.


## Version 3.8.3 — Final Stabilization Patch

- `menu.json` artık release sırasında `admin.js` içindeki `FALLBACK_MENU` bloğuna otomatik senkronlanır.
- Admin preview temiz oturum olarak açılır; `demo-preview:cart` ve `demo-preview:note` her preview öncesi temizlenir.
- Admin asset'leri müşteri tarafı core cache listesinden çıkarıldı; customer cache yalnızca müşteri deneyimi için tutulur.
