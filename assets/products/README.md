# Product Image Assets

Sürüm: 3.2.0

Bu klasör self-host ürün görselleri için hazırlandı.

## Yapı

```text
assets/products/
├── coffee/
├── starters/
├── toasts/
├── snacks/
└── desserts/
```

`menu.json` içindeki her üründe artık `localImage` alanı var.

Örnek:

```json
{
  "id": "espresso-tonic",
  "image": "https://images.unsplash.com/...",
  "localImage": "coffee/espresso-tonic.webp"
}
```

## Davranış

Varsayılan olarak `preferLocalImages` false olduğu için mevcut remote görseller çalışmaya devam eder.

Local görselleri kullanmak için `brand.json` içinde:

```json
{
  "app": {
    "preferLocalImages": true,
    "imageBasePath": "./assets/products/"
  }
}
```

## Önerilen format

- WebP
- 900x600 veya 1200x800
- Kalite: 72-82
- Dosya boyutu hedefi: 80-180 KB
