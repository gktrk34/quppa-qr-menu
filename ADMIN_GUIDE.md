# QUPPA Menu Studio — Final Admin

Sürüm: 3.8.2

## Ana akış

1. Ürün kartına tıkla.
2. Sağ panelden ürün adı, fiyat, rozet, tag, ikon ve görsel alanlarını düzenle.
3. `Kaydet` butonuna bas.
4. Değişiklik özeti ve ürün kartı önizlemesini kontrol et.
5. `Onayla ve kaydet` ile taslağa işle.
6. `Önizle` ile mobil görünümü kontrol et.
7. `JSON indir` ile yayınlanacak `menu.json` dosyasını al.

## Değişiklik logu

`Değişiklikler` paneli localStorage üzerinde son işlemleri tutar:

- Ürün eklendi
- Ürün güncellendi
- Ürün kopyalandı
- Ürün silindi
- Kategori eklendi

Bu panel backend değildir; demo ve operasyon takibi içindir.


## 3.8.1 Hotfix Notları

File üzerinden açıldığında tarayıcı güvenlik modeli nedeniyle `menu.json` fetch edilemez. Admin artık bu durumda gömülü hazır menüyü açar. Tam test ve yayın davranışı için local server / GitHub Pages kullanılmalıdır.

Sol taraftaki `Son değişenler` paneli son işlemleri hızlı gösterir; `Tümü` butonu detay panelini açar.


## 3.8.2 Mode Context Guard

Demo, live ve local preview arasında gidip gelirken sepet/not aynı localStorage anahtarını paylaşmaz. Bu yüzden eski çerez/localStorage etkisiyle “sepet güncellemesi buga girdi” gibi görünen durumlar ayrıştırıldı.

Ortak kalanlar: dil, tema, favoriler.
Ayrılanlar: sepet, garson notu.
