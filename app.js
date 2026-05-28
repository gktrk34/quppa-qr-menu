/* QUPPA QR Menu - App Logic
   Stage 1: Split from single-file index.html
   Version: 3.2.1
*/
const APP_VERSION = "3.2.1";

/*
  PUBLISHING NOTES
  - Demo link: index.html?mode=demo
  - Live link: index.html?mode=live
  - GitHub Pages works best with relative paths: ./style.css, ./app.js, ./sw.js
  - Every production release should bump APP_VERSION and the ?v= query strings.
*/

/*
  Demo preview: ./index.html?mode=demo
  Live preview: ./index.html?mode=live
  In live mode, theme switcher is hidden and liveTheme is locked.
  Step 3: menuData is normalized, validated and indexed for easier client-specific updates.
*/


const APP_CONFIG = {
  mode: "demo", // "demo" veya "live"
  showThemeSwitcher: true,
  showFeatured: true,
  showTodaySuggestion: true,
  enableUpsell: true,
  enableFavorites: true,
  enablePwa: true,
  enableAnalytics: false,
  allowUrlModeOverride: true,
  liveLocksTheme: true,
  liveTheme: "espresso",
  showDemoBadge: true,
  enableExternalMenu: true,
  menuPath: "./menu.json",
  enableExternalBrand: true,
  brandPath: "./brand.json",
  preferLocalImages: false,
  imageBasePath: "./assets/products/"
};

const BRAND_CONFIG = {
  name: "QUPPA",
  shortName: "QUPPA",
  slogan: {
    tr: "Butik kahve & bar deneyimi",
    en: "Boutique coffee & bar experience",
    ru: "Бутик-кофе и бар",
    ar: "تجربة قهوة وبار بوتيكية"
  },
  menuLabel: {
    tr: "QR Menü",
    en: "QR Menu",
    ru: "QR меню",
    ar: "قائمة QR"
  },
  wifiName: "QUPPA Guest",
  wifiPassword: "quppa2025",
  instagram: "@quppa",
  defaultTheme: "light",
  logoLetter: "Q"
};



function cfg(key, fallback = null) {
  return Object.prototype.hasOwnProperty.call(APP_CONFIG, key) ? APP_CONFIG[key] : fallback;
}

function brand(key, fallback = "") {
  return Object.prototype.hasOwnProperty.call(BRAND_CONFIG, key) ? BRAND_CONFIG[key] : fallback;
}

function brandText(key) {
  const value = brand(key, "");
  if (value && typeof value === "object") return value[S && S.lang ? S.lang : "tr"] || value.tr || "";
  return value || "";
}


const MENU_SCHEMA_VERSION = "1.0";

const CATEGORY_ORDER = ["coffee", "starters", "toasts", "snacks", "desserts"];

const CATEGORY_ALIASES = {
  coffees: "coffee",
  kahveler: "coffee",
  baslangiclar: "starters",
  başlangıçlar: "starters",
  tostlar: "toasts",
  atistirmaliklar: "snacks",
  atıştırmalıklar: "snacks",
  tatlilar: "desserts",
  tatlılar: "desserts"
};

const PRODUCT_DEFAULTS = {
  badge: { tr: "", en: "", ru: "", ar: "" },
  tags: { tr: [], en: [], ru: [], ar: [] },
  icons: [],
  isAvailable: true,
  isSignature: false,
  isFeatured: false
};

function textMap(value, fallback = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      tr: value.tr ?? fallback,
      en: value.en ?? value.tr ?? fallback,
      ru: value.ru ?? value.tr ?? fallback,
      ar: value.ar ?? value.tr ?? fallback
    };
  }

  return {
    tr: value ?? fallback,
    en: value ?? fallback,
    ru: value ?? fallback,
    ar: value ?? fallback
  };
}

function arrayTextMap(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      tr: Array.isArray(value.tr) ? value.tr : [],
      en: Array.isArray(value.en) ? value.en : (Array.isArray(value.tr) ? value.tr : []),
      ru: Array.isArray(value.ru) ? value.ru : (Array.isArray(value.tr) ? value.tr : []),
      ar: Array.isArray(value.ar) ? value.ar : (Array.isArray(value.tr) ? value.tr : [])
    };
  }

  return {
    tr: Array.isArray(value) ? value : [],
    en: Array.isArray(value) ? value : [],
    ru: Array.isArray(value) ? value : [],
    ar: Array.isArray(value) ? value : []
  };
}

function normalizeCategoryId(id) {
  const raw = String(id || "").trim();
  const lower = raw.toLocaleLowerCase("tr-TR");
  return CATEGORY_ALIASES[lower] || raw;
}


function isRemoteUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function joinAssetPath(base, file) {
  if (!file) return "";
  if (isRemoteUrl(file) || String(file).startsWith("./") || String(file).startsWith("/") || String(file).startsWith("data:")) {
    return file;
  }

  return `${String(base || "./assets/products/").replace(/\/?$/, "/")}${file}`;
}

function resolveProductImage(product) {
  const local = product.localImage || product.asset || "";
  if (cfg("preferLocalImages", false) && local) {
    return joinAssetPath(cfg("imageBasePath", "./assets/products/"), local);
  }

  return product.image || (local ? joinAssetPath(cfg("imageBasePath", "./assets/products/"), local) : "");
}

function normalizeProduct(product) {
  return {
    ...PRODUCT_DEFAULTS,
    ...product,
    id: String(product.id || "").trim(),
    name: textMap(product.name),
    desc: textMap(product.desc || product.description),
    detail: textMap(product.detail || product.desc || product.description),
    price: Number(product.price || 0),
    image: product.image || "",
    badge: textMap(product.badge || PRODUCT_DEFAULTS.badge),
    tags: arrayTextMap(product.tags || PRODUCT_DEFAULTS.tags),
    icons: Array.isArray(product.icons) ? product.icons : [],
    isAvailable: product.isAvailable !== false,
    isSignature: !!product.isSignature,
    isFeatured: !!product.isFeatured
  };
}

function normalizeCategory(category) {
  return {
    ...category,
    id: normalizeCategoryId(category.id),
    name: textMap(category.name),
    description: textMap(category.description),
    products: Array.isArray(category.products)
      ? category.products.map(normalizeProduct).filter(product => product.id)
      : []
  };
}

function normalizeMenuData(menu) {
  const normalized = Array.isArray(menu) ? menu.map(normalizeCategory) : [];

  normalized.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.id);
    const bi = CATEGORY_ORDER.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return normalized;
}

function validateMenuData(menu) {
  const warnings = [];
  const categoryIds = new Set();
  const productIds = new Set();

  for (const category of menu) {
    if (!category.id) warnings.push("Kategori ID eksik.");
    if (categoryIds.has(category.id)) warnings.push(`Tekrarlanan kategori ID: ${category.id}`);
    categoryIds.add(category.id);

    if (!Array.isArray(category.products) || !category.products.length) {
      warnings.push(`Boş kategori: ${category.id}`);
    }

    for (const product of category.products || []) {
      if (!product.id) warnings.push(`Ürün ID eksik: ${loc(category.name)}`);
      if (productIds.has(product.id)) warnings.push(`Tekrarlanan ürün ID: ${product.id}`);
      productIds.add(product.id);

      if (!product.name || !product.name.tr) warnings.push(`Ürün adı eksik: ${product.id}`);
      if (!Number.isFinite(product.price) || product.price <= 0) warnings.push(`Geçersiz fiyat: ${product.id}`);
      if (!product.image) warnings.push(`Görsel eksik: ${product.id}`);
    }
  }

  if (warnings.length && isDemoMode()) {
    console.warn("[QUPPA] Menü veri uyarıları:", warnings);
  }

  return warnings;
}

function getCategoryById(id) {
  return menuData.find(category => category.id === id) || null;
}

function getProductsByCategory(categoryId) {
  const category = getCategoryById(categoryId);
  return category ? category.products : [];
}

function createProductIndex(menu) {
  const map = new Map();

  for (const category of menu) {
    for (const product of category.products) {
      map.set(product.id, { ...product, catId: category.id, catName: loc(category.name), catIcon: category.icon });
    }
  }

  return map;
}




function getUrlModeOverride() {
  if (!cfg("allowUrlModeOverride", true)) return null;

  try {
    const mode = new URLSearchParams(window.location.search).get("mode");
    return mode === "live" || mode === "demo" ? mode : null;
  } catch {
    return null;
  }
}

function applyRuntimeConfig() {
  const modeOverride = getUrlModeOverride();

  if (modeOverride) {
    APP_CONFIG.mode = modeOverride;
  }

  if (APP_CONFIG.mode === "live") {
    APP_CONFIG.showThemeSwitcher = false;

    if (cfg("liveLocksTheme", true)) {
      BRAND_CONFIG.defaultTheme = APP_CONFIG.liveTheme || BRAND_CONFIG.defaultTheme || "light";
    }
  }
}

applyRuntimeConfig();

function isDemoMode() {
  return APP_CONFIG.mode === "demo";
}

function isLiveMode() {
  return APP_CONFIG.mode === "live";
}



class SafeStorage {
  constructor(namespace = "quppa") {
    this.namespace = namespace;
    this.memory = new Map();
    this.available = this.checkAvailability();
  }

  key(key) {
    return `${this.namespace}:${key}`;
  }

  checkAvailability() {
    try {
      if (!("localStorage" in window)) return false;
      const testKey = `__${this.namespace}_storage_test__`;
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  get(key, fallback = null) {
    const fullKey = this.key(key);

    try {
      if (this.available) {
        const value = window.localStorage.getItem(fullKey);
        return value === null ? fallback : value;
      }

      return this.memory.has(fullKey) ? this.memory.get(fullKey) : fallback;
    } catch {
      return this.memory.has(fullKey) ? this.memory.get(fullKey) : fallback;
    }
  }

  set(key, value) {
    const fullKey = this.key(key);
    const safeValue = String(value);

    try {
      if (this.available) {
        window.localStorage.setItem(fullKey, safeValue);
      } else {
        this.memory.set(fullKey, safeValue);
      }

      return true;
    } catch {
      this.available = false;
      this.memory.set(fullKey, safeValue);
      return false;
    }
  }

  remove(key) {
    const fullKey = this.key(key);

    try {
      if (this.available) {
        window.localStorage.removeItem(fullKey);
      }

      this.memory.delete(fullKey);
      return true;
    } catch {
      this.memory.delete(fullKey);
      return false;
    }
  }

  getJSON(key, fallback = null) {
    const value = this.get(key, null);

    if (value === null) return fallback;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  setJSON(key, value) {
    try {
      return this.set(key, JSON.stringify(value));
    } catch {
      return false;
    }
  }

  migrateLegacyJSON(legacyKey, newKey, fallback = null) {
    const existing = this.getJSON(newKey, null);
    if (existing !== null) return existing;

    try {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue === null) return fallback;
      const parsed = JSON.parse(legacyValue);
      this.setJSON(newKey, parsed);
      return parsed;
    } catch {
      return fallback;
    }
  }

  migrateLegacyString(legacyKey, newKey, fallback = "") {
    const existing = this.get(newKey, null);
    if (existing !== null) return existing;

    try {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue === null) return fallback;
      this.set(newKey, legacyValue);
      return legacyValue;
    } catch {
      return fallback;
    }
  }
}

const storage = new SafeStorage("quppa");


const SafeSession = {
  memory: new Map(),

  get(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return this.memory.has(key) ? this.memory.get(key) : null;
    }
  },

  set(key, value) {
    try {
      window.sessionStorage.setItem(key, String(value));
      return true;
    } catch {
      this.memory.set(key, String(value));
      return false;
    }
  },

  remove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      this.memory.delete(key);
    }
  }
};


/*
  MENU EDITING GUIDE
  - Her kategori: id, name, icon, description, products
  - Her ürün: id, name, desc, detail, price, image, badge, tags, icons, isAvailable, isSignature, isFeatured
  - id alanlarını değiştirme; sepet, favoriler, upsell ve analitik bu ID'lere bağlıdır.
  - Yeni kafe uyarlamasında çoğunlukla BRAND_CONFIG ve menuData güncellenir.
*/

    let menuData=[
      {id:"coffee",icon:"fa-mug-hot",name:{tr:"Kahveler",en:"Coffee",ru:"Кофе",ar:"القهوة"},desc:{tr:"Taze çekilmiş kahve, dengeli aromalar ve imza soğuk demlemeler.",en:"Freshly ground coffee, balanced aromas and signature cold brews.",ru:"Свежемолотый кофе и фирменные холодные напитки.",ar:"قهوة طازجة ومشروبات باردة مميزة."},products:[
        p("espresso-tonic","Espresso Tonic","Yoğun espresso, ferah tonic ve narenciye dokunuşu.",165,"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80","İmza",["espresso","soğuk","narenciye"],["fa-snowflake","fa-lemon"],true,true,true),
        p("lotus-cold-brew","Lotus Cold Brew","18 saat demlenmiş kahve, lotus kreması ve kadifemsi bitiş.",185,"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80","Popüler",["cold brew","tatlı","kremalı"],["fa-snowflake","fa-cookie-bite"],true,true,true),
        p("flat-white","Flat White","Çift espresso ve mikro köpükle yumuşak, güçlü içim.",145,"https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80","Klasik",["sıcak","sütlü","espresso"],["fa-mug-hot","fa-droplet"],true,false,false),
        p("iced-latte","Iced Latte","Buzlu süt, espresso ve hafif vanilya aroması.",155,"https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80","Soğuk",["soğuk","sütlü","vanilya"],["fa-snowflake","fa-droplet"],true,false,false)
      ]},
      {id:"starters",icon:"fa-seedling",name:{tr:"Başlangıçlar",en:"Starters",ru:"Закуски",ar:"المقبلات"},desc:{tr:"Masayı açan hafif, paylaşmalık ve taze tabaklar.",en:"Light, fresh and shareable plates.",ru:"Лёгкие свежие закуски.",ar:"أطباق خفيفة وطازجة."},products:[
        p("bruschetta","Domates Bruschetta","Ekşi maya üzerinde fesleğenli domates ve zeytinyağı.",175,"https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=900&q=80","Taze",["ekşi maya","vejetaryen","domates"],["fa-leaf","fa-wheat-awn"],true,false,false),
        p("humus","Füme Paprikalı Humus","Kremamsı humus, çıtır pita ve zeytinyağı gezdirmesi.",165,"https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?auto=format&fit=crop&w=900&q=80","Vegan",["humus","vegan","paylaşmalık"],["fa-leaf","fa-people-group"],true,false,false),
        p("cheese","Mini Peynir Tabağı","Seçilmiş peynirler, kuru meyve ve çıtır grissini.",245,"https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=900&q=80","Bar",["peynir","paylaşmalık"],["fa-cheese","fa-people-group"],true,true,false),
        p("avocado","Avokado Lokmaları","Misket limonlu avokado, labne ve baharatlı kraker.",195,"https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80","Tükendi",["avokado","hafif","labne"],["fa-leaf"],false,false,false)
      ]},
      {id:"toasts",icon:"fa-bread-slice",name:{tr:"Tostlar",en:"Toasts",ru:"Тосты",ar:"التوست"},desc:{tr:"Bol malzemeli, çıtır ekmekli ve doyurucu tost seçkisi.",en:"Crispy, filling toasts with generous ingredients.",ru:"Сытные хрустящие тосты.",ar:"توست مشبع ومقرمش."},products:[
        p("quppa-toast","QUPPA Tost","Dana jambon, eski kaşar, domates reçeli ve tereyağı.",235,"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80","İmza",["jambon","eski kaşar","doyurucu"],["fa-bread-slice","fa-star"],true,true,true),
        p("three-cheese","Üç Peynirli Tost","Mozzarella, cheddar ve eski kaşarla eriyen lezzet.",205,"https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=900&q=80","Peynirli",["peynir","vejetaryen","sıcak"],["fa-cheese","fa-leaf"],true,false,false),
        p("chicken-toast","Fesleğenli Tavuk Tost","Izgara tavuk, pesto sos, köz biber ve kaşar.",225,"https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=900&q=80","Protein",["tavuk","pesto","doyurucu"],["fa-drumstick-bite"],true,false,false),
        p("sucuk","Sucuklu Kaşarlı Tost","Baharatlı sucuk, bol kaşar ve çıtır ekmek.",215,"https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=900&q=80","Klasik",["sucuk","kaşar","baharatlı"],["fa-fire"],true,false,false)
      ]},
      {id:"snacks",icon:"fa-bowl-food",name:{tr:"Atıştırmalıklar",en:"Snacks",ru:"Снеки",ar:"الوجبات الخفيفة"},desc:{tr:"Kahveye, kokteyle ve sohbetlere eşlik eden küçük tabaklar.",en:"Small plates for coffee, cocktails and conversations.",ru:"Небольшие блюда к кофе и напиткам.",ar:"أطباق صغيرة تناسب القهوة والجلسات."},products:[
        p("truffle-fries","Trüflü Patates","İnce patates, parmesan, trüf yağı ve aioli sos.",195,"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80","Popüler",["patates","trüf","paylaşmalık"],["fa-people-group","fa-star"],true,true,true),
        p("chicken-bites","Çıtır Tavuk Lokmaları","Baharatlı paneli tavuk, ballı hardal sosla servis edilir.",225,"https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80","Çıtır",["tavuk","soslu","sıcak"],["fa-drumstick-bite","fa-fire"],true,false,false),
        p("nachos","Bar Nachos","Tortilla cips, cheddar sos, jalapeno ve salsa.",215,"data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20900%20900%27%3E%0A%20%20%3Cdefs%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%27bg%27%20x1%3D%270%27%20x2%3D%271%27%20y1%3D%270%27%20y2%3D%271%27%3E%0A%20%20%20%20%20%20%3Cstop%20stop-color%3D%27%232a1710%27%20offset%3D%270%27/%3E%0A%20%20%20%20%20%20%3Cstop%20stop-color%3D%27%239b4d24%27%20offset%3D%27.55%27/%3E%0A%20%20%20%20%20%20%3Cstop%20stop-color%3D%27%23d99445%27%20offset%3D%271%27/%3E%0A%20%20%20%20%3C/linearGradient%3E%0A%20%20%20%20%3CradialGradient%20id%3D%27glow%27%20cx%3D%27.35%27%20cy%3D%27.25%27%20r%3D%27.8%27%3E%0A%20%20%20%20%20%20%3Cstop%20stop-color%3D%27%23ffd68a%27%20stop-opacity%3D%27.75%27/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%27.55%27%20stop-color%3D%27%23d66b2f%27%20stop-opacity%3D%27.38%27/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%271%27%20stop-color%3D%27%231b0d08%27%20stop-opacity%3D%270%27/%3E%0A%20%20%20%20%3C/radialGradient%3E%0A%20%20%20%20%3Cfilter%20id%3D%27shadow%27%20x%3D%27-20%25%27%20y%3D%27-20%25%27%20width%3D%27140%25%27%20height%3D%27140%25%27%3E%0A%20%20%20%20%20%20%3CfeDropShadow%20dx%3D%270%27%20dy%3D%2718%27%20stdDeviation%3D%2720%27%20flood-color%3D%27%231c0b05%27%20flood-opacity%3D%27.36%27/%3E%0A%20%20%20%20%3C/filter%3E%0A%20%20%3C/defs%3E%0A%20%20%3Crect%20width%3D%27900%27%20height%3D%27900%27%20fill%3D%27url%28%23bg%29%27/%3E%0A%20%20%3Crect%20width%3D%27900%27%20height%3D%27900%27%20fill%3D%27url%28%23glow%29%27/%3E%0A%20%20%3Ccircle%20cx%3D%27735%27%20cy%3D%27160%27%20r%3D%2796%27%20fill%3D%27%23ffd27b%27%20opacity%3D%27.20%27/%3E%0A%20%20%3Ccircle%20cx%3D%27170%27%20cy%3D%27780%27%20r%3D%27150%27%20fill%3D%27%2349180f%27%20opacity%3D%27.28%27/%3E%0A%20%20%3Cg%20filter%3D%27url%28%23shadow%29%27%3E%0A%20%20%20%20%3Cellipse%20cx%3D%27450%27%20cy%3D%27585%27%20rx%3D%27335%27%20ry%3D%27160%27%20fill%3D%27%233b1d13%27%20opacity%3D%27.62%27/%3E%0A%20%20%20%20%3Cellipse%20cx%3D%27450%27%20cy%3D%27555%27%20rx%3D%27310%27%20ry%3D%27135%27%20fill%3D%27%235a2a18%27/%3E%0A%20%20%20%20%3Cg%20stroke%3D%27%23a95425%27%20stroke-width%3D%278%27%20stroke-linejoin%3D%27round%27%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M225%20540%20L370%20250%20L505%20565%20Z%27%20fill%3D%27%23f3b24d%27/%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M365%20575%20L535%20245%20L668%20590%20Z%27%20fill%3D%27%23f7c35e%27/%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M180%20620%20L325%20345%20L455%20650%20Z%27%20fill%3D%27%23e99a36%27/%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M500%20650%20L635%20350%20L765%20625%20Z%27%20fill%3D%27%23f0ad49%27/%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M330%20650%20L455%20375%20L590%20665%20Z%27%20fill%3D%27%23ffd06c%27/%3E%0A%20%20%20%20%3C/g%3E%0A%20%20%20%20%3Cg%20fill%3D%27%23b92222%27%20opacity%3D%27.92%27%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27350%27%20cy%3D%27510%27%20r%3D%2722%27/%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27520%27%20cy%3D%27520%27%20r%3D%2719%27/%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27615%27%20cy%3D%27585%27%20r%3D%2717%27/%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27430%27%20cy%3D%27610%27%20r%3D%2715%27/%3E%0A%20%20%20%20%3C/g%3E%0A%20%20%20%20%3Cg%20fill%3D%27%232f8a4b%27%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27405%27%20cy%3D%27475%27%20r%3D%2715%27/%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27570%27%20cy%3D%27450%27%20r%3D%2714%27/%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27500%27%20cy%3D%27620%27%20r%3D%2712%27/%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%27650%27%20cy%3D%27520%27%20r%3D%2713%27/%3E%0A%20%20%20%20%3C/g%3E%0A%20%20%20%20%3Cg%20fill%3D%27%23ffe38e%27%20opacity%3D%27.88%27%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M315%20450c52-32%20120-33%20180-4%2014%207%2010%2029-6%2028-60-5-111%200-158%2018-20%208-33-30-16-42z%27/%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M425%20562c58-28%20116-26%20176%206%2017%209%208%2033-11%2030-52-8-98-6-151%2013-21%207-34-39-14-49z%27/%3E%0A%20%20%20%20%3C/g%3E%0A%20%20%3C/g%3E%0A%20%20%3Ctext%20x%3D%27450%27%20y%3D%27805%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-weight%3D%27900%27%20font-size%3D%2754%27%20fill%3D%27%23fff3d6%27%20letter-spacing%3D%275%27%3EBAR%20NACHOS%3C/text%3E%0A%3C/svg%3E","Baharatlı",["nachos","cheddar","baharatlı"],["fa-fire","fa-people-group"],true,false,false),
        p("mini-burger","Mini Burger Trio","Üç mini burger, karamelize soğan ve özel sos.",285,"https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80","Tükendi",["burger","et","paylaşmalık"],["fa-burger"],false,false,false)
      ]},
      {id:"desserts",icon:"fa-cake-candles",name:{tr:"Tatlılar",en:"Desserts",ru:"Десерты",ar:"الحلويات"},desc:{tr:"Kahveyle dengelenen, rafine ve tatlı kapanışlar.",en:"Refined sweet finishes that pair beautifully with coffee.",ru:"Изысканные десерты к кофе.",ar:"حلويات راقية تناسب القهوة."},products:[
        p("san-sebastian","San Sebastian","Akışkan dokulu cheesecake, hafif yanık üst katman.",195,"https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80","Popüler",["cheesecake","kremalı","kahve"],["fa-star","fa-mug-hot"],true,true,true),
        p("tiramisu","Kadehte Tiramisu","Mascarpone kreması, espresso ve kakao dengesi.",185,"https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80","İtalyan",["espresso","mascarpone","soğuk"],["fa-snowflake","fa-mug-hot"],true,false,false),
        p("brownie","Fındıklı Brownie","Yoğun çikolata, kavrulmuş fındık ve deniz tuzu.",175,"https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80","Çikolatalı",["brownie","çikolata","fındık"],["fa-cookie-bite"],true,false,false),
        p("lemon-tart","Limon Tart","Tereyağlı tart tabanı, limon kreması ve mereng.",165,"https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=900&q=80","Ferah",["limon","tart","hafif"],["fa-lemon"],true,false,false)
      ]}
    ];
    function p(id,name,desc,price,image,badge,tags,icons,isAvailable,isSignature,isFeatured){return{id,name:{tr:name,en:name,ru:name,ar:name},desc:{tr:desc,en:desc,ru:desc,ar:desc},detail:{tr:desc+" QUPPA sunumuyla dengeli ve modern bir seçenek.",en:desc,ru:desc,ar:desc},price,image,badge:{tr:badge,en:badge,ru:badge,ar:badge},tags:{tr:tags,en:tags,ru:tags,ar:tags},icons,isAvailable,isSignature,isFeatured}}

    const productCopy = {
      "espresso-tonic": {
        name: { tr:"Espresso Tonic", en:"Espresso Tonic", ru:"Эспрессо-тоник", ar:"إسبريسو تونيك" },
        desc: { tr:"Yoğun espresso, ferah tonic ve narenciye dokunuşu.", en:"Bold espresso with refreshing tonic and a citrus touch.", ru:"Насыщенный эспрессо, освежающий тоник и цитрусовая нотка.", ar:"إسبريسو قوي مع تونيك منعش ولمسة حمضيات." },
        detail: { tr:"Ferah ve modern içimli bir kahve. Özellikle sıcak havalarda hafif tatlılarla iyi eşleşir.", en:"A refreshing modern coffee, especially good on warm days and with light desserts.", ru:"Освежающий современный кофейный напиток, особенно хорош в тёплую погоду и с лёгкими десертами.", ar:"قهوة عصرية ومنعشة، مناسبة للأجواء الدافئة وتنسجم مع الحلويات الخفيفة." },
        badge: { tr:"İmza", en:"Signature", ru:"Фирменный", ar:"مميز" },
        tags: { tr:["espresso","soğuk","narenciye"], en:["espresso","cold","citrus"], ru:["эспрессо","холодный","цитрус"], ar:["إسبريسو","بارد","حمضيات"] }
      },
      "lotus-cold-brew": {
        name: { tr:"Lotus Cold Brew", en:"Lotus Cold Brew", ru:"Лотус колд брю", ar:"لوتس كولد برو" },
        desc: { tr:"18 saat demlenmiş kahve, lotus kreması ve kadifemsi bitiş.", en:"18-hour cold brew, lotus cream and a velvety finish.", ru:"Колд брю 18-часового заваривания, крем лотус и бархатное послевкусие.", ar:"قهوة باردة منقوعة 18 ساعة مع كريمة اللوتس ولمسة مخملية." },
        detail: { tr:"Tatlı ve kremalı bir kahve deneyimi. Kahve tadı belirgin kalırken lotus aroması tatlı bir final bırakır.", en:"A sweet and creamy coffee experience with a clear coffee base and a lotus finish.", ru:"Сладкий и кремовый кофе с выраженной кофейной основой и финалом лотус.", ar:"تجربة قهوة حلوة وكريمية مع طعم قهوة واضح ولمسة لوتس في النهاية." },
        badge: { tr:"Popüler", en:"Popular", ru:"Популярно", ar:"شائع" },
        tags: { tr:["cold brew","tatlı","kremalı"], en:["cold brew","sweet","creamy"], ru:["колд брю","сладкий","кремовый"], ar:["كولد برو","حلو","كريمي"] }
      },
      "flat-white": {
        name: { tr:"Flat White", en:"Flat White", ru:"Флэт уайт", ar:"فلات وايت" },
        desc: { tr:"Çift espresso ve mikro köpükle yumuşak, güçlü içim.", en:"Double espresso with silky microfoam for a smooth strong cup.", ru:"Двойной эспрессо и микропена для мягкого, но насыщенного вкуса.", ar:"دبل إسبريسو مع رغوة ناعمة لطعم قوي وسلس." },
        detail: { tr:"Espresso tadını seven ama daha yumuşak içim isteyenler için dengeli bir seçenek.", en:"A balanced option for those who like espresso flavor with a softer milk texture.", ru:"Сбалансированный вариант для любителей вкуса эспрессо с мягкой молочной текстурой.", ar:"خيار متوازن لمن يحب طعم الإسبريسو مع قوام حليب أنعم." },
        badge: { tr:"Klasik", en:"Classic", ru:"Классика", ar:"كلاسيكي" },
        tags: { tr:["sıcak","sütlü","espresso"], en:["hot","milk","espresso"], ru:["горячий","молочный","эспрессо"], ar:["ساخن","حليب","إسبريسو"] }
      },
      "iced-latte": {
        name: { tr:"Iced Latte", en:"Iced Latte", ru:"Айс латте", ar:"آيس لاتيه" },
        desc: { tr:"Buzlu süt, espresso ve hafif vanilya aroması.", en:"Cold milk, espresso and a light vanilla aroma.", ru:"Холодное молоко, эспрессо и лёгкий аромат ванили.", ar:"حليب بارد مع إسبريسو ونكهة فانيليا خفيفة." },
        detail: { tr:"Hafif ve serinletici bir latte. Vanilya dokunuşu içimi yumuşatır.", en:"A light and refreshing latte softened with a vanilla touch.", ru:"Лёгкий освежающий латте с мягкой ванильной нотой.", ar:"لاتيه خفيف ومنعش بلمسة فانيليا ناعمة." },
        badge: { tr:"Soğuk", en:"Cold", ru:"Холодный", ar:"بارد" },
        tags: { tr:["soğuk","sütlü","vanilya"], en:["cold","milk","vanilla"], ru:["холодный","молочный","ваниль"], ar:["بارد","حليب","فانيليا"] }
      },
      "bruschetta": {
        name: { tr:"Domates Bruschetta", en:"Tomato Bruschetta", ru:"Брускетта с томатом", ar:"بروشيتا بالطماطم" },
        desc: { tr:"Ekşi maya üzerinde fesleğenli domates ve zeytinyağı.", en:"Basil tomato and olive oil on sourdough bread.", ru:"Томаты с базиликом и оливковым маслом на хлебе на закваске.", ar:"طماطم بالريحان وزيت الزيتون على خبز ساوردو." },
        detail: { tr:"Taze domates, fesleğen ve kaliteli zeytinyağı ile hazırlanır. Kahve öncesi hafif başlangıç için idealdir.", en:"Prepared with fresh tomato, basil and olive oil. Ideal as a light starter.", ru:"Готовится со свежими томатами, базиликом и оливковым маслом. Идеально как лёгкая закуска.", ar:"يُحضّر بالطماطم الطازجة والريحان وزيت الزيتون. بداية خفيفة ومناسبة." },
        badge: { tr:"Taze", en:"Fresh", ru:"Свежий", ar:"طازج" },
        tags: { tr:["ekşi maya","vejetaryen","domates"], en:["sourdough","vegetarian","tomato"], ru:["закваска","вегетарианский","томат"], ar:["ساوردو","نباتي","طماطم"] }
      },
      "humus": {
        name: { tr:"Füme Paprikalı Humus", en:"Smoked Paprika Hummus", ru:"Хумус с копчёной паприкой", ar:"حمص بالبابريكا المدخنة" },
        desc: { tr:"Kremamsı humus, çıtır pita ve zeytinyağı gezdirmesi.", en:"Creamy hummus with crispy pita and olive oil.", ru:"Кремовый хумус, хрустящая пита и оливковое масло.", ar:"حمص كريمي مع خبز بيتا مقرمش وزيت زيتون." },
        detail: { tr:"Vegan ve paylaşmalık bir başlangıç. Füme paprika aroması sıcak bir derinlik verir.", en:"A vegan shareable starter with a warm smoked paprika depth.", ru:"Веганская закуска для компании с тёплой нотой копчёной паприки.", ar:"مقبل نباتي للمشاركة مع عمق نكهة البابريكا المدخنة." },
        badge: { tr:"Vegan", en:"Vegan", ru:"Веган", ar:"نباتي" },
        tags: { tr:["humus","vegan","paylaşmalık"], en:["hummus","vegan","share"], ru:["хумус","веган","для компании"], ar:["حمص","نباتي","مشاركة"] }
      },
      "cheese": {
        name: { tr:"Mini Peynir Tabağı", en:"Mini Cheese Plate", ru:"Мини сырная тарелка", ar:"طبق أجبان صغير" },
        desc: { tr:"Seçilmiş peynirler, kuru meyve ve çıtır grissini.", en:"Selected cheeses, dried fruits and crispy grissini.", ru:"Ассорти сыров, сухофрукты и хрустящие гриссини.", ar:"أجبان مختارة مع فواكه مجففة وغريسيني مقرمش." },
        detail: { tr:"Kahve sonrası veya bar içecekleriyle eşleşen küçük ama rafine bir tabak.", en:"A compact refined plate that pairs well after coffee or with bar drinks.", ru:"Небольшая изысканная тарелка к кофе или напиткам.", ar:"طبق صغير وراقي يناسب القهوة أو المشروبات." },
        badge: { tr:"Bar", en:"Bar", ru:"Бар", ar:"بار" },
        tags: { tr:["peynir","paylaşmalık"], en:["cheese","share"], ru:["сыр","для компании"], ar:["جبن","مشاركة"] }
      },
      "avocado": {
        name: { tr:"Avokado Lokmaları", en:"Avocado Bites", ru:"Ломтики авокадо", ar:"لقيمات الأفوكادو" },
        desc: { tr:"Misket limonlu avokado, labne ve baharatlı kraker.", en:"Lime avocado, labneh and spiced crackers.", ru:"Авокадо с лаймом, лабне и пряные крекеры.", ar:"أفوكادو بالليمون مع لبنة وكرات مقرمشة متبلة." },
        detail: { tr:"Hafif, ferah ve modern bir başlangıç. Şu an stokta değildir.", en:"A light, fresh and modern starter. Currently unavailable.", ru:"Лёгкая свежая современная закуска. Сейчас недоступна.", ar:"مقبل خفيف ومنعش وعصري. غير متوفر حالياً." },
        badge: { tr:"Tükendi", en:"Sold Out", ru:"Нет в наличии", ar:"نفد" },
        tags: { tr:["avokado","hafif","labne"], en:["avocado","light","labneh"], ru:["авокадо","лёгкий","лабне"], ar:["أفوكادو","خفيف","لبنة"] }
      },
      "quppa-toast": {
        name: { tr:"QUPPA Tost", en:"QUPPA Toast", ru:"Тост QUPPA", ar:"توست QUPPA" },
        desc: { tr:"Dana jambon, eski kaşar, domates reçeli ve tereyağı.", en:"Beef ham, aged kashar, tomato jam and butter.", ru:"Говяжья ветчина, выдержанный кашар, томатный джем и масло.", ar:"لحم بقري، جبن كاشار معتق، مربى طماطم وزبدة." },
        detail: { tr:"QUPPA’nın doyurucu imza tostudur. Tatlı domates reçeli ve eski kaşar dengesiyle öne çıkar.", en:"QUPPA’s filling signature toast with aged cheese and tomato jam balance.", ru:"Фирменный сытный тост QUPPA с балансом выдержанного сыра и томатного джема.", ar:"توست QUPPA المميز والمشبع بتوازن جبن معتق ومربى الطماطم." },
        badge: { tr:"İmza", en:"Signature", ru:"Фирменный", ar:"مميز" },
        tags: { tr:["jambon","eski kaşar","doyurucu"], en:["ham","aged cheese","filling"], ru:["ветчина","сыр","сытный"], ar:["لحم","جبن","مشبع"] }
      },
      "three-cheese": {
        name: { tr:"Üç Peynirli Tost", en:"Three Cheese Toast", ru:"Тост с тремя сырами", ar:"توست بثلاثة أجبان" },
        desc: { tr:"Mozzarella, cheddar ve eski kaşarla eriyen lezzet.", en:"Mozzarella, cheddar and aged kashar melted together.", ru:"Моцарелла, чеддер и выдержанный кашар.", ar:"موزاريلا وشيدر وكاشار معتق بطعم ذائب." },
        detail: { tr:"Peynir ağırlıklı, yumuşak ve klasik bir tost. Vejetaryen tercih edenler için uygundur.", en:"A cheese-forward classic toast, suitable for vegetarian preferences.", ru:"Классический сырный тост, подходит для вегетарианского выбора.", ar:"توست جبني كلاسيكي مناسب لمحبي الخيارات النباتية." },
        badge: { tr:"Peynirli", en:"Cheesy", ru:"Сырный", ar:"جبنة" },
        tags: { tr:["peynir","vejetaryen","sıcak"], en:["cheese","vegetarian","hot"], ru:["сыр","вегетарианский","горячий"], ar:["جبن","نباتي","ساخن"] }
      },
      "chicken-toast": {
        name: { tr:"Fesleğenli Tavuk Tost", en:"Basil Chicken Toast", ru:"Тост с курицей и базиликом", ar:"توست دجاج بالريحان" },
        desc: { tr:"Izgara tavuk, pesto sos, köz biber ve kaşar.", en:"Grilled chicken, pesto, roasted pepper and kashar cheese.", ru:"Курица гриль, песто, печёный перец и сыр кашар.", ar:"دجاج مشوي، صلصة بيستو، فلفل مشوي وجبن كاشار." },
        detail: { tr:"Proteinli ve doyurucu bir seçenek. Pesto aroması ile klasik tosttan ayrılır.", en:"A protein-rich filling option with pesto aroma.", ru:"Сытный белковый вариант с ароматом песто.", ar:"خيار غني بالبروتين ومشبع مع نكهة البيستو." },
        badge: { tr:"Protein", en:"Protein", ru:"Белок", ar:"بروتين" },
        tags: { tr:["tavuk","pesto","doyurucu"], en:["chicken","pesto","filling"], ru:["курица","песто","сытный"], ar:["دجاج","بيستو","مشبع"] }
      },
      "sucuk": {
        name: { tr:"Sucuklu Kaşarlı Tost", en:"Sucuk & Cheese Toast", ru:"Тост с суджуком и сыром", ar:"توست سجق وجبن" },
        desc: { tr:"Baharatlı sucuk, bol kaşar ve çıtır ekmek.", en:"Spiced sucuk, plenty of kashar cheese and crispy bread.", ru:"Пряный суджук, много сыра кашар и хрустящий хлеб.", ar:"سجق متبل مع جبن كاشار وخبز مقرمش." },
        detail: { tr:"Klasik, güçlü ve baharatlı tost sevenler için net bir seçenek.", en:"A clear choice for classic, bold and spiced toast lovers.", ru:"Выбор для любителей классического пряного тоста.", ar:"خيار واضح لمحبي التوست الكلاسيكي والمتبل." },
        badge: { tr:"Klasik", en:"Classic", ru:"Классика", ar:"كلاسيكي" },
        tags: { tr:["sucuk","kaşar","baharatlı"], en:["sucuk","cheese","spicy"], ru:["суджук","сыр","острый"], ar:["سجق","جبن","حار"] }
      },
      "truffle-fries": {
        name: { tr:"Trüflü Patates", en:"Truffle Fries", ru:"Картофель с трюфелем", ar:"بطاطس بالترافل" },
        desc: { tr:"İnce patates, parmesan, trüf yağı ve aioli sos.", en:"Thin fries, parmesan, truffle oil and aioli sauce.", ru:"Тонкий картофель, пармезан, трюфельное масло и айоли.", ar:"بطاطس رفيعة مع بارميزان وزيت ترافل وصلصة أيولي." },
        detail: { tr:"Paylaşmalık, güçlü aromalı ve bar/kahve eşlikçisi bir tabak.", en:"A shareable aromatic plate that pairs with coffee or bar drinks.", ru:"Ароматная закуска для компании к кофе или напиткам.", ar:"طبق عطري للمشاركة يناسب القهوة أو المشروبات." },
        badge: { tr:"Popüler", en:"Popular", ru:"Популярно", ar:"شائع" },
        tags: { tr:["patates","trüf","paylaşmalık"], en:["fries","truffle","share"], ru:["картофель","трюфель","для компании"], ar:["بطاطس","ترافل","مشاركة"] }
      },
      "chicken-bites": {
        name: { tr:"Çıtır Tavuk Lokmaları", en:"Crispy Chicken Bites", ru:"Хрустящие куриные кусочки", ar:"لقيمات دجاج مقرمشة" },
        desc: { tr:"Baharatlı paneli tavuk, ballı hardal sosla servis edilir.", en:"Spiced breaded chicken served with honey mustard.", ru:"Курица в пряной панировке с медово-горчичным соусом.", ar:"دجاج متبل ومقرمش يقدم مع صلصة الخردل بالعسل." },
        detail: { tr:"Çıtır, sıcak ve paylaşmalık. Ballı hardal sos tatlı-baharatlı denge verir.", en:"Crispy, warm and shareable with a sweet-spicy honey mustard balance.", ru:"Хрустящие тёплые кусочки для компании с медово-горчичным балансом.", ar:"مقرمش ودافئ للمشاركة مع توازن حلو وحار من صلصة الخردل بالعسل." },
        badge: { tr:"Çıtır", en:"Crispy", ru:"Хрустящий", ar:"مقرمش" },
        tags: { tr:["tavuk","soslu","sıcak"], en:["chicken","sauce","hot"], ru:["курица","соус","горячий"], ar:["دجاج","صلصة","ساخن"] }
      },
      "nachos": {
        name: { tr:"Bar Nachos", en:"Bar Nachos", ru:"Начос бар", ar:"ناتشوز بار" },
        desc: { tr:"Tortilla cips, cheddar sos, jalapeno ve salsa.", en:"Tortilla chips, cheddar sauce, jalapeno and salsa.", ru:"Чипсы тортилья, соус чеддер, халапеньо и сальса.", ar:"رقائق تورتيلا مع صلصة شيدر وهالابينو وسالسا." },
        detail: { tr:"Baharatlı ve paylaşmalık bir bar klasiği. Uzun sohbetler için idealdir.", en:"A spicy shareable bar classic for long conversations.", ru:"Острая закуска для компании, барная классика.", ar:"وجبة بار كلاسيكية حارة للمشاركة والجلسات الطويلة." },
        badge: { tr:"Baharatlı", en:"Spicy", ru:"Острый", ar:"حار" },
        tags: { tr:["nachos","cheddar","baharatlı"], en:["nachos","cheddar","spicy"], ru:["начос","чеддер","острый"], ar:["ناتشوز","شيدر","حار"] }
      },
      "mini-burger": {
        name: { tr:"Mini Burger Trio", en:"Mini Burger Trio", ru:"Три мини-бургера", ar:"ثلاثة ميني برجر" },
        desc: { tr:"Üç mini burger, karamelize soğan ve özel sos.", en:"Three mini burgers with caramelized onion and house sauce.", ru:"Три мини-бургера с карамелизированным луком и фирменным соусом.", ar:"ثلاثة ميني برجر مع بصل مكرمل وصلصة خاصة." },
        detail: { tr:"Paylaşmalık ve doyurucu bir seçenek. Şu an stokta değildir.", en:"A filling shareable option. Currently unavailable.", ru:"Сытный вариант для компании. Сейчас недоступен.", ar:"خيار مشبع للمشاركة. غير متوفر حالياً." },
        badge: { tr:"Tükendi", en:"Sold Out", ru:"Нет в наличии", ar:"نفد" },
        tags: { tr:["burger","et","paylaşmalık"], en:["burger","meat","share"], ru:["бургер","мясо","для компании"], ar:["برجر","لحم","مشاركة"] }
      },
      "san-sebastian": {
        name: { tr:"San Sebastian", en:"San Sebastian", ru:"Сан-Себастьян", ar:"سان سيباستيان" },
        desc: { tr:"Akışkan dokulu cheesecake, hafif yanık üst katman.", en:"Creamy cheesecake with a gently caramelized top.", ru:"Кремовый чизкейк с лёгкой карамелизированной корочкой.", ar:"تشيزكيك كريمي بطبقة علوية محمصة بلطف." },
        detail: { tr:"Kahveyle en güçlü eşleşen tatlılardan biri. Hafif yanık üst katman ve kremamsı doku öne çıkar.", en:"One of the strongest coffee pairings, with a caramelized top and creamy texture.", ru:"Один из лучших десертов к кофе, с карамельной корочкой и кремовой текстурой.", ar:"من أفضل الحلويات مع القهوة، بطبقة علوية محمصة وقوام كريمي." },
        badge: { tr:"Popüler", en:"Popular", ru:"Популярно", ar:"شائع" },
        tags: { tr:["cheesecake","kremalı","kahve"], en:["cheesecake","creamy","coffee"], ru:["чизкейк","кремовый","к кофе"], ar:["تشيزكيك","كريمي","قهوة"] }
      },
      "tiramisu": {
        name: { tr:"Kadehte Tiramisu", en:"Tiramisu Cup", ru:"Тирамису в бокале", ar:"تيراميسو بالكأس" },
        desc: { tr:"Mascarpone kreması, espresso ve kakao dengesi.", en:"Mascarpone cream, espresso and cocoa in balance.", ru:"Крем маскарпоне, эспрессо и какао в идеальном балансе.", ar:"كريمة ماسكاربوني وإسبريسو وكاكاو بتوازن ناعم." },
        detail: { tr:"Espresso aromalı, hafif ve zarif bir tatlı. Soğuk servis edilir.", en:"An espresso-based light dessert served cold.", ru:"Лёгкий десерт с ароматом эспрессо, подаётся холодным.", ar:"حلوى خفيفة بنكهة الإسبريسو وتُقدم باردة." },
        badge: { tr:"İtalyan", en:"Italian", ru:"Итальянский", ar:"إيطالي" },
        tags: { tr:["espresso","mascarpone","soğuk"], en:["espresso","mascarpone","cold"], ru:["эспрессо","маскарпоне","холодный"], ar:["إسبريسو","ماسكاربوني","بارد"] }
      },
      "brownie": {
        name: { tr:"Fındıklı Brownie", en:"Hazelnut Brownie", ru:"Брауни с фундуком", ar:"براوني بالبندق" },
        desc: { tr:"Yoğun çikolata, kavrulmuş fındık ve deniz tuzu.", en:"Rich chocolate, roasted hazelnut and sea salt.", ru:"Насыщенный шоколад, жареный фундук и морская соль.", ar:"شوكولاتة غنية مع بندق محمص وملح بحري." },
        detail: { tr:"Yoğun çikolata isteyenler için güçlü bir seçenek. Espresso bazlı kahvelerle iyi gider.", en:"A rich chocolate option that pairs well with espresso-based coffees.", ru:"Насыщенный шоколадный десерт, хорошо сочетается с эспрессо.", ar:"خيار غني بالشوكولاتة يناسب مشروبات الإسبريسو." },
        badge: { tr:"Çikolatalı", en:"Chocolate", ru:"Шоколадный", ar:"شوكولاتة" },
        tags: { tr:["brownie","çikolata","fındık"], en:["brownie","chocolate","hazelnut"], ru:["брауни","шоколад","фундук"], ar:["براوني","شوكولاتة","بندق"] }
      },
      "lemon-tart": {
        name: { tr:"Limon Tart", en:"Lemon Tart", ru:"Лимонный тарт", ar:"تارت الليمون" },
        desc: { tr:"Tereyağlı tart tabanı, limon kreması ve mereng.", en:"Buttery tart base, lemon cream and meringue.", ru:"Масляная основа, лимонный крем и меренга.", ar:"قاعدة تارت بالزبدة مع كريمة الليمون والميرينغ." },
        detail: { tr:"Ferah, ekşi-tatlı dengesi güçlü bir tatlı. Soğuk kahvelerle iyi eşleşir.", en:"A fresh sweet-sour dessert that pairs well with cold coffees.", ru:"Свежий кисло-сладкий десерт, хорошо сочетается с холодным кофе.", ar:"حلوى منعشة بتوازن حلو وحامض وتناسب القهوة الباردة." },
        badge: { tr:"Ferah", en:"Light", ru:"Свежий", ar:"خفيف" },
        tags: { tr:["limon","tart","hafif"], en:["lemon","tart","light"], ru:["лимон","тарт","лёгкий"], ar:["ليمون","تارت","خفيف"] }
      }
    };

    function applyProductTranslations(){
      const products = menuData.flatMap(category => category.products);
      for (const product of products) {
        const copy = productCopy[product.id];
        if (!copy) continue;
        product.name = copy.name || product.name;
        product.desc = copy.desc || product.desc;
        product.detail = copy.detail || product.detail;
        product.badge = copy.badge || product.badge;
        product.tags = copy.tags || product.tags;
      }
    }
    applyProductTranslations();
    menuData = normalizeMenuData(menuData);
    const menuWarnings = validateMenuData(menuData);

    const i18n={
      tr:{code:"TR",brandSub:"QR Menü",heroKicker:"QR Menü Deneyimi",heroDesc:"Butik kahve, seçili atıştırmalıklar ve modern bar atmosferini birleştiren premium QR menü deneyimi.",todayLabel:"Bugünün önerisi",todayText:"Lotus Cold Brew & San Sebastian",featuredTitle:"Öne Çıkanlar",featuredDesc:"İşletmenin vitrin ürünleri için hızlı gösterim alanı.",featuredBadge:"Öne çıkan",search:"Ürün, açıklama veya etiket ara...",theme:"Demo Tema",list:"Listem",add:"Ekle",sold:"Tükendi",products:"ürün",lines:"kalem",all:"Tümü",popular:"Popüler",signature:"İmza",cold:"Soğuk",vegetarian:"Vejetaryen",spicy:"Baharatlı",emptyTitle:"Sonuç bulunamadı",emptyText:"Aradığın ürün menümüzde görünmüyor. Daha genel bir kelimeyle tekrar deneyebilirsin.",tax:"Fiyatlarımıza KDV dahildir.",wifi:"Wi-Fi: QUPPA Guest / Şifre: quppa2025",floatTitle:"{count} ürün listende",floatSub:"Listeyi aç ve garsona göster",sheetTitle:"Sipariş Özeti",sheetDesc:"Bu ekranı garsona gösterebilirsin. Ürünler kategoriye göre gruplanır.",emptyCartTitle:"Listen henüz boş",emptyCartText:"Menüden ürün eklediğinde burada sade bir sipariş özeti oluşacak.",note:"Garsona Not",notePh:"Örn: Az buz, şekersiz, soğansız...",clear:"Listeyi Temizle",copy:"Özeti Kopyala",copied:"Sipariş özeti kopyalandı.",copiedText:"İstersen WhatsApp veya mesaj olarak paylaşabilirsin.",added:"{name} listeye eklendi.",addedText:"Sipariş listeni alttaki bardan açabilirsin.",removed:"Ürün listeden çıkarıldı.",removedText:"{name} sipariş listenden kaldırıldı.",cleared:"Liste temizlendi.",clearedText:"Sipariş listendeki tüm ürünler kaldırıldı.",detailTitle:"Ürün Detayı",detailSub:"Ürün bilgisi ve hızlı ekleme.",pickTitle:"Menü dilini seç",pickText:"Devam etmek için bir dil seç.",favorites:"Favoriler",favorite:"Favori",favorited:"Favorilere eklendi.",favoritedText:"Bu ürün artık bu cihazda favori olarak saklanacak.",unfavorited:"Favorilerden kaldırıldı.",unfavoritedText:"Bu ürün artık favori listenizde görünmeyecek.",shareable:"Paylaşmalık",sweet:"Tatlı",cheesy:"Peynirli",protein:"Protein",fresh:"Ferah",creamy:"Kremalı",coffeePair:"Kahve eşlikçisi",hearty:"Doyurucu",currentCategory:"Şu an",previousCategory:"Önceki kategori",nextCategory:"Sonraki kategori",searchToggle:"Ara",upsellTitle:"Mükemmel eşleşme",upsellDesc:"{product}, seçtiğin kahvenin aromasını güzel dengeler.",upsellAdd:"Sepete ekle · {price}",upsellDismiss:"Şimdilik kalsın"},
      en:{code:"EN",brandSub:"QR Menu",heroKicker:"QR Menu Experience",heroDesc:"A premium QR menu experience combining boutique coffee, selected snacks and a modern bar atmosphere.",todayLabel:"Today’s pick",todayText:"Lotus Cold Brew & San Sebastian",featuredTitle:"Featured",featuredDesc:"A quick showcase area for the venue’s highlight products.",featuredBadge:"Featured",search:"Search product, description or tag...",theme:"Demo Theme",list:"List",add:"Add",sold:"Sold Out",products:"items",lines:"lines",all:"All",popular:"Popular",signature:"Signature",cold:"Cold",vegetarian:"Vegetarian",spicy:"Spicy",emptyTitle:"No results found",emptyText:"This item does not appear on the menu. Try a broader keyword.",tax:"VAT is included in our prices.",wifi:"Wi-Fi: QUPPA Guest / Password: quppa2025",floatTitle:"{count} items in your list",floatSub:"Open and show the waiter",sheetTitle:"Order Summary",sheetDesc:"You can show this screen to the waiter. Items are grouped by category.",emptyCartTitle:"Your list is empty",emptyCartText:"When you add items, a compact order summary will appear here.",note:"Note to Waiter",notePh:"E.g. less ice, no sugar, no onion...",clear:"Clear List",copy:"Copy Summary",copied:"Order summary copied.",copiedText:"You can share it via message or WhatsApp.",added:"{name} added to list.",addedText:"Open your order list from the bottom bar.",removed:"Item removed.",removedText:"{name} was removed from your order list.",cleared:"List cleared.",clearedText:"All items were removed from your order list.",detailTitle:"Product Detail",detailSub:"Product info and quick add.",pickTitle:"Choose menu language",pickText:"Choose a language to continue.",favorites:"Favorites",favorite:"Favorite",favorited:"Added to favorites.",favoritedText:"This product will be saved on this device.",unfavorited:"Removed from favorites.",unfavoritedText:"This product will no longer appear in your favorites.",shareable:"Shareable",sweet:"Sweet",cheesy:"Cheesy",protein:"Protein",fresh:"Fresh",creamy:"Creamy",coffeePair:"Coffee Pairing",hearty:"Hearty",currentCategory:"Current",previousCategory:"Previous category",nextCategory:"Next category",searchToggle:"Search",upsellTitle:"Perfect pairing",upsellDesc:"{product} balances the aroma of your coffee beautifully.",upsellAdd:"Add · {price}",upsellDismiss:"Maybe later"},
      ru:{code:"RU",brandSub:"QR-меню",heroKicker:"QR-меню",heroDesc:"Премиальное QR-меню: кофе, закуски и атмосфера современного бара.",todayLabel:"Рекомендация дня",todayText:"Lotus Cold Brew & San Sebastian",featuredTitle:"Избранное",featuredDesc:"Быстрый блок для витринных позиций заведения.",featuredBadge:"Избранное",search:"Искать блюдо, описание или тег...",theme:"Демо тема",list:"Список",add:"Добавить",sold:"Нет",products:"шт.",lines:"поз.",all:"Все",popular:"Популярно",signature:"Фирменное",cold:"Холодное",vegetarian:"Вегетарианское",spicy:"Острое",emptyTitle:"Ничего не найдено",emptyText:"Такого пункта нет в меню. Попробуйте более общий запрос.",tax:"НДС включён в цены.",wifi:"Wi-Fi: QUPPA Guest / Пароль: quppa2025",floatTitle:"{count} поз. в списке",floatSub:"Открыть и показать официанту",sheetTitle:"Итог заказа",sheetDesc:"Покажите этот экран официанту. Позиции сгруппированы по категориям.",emptyCartTitle:"Список пуст",emptyCartText:"Добавьте позиции из меню, и здесь появится краткий итог заказа.",note:"Примечание",notePh:"Напр.: меньше льда, без сахара...",clear:"Очистить список",copy:"Копировать",copied:"Итог заказа скопирован.",copiedText:"Можно отправить сообщением или в WhatsApp.",added:"{name} добавлено.",addedText:"Откройте список заказа в нижней панели.",removed:"Позиция удалена.",removedText:"{name} удалено из списка заказа.",cleared:"Список очищен.",clearedText:"Все позиции удалены из списка заказа.",detailTitle:"Детали",detailSub:"Информация и быстрое добавление.",pickTitle:"Выберите язык меню",pickText:"Выберите язык, чтобы продолжить.",favorites:"Избранное",favorite:"Избранное",favorited:"Добавлено в избранное.",favoritedText:"Этот продукт будет сохранён на этом устройстве.",unfavorited:"Удалено из избранного.",unfavoritedText:"Этот продукт больше не будет в избранном.",shareable:"Для компании",sweet:"Сладкое",cheesy:"Сырное",protein:"Белковое",fresh:"Свежий",creamy:"Кремовый",coffeePair:"К кофе",hearty:"Сытное",currentCategory:"Сейчас",previousCategory:"Предыдущая категория",nextCategory:"Следующая категория",searchToggle:"Поиск",upsellTitle:"Идеальное сочетание",upsellDesc:"{product} хорошо дополняет аромат выбранного кофе.",upsellAdd:"Добавить · {price}",upsellDismiss:"Пока нет"},
      ar:{code:"AR",brandSub:"قائمة QR",heroKicker:"تجربة قائمة QR",heroDesc:"تجربة قائمة QR راقية تجمع بين القهوة المختصة والوجبات المختارة وأجواء البار العصري.",todayLabel:"اقتراح اليوم",todayText:"لوتس كولد برو وسان سيباستيان",featuredTitle:"الأبرز",featuredDesc:"مساحة عرض سريعة للمنتجات المميزة في المكان.",featuredBadge:"مميز",search:"ابحث عن منتج أو وصف أو وسم...",theme:"مظهر تجريبي",list:"قائمتي",add:"أضف",sold:"نفد",products:"منتج",lines:"أصناف",all:"الكل",popular:"شائع",signature:"مميز",cold:"بارد",vegetarian:"نباتي",spicy:"حار",emptyTitle:"لا توجد نتائج",emptyText:"هذا المنتج غير ظاهر في القائمة. جرّب كلمة بحث أوسع.",tax:"الأسعار تشمل ضريبة القيمة المضافة.",wifi:"Wi-Fi: QUPPA Guest / كلمة المرور: quppa2025",floatTitle:"{count} منتجات في قائمتك",floatSub:"افتح القائمة واعرضها على النادل",sheetTitle:"ملخص الطلب",sheetDesc:"يمكنك عرض هذه الشاشة على النادل. المنتجات مقسمة حسب الفئة.",emptyCartTitle:"قائمتك فارغة",emptyCartText:"عند إضافة المنتجات سيظهر هنا ملخص طلب مختصر.",note:"ملاحظة للنادل",notePh:"مثال: ثلج قليل، بدون سكر...",clear:"مسح القائمة",copy:"نسخ الملخص",copied:"تم نسخ ملخص الطلب.",copiedText:"يمكنك مشاركته عبر الرسائل أو واتساب.",added:"تمت إضافة {name}.",addedText:"افتح قائمة الطلب من الشريط السفلي.",removed:"تم حذف المنتج.",removedText:"تم حذف {name} من قائمة طلبك.",cleared:"تم مسح القائمة.",clearedText:"تم حذف جميع المنتجات من قائمة الطلب.",detailTitle:"تفاصيل المنتج",detailSub:"معلومات المنتج وإضافة سريعة.",pickTitle:"اختر لغة القائمة",pickText:"اختر لغة للمتابعة.",favorites:"المفضلة",favorite:"المفضّلة",favorited:"تمت الإضافة إلى المفضلة.",favoritedText:"سيتم حفظ هذا المنتج على هذا الجهاز.",unfavorited:"تمت الإزالة من المفضلة.",unfavoritedText:"لن يظهر هذا المنتج في قائمة المفضلة بعد الآن.",shareable:"للمشاركة",sweet:"حلو",cheesy:"بالجبن",protein:"بروتين",fresh:"منعش",creamy:"كريمي",coffeePair:"يناسب القهوة",hearty:"مشبع",currentCategory:"الآن",previousCategory:"الفئة السابقة",nextCategory:"الفئة التالية",searchToggle:"بحث",upsellTitle:"توافق مثالي",upsellDesc:"{product} يوازن نكهة القهوة التي اخترتها بشكل جميل.",upsellAdd:"أضف · {price}",upsellDismiss:"ربما لاحقاً"}
    };
    
const I18N_POLISH = {
  tr: {
    editList: "Düzenle",
    waiterMode: "Garsona göster",
    orderItems: "{items} kalem · {qty} adet",
    qtyShort: "adet",
    products: "ürün",
    showList: "Listeyi göster",
    clearList: "Listeyi temizle",
    copyText: "Garsona göster",
    sumText: "Toplam",
    note: "Not",
    noteLabel: "Garsona not",
    close: "Kapat",
    searchToggle: "Ara",
    themeStudioKicker: "Theme Studio",
    themeStudioTitle: "Mekân atmosferini seç",
    themeStudioDesc: "Bu alan müşteriye değil, işletme sahibine sunum için tasarlandı. Canlı modda seçilen tema sabitlenir.",
    classicThemes: "Klasik Temalar",
    premiumConcepts: "Premium Konseptler",
    medLatinThemes: "Akdeniz & Latin",
    closeTheme: "Tema panelini kapat",
    finalThemeSet: "Final Tema Seti",
    demoMode: "Demo Mode",
    demoModeDesc: "İşletme sunumu aktif",
    livePreview: "Canlı önizleme",
    demoPreview: "Demo önizleme",
    liveMode: "Canlı Mod",
    modePanel: "Gösterge Paneli",
    switchToDemo: "Demoya geç",
    switchToLive: "Canlıya geç"
  },
  en: {
    editList: "Edit",
    waiterMode: "Show waiter",
    orderItems: "{items} items · {qty} pcs",
    qtyShort: "pcs",
    products: "items",
    showList: "Show list",
    clearList: "Clear list",
    copyText: "Show waiter",
    sumText: "Total",
    note: "Note",
    noteLabel: "Note for waiter",
    close: "Close",
    searchToggle: "Search",
    finalThemeSet: "Final Theme Set",
    demoMode: "Demo Mode",
    demoModeDesc: "Venue presentation active",
    livePreview: "Live preview",
    demoPreview: "Demo preview",
    liveMode: "Live Mode",
    modePanel: "Control Panel",
    switchToDemo: "Switch to demo",
    switchToLive: "Switch to live"
  },
  ru: {
    editList: "Изменить",
    waiterMode: "Показать официанту",
    orderItems: "{items} поз. · {qty} шт.",
    qtyShort: "шт.",
    products: "поз.",
    showList: "Показать список",
    clearList: "Очистить",
    copyText: "Показать официанту",
    sumText: "Итого",
    note: "Примечание",
    noteLabel: "Примечание официанту",
    close: "Закрыть",
    searchToggle: "Поиск",
    finalThemeSet: "Финальный набор тем",
    demoMode: "Демо-режим",
    demoModeDesc: "Активна презентация заведения",
    livePreview: "Live-просмотр",
    demoPreview: "Демо-просмотр",
    liveMode: "Live-режим",
    modePanel: "Панель управления",
    switchToDemo: "Переключить на демо",
    switchToLive: "Переключить на live"
  },
  ar: {
    editList: "تعديل",
    waiterMode: "اعرض للنادل",
    orderItems: "{items} أصناف · {qty} قطع",
    qtyShort: "قطع",
    products: "أصناف",
    showList: "عرض القائمة",
    clearList: "مسح القائمة",
    copyText: "اعرض للنادل",
    sumText: "الإجمالي",
    note: "ملاحظة",
    noteLabel: "ملاحظة للنادل",
    close: "إغلاق",
    searchToggle: "بحث",
    finalThemeSet: "مجموعة الثيمات النهائية",
    demoMode: "وضع العرض",
    demoModeDesc: "عرض المكان مفعل",
    livePreview: "معاينة التشغيل",
    demoPreview: "معاينة العرض",
    liveMode: "الوضع المباشر",
    modePanel: "لوحة التحكم",
    switchToDemo: "الانتقال إلى العرض",
    switchToLive: "الانتقال إلى المباشر"
  }
};

function applyI18nPolish() {
  Object.entries(I18N_POLISH).forEach(([lang, values]) => {
    if (!i18n[lang]) i18n[lang] = {};
    Object.assign(i18n[lang], values);
  });
}

applyI18nPolish();


    const themes=[
  {id:"light",name:"Modern Light",desc:"Aydınlık, ferah ve güvenli butik kafe görünümü",group:"Final Tema Seti",tag:"Cafe",colors:["#fffaf4","#a86e37","#2f725f"],text:"#211914",bg:"linear-gradient(135deg,#fffaf4,#e9d7c2,#a86e37)"},
  {id:"espresso",name:"Espresso",desc:"Kahve odaklı mekanlar için sıcak ve kavruk premium tonlar",group:"Final Tema Seti",tag:"Coffee",colors:["#22160f","#f0b15f","#ffd49a"],text:"#fff3df",bg:"linear-gradient(135deg,#22160f,#5a311b,#f0b15f)"},
  {id:"noir-jazz",name:"Noir Jazz Club",desc:"Bar, lounge ve akşam konsepti için kadife koyu atmosfer",group:"Final Tema Seti",tag:"Bar",colors:["#090b12","#7a2236","#d6a04f"],text:"#f6ebdc",bg:"linear-gradient(135deg,#090b12,#7a2236,#d6a04f)"},
  {id:"velvet-patisserie",name:"Velvet Patisserie",desc:"Tatlıcı, pastane ve kahve-tatlı işletmeleri için zarif vitrin hissi",group:"Final Tema Seti",tag:"Sweet",colors:["#fff6f7","#b56a7b","#c99755"],text:"#fff9f4",bg:"linear-gradient(135deg,#fff6f7,#b56a7b,#c99755)"},
  {id:"aegean-taverna",name:"Aegean Taverna",desc:"Yunan, Akdeniz ve yazlık mekanlar için beyaz taş ve Ege mavisi",group:"Final Tema Seti",tag:"Greek",colors:["#fffdf6","#1b78b0","#d6a64e"],text:"#fffdf6",bg:"linear-gradient(135deg,#fffdf6,#1b78b0,#d6a64e)"},
  {id:"cyber-luxe",name:"Cyber Luxe",desc:"Yeni nesil lounge ve modern barlar için grafit, cam ve teknoloji lüksü",group:"Final Tema Seti",tag:"Luxe",colors:["#070a10","#58d4ff","#7f5cff"],text:"#edf7ff",bg:"linear-gradient(135deg,#070a10,#58d4ff,#7f5cff)"}
];

const THEME_I18N = {
  light: {
    desc: {tr:"Aydınlık, ferah ve güvenli butik kafe görünümü", en:"Bright, airy and reliable boutique café look", ru:"Светлый, воздушный и надежный стиль бутик-кафе", ar:"مظهر مقهى بوتيكي مشرق ومنعش وآمن"},
    tag: {tr:"Kafe", en:"Cafe", ru:"Кафе", ar:"مقهى"}
  },
  espresso: {
    desc: {tr:"Kahve odaklı mekanlar için sıcak ve kavruk premium tonlar", en:"Warm roasted premium tones for coffee-focused venues", ru:"Теплые обжаренные премиальные тона для кофейных заведений", ar:"درجات دافئة محمصة وفاخرة للمقاهي المتخصصة بالقهوة"},
    tag: {tr:"Kahve", en:"Coffee", ru:"Кофе", ar:"قهوة"}
  },
  "noir-jazz": {
    desc: {tr:"Bar, lounge ve akşam konsepti için kadife koyu atmosfer", en:"Velvet dark atmosphere for bars, lounges and evening concepts", ru:"Бархатная темная атмосфера для баров, лаунжей и вечерних концептов", ar:"أجواء داكنة مخملية للبارات واللاونج والمفاهيم المسائية"},
    tag: {tr:"Bar", en:"Bar", ru:"Бар", ar:"بار"}
  },
  "velvet-patisserie": {
    desc: {tr:"Tatlıcı, pastane ve kahve-tatlı işletmeleri için zarif vitrin hissi", en:"Elegant display-window feel for patisseries and coffee-dessert venues", ru:"Элегантная витринная атмосфера для кондитерских и кофе-десертных заведений", ar:"إحساس واجهة عرض أنيقة لمحلات الحلويات والقهوة"},
    tag: {tr:"Tatlı", en:"Sweet", ru:"Сладкое", ar:"حلو"}
  },
  "aegean-taverna": {
    desc: {tr:"Yunan, Akdeniz ve yazlık mekanlar için beyaz taş ve Ege mavisi", en:"White stone and Aegean blue for Greek, Mediterranean and summer venues", ru:"Белый камень и эгейская синева для греческих, средиземноморских и летних заведений", ar:"حجر أبيض وأزرق إيجي للأماكن اليونانية والمتوسطية والصيفية"},
    tag: {tr:"Yunan", en:"Greek", ru:"Греция", ar:"يوناني"}
  },
  "cyber-luxe": {
    desc: {tr:"Yeni nesil lounge ve modern barlar için grafit, cam ve teknoloji lüksü", en:"Graphite, glass and tech luxury for next-gen lounges and modern bars", ru:"Графит, стекло и технологичная роскошь для современных баров и лаунжей", ar:"جرافيت وزجاج وفخامة تقنية للاونجات والبارات الحديثة"}
    ,tag: {tr:"Lüks", en:"Luxe", ru:"Люкс", ar:"فاخر"}
  }
};

function localizedThemeValue(theme, key) {
  const value = THEME_I18N[theme.id]?.[key];
  if (value && typeof value === "object") return value[S.lang] || value.tr || "";
  return theme[key] || "";
}

function localizedThemeGroup(group) {
  const map = {
    "Final Tema Seti": T("finalThemeSet"),
    "Klasik Temalar": T("classicThemes"),
    "Premium Konseptler": T("premiumConcepts"),
    "Akdeniz & Latin": T("medLatinThemes")
  };
  return map[group] || group;
}


    const langs=[["tr","TR","Türkçe","Menüyü Türkçe görüntüle"],["en","EN","English","Browse menu in English"],["ru","RU","Русский","Смотреть меню на русском"],["ar","AR","العربية","عرض القائمة بالعربية"]];
    const filters=[["all","fa-border-all",p=>true],["favorites","fa-heart",p=>!!S.favorites[p.id]],["popular","fa-fire",p=>p.isFeatured||loc(p.badge).toLowerCase().includes("popüler")],["signature","fa-star",p=>p.isSignature],["cold","fa-snowflake",p=>loc(p.tags).some(x=>norm(x).includes("soğuk")||norm(x).includes("cold"))],["vegetarian","fa-leaf",p=>loc(p.tags).some(x=>norm(x).includes("vejetaryen")||norm(x).includes("vegetarian")||norm(x).includes("vegan"))],["spicy","fa-pepper-hot",p=>loc(p.tags).some(x=>norm(x).includes("baharat")||norm(x).includes("spicy"))]];

const upsellConfig = {
  triggerCategoryId: "coffee",
  dessertCategoryId: "desserts",
  preferredDesserts: ["san-sebastian", "tiramisu", "brownie", "lemon-tart"],
  dismissedKey: "upsell:coffee-dessert:dismissed",
  acceptedKey: "upsell:coffee-dessert:accepted",
  autoHideMs: 9000
};

let upsellTimer = null;

function pickDessertUpsell() {
  return upsellConfig.preferredDesserts
    .map(id => find(id))
    .find(product => product && product.isAvailable && !S.cart[product.id]);
}

function cartHasDessert() {
  return cartItems().some(item => item.product.catId === upsellConfig.dessertCategoryId);
}

function isUpsellBlocked() {
  return (
    SafeSession.get(upsellConfig.dismissedKey) === "1" ||
    SafeSession.get(upsellConfig.acceptedKey) === "1"
  );
}

function maybeShowCoffeeDessertUpsell(addedProduct) {
  if (!cfg("enableUpsell", true)) return;
  if (!addedProduct) return;
  if (addedProduct.catId !== upsellConfig.triggerCategoryId) return;
  if (isUpsellBlocked()) return;
  if (cartHasDessert()) return;

  if (
    document.body.classList.contains("sheet-open") ||
    document.body.classList.contains("detail-open") ||
    document.body.classList.contains("lang-open")
  ) {
    return;
  }

  const dessert = pickDessertUpsell();
  if (!dessert) return;

  showUpsell(dessert);
}

function showUpsell(product) {
  const el = $("upsell");
  if (!el) return;

  $("upsellTitle").textContent = T("upsellTitle");
  $("upsellDesc").textContent = T("upsellDesc", { product: loc(product.name) });
  $("upsellAdd").textContent = T("upsellAdd", { price: money(product.price) });
  $("upsellDismiss").textContent = T("upsellDismiss");

  const img = $("upsellImg");
  if (img) img.style.backgroundImage = `url("${product.image}")`;

  el.dataset.productId = product.id;
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");

  clearTimeout(upsellTimer);
  upsellTimer = setTimeout(hideUpsell, upsellConfig.autoHideMs);
}

function hideUpsell() {
  const el = $("upsell");
  if (!el) return;

  if (el.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  el.classList.remove("show");
  el.setAttribute("aria-hidden", "true");
  el.dataset.productId = "";
  clearTimeout(upsellTimer);
}

function setupUpsell() {
  const addButton = $("upsellAdd");
  const dismissButton = $("upsellDismiss");

  if (addButton) {
    addButton.addEventListener("click", () => {
      const el = $("upsell");
      const productId = el && el.dataset ? el.dataset.productId : null;
      if (!productId) return;

      SafeSession.set(upsellConfig.acceptedKey, "1");
      if (document.activeElement) document.activeElement.blur();
      hideUpsell();
      add(productId);
    });
  }

  if (dismissButton) {
    dismissButton.addEventListener("click", () => {
      SafeSession.set(upsellConfig.dismissedKey, "1");
      if (document.activeElement) document.activeElement.blur();
      hideUpsell();
    });
  }
}

function refreshUpsellCopy() {
  const el = $("upsell");
  if (!el || !el.classList.contains("show")) return;
  const productId = el.dataset.productId;
  const product = productId ? find(productId) : null;
  if (product) showUpsell(product);
}


    const S={lang:storage.migrateLegacyString("quppa-language","language",""),theme:storage.migrateLegacyString("quppa-theme","theme",BRAND_CONFIG.defaultTheme||"light"),q:"",filter:"all",active:menuData[0].id,cart:storage.migrateLegacyJSON("quppa-cart","cart",{}),favorites:storage.migrateLegacyJSON("quppa-favorites","favorites",{}),note:storage.migrateLegacyString("quppa-note","note",""),timer:null,obs:null,detail:null,waiterView:false};
function normalizeSavedThemeId(){
  const allowedThemes=new Set(themes.map(t=>t.id));
  const legacyMap={
    neon:"cyber-luxe",
    cyber:"cyber-luxe",
    dark:"noir-jazz",
    retro:"espresso",
    minimal:"light",
    "kyoto-matcha":"espresso",
    "riviera-aperitivo":"aegean-taverna",
    "bauhaus-pop":"light",
    "latin-cantina":"aegean-taverna"
  };

  if(!allowedThemes.has(S.theme)){
    S.theme=legacyMap[S.theme]||cfg("liveTheme","espresso")||"light";
    if(!allowedThemes.has(S.theme)) S.theme="light";
    storage.set("theme",S.theme);
  }
}
normalizeSavedThemeId();


    const $=id=>document.getElementById(id), T=(k,v={})=>{
      const pack=(i18n[S.lang]||i18n.tr||{});
      const tr=(i18n.tr||{});
      const fallback={
        editList:"Düzenle",
        waiterMode:"Garsona göster",
        orderItems:"{items} kalem · {qty} adet",
        qtyShort:"adet",
        products:"ürün",
        showList:"Listeyi göster",
        clearList:"Listeyi temizle",
        copyText:"Garsona göster",
        sumText:"Toplam",
        note:"Not",
        noteLabel:"Garsona not",
        close:"Kapat",
        searchToggle:"Ara"
      };
      const raw=pack[k]||tr[k]||fallback[k]||"";
      return Object.entries(v).reduce((a,[x,y])=>a.replaceAll("{"+x+"}",y), String(raw));
    }, loc=o=>o&&typeof o==="object"?(o[S.lang]||o.tr||Object.values(o)[0]):(o||"");
    function save(){storage.setJSON("cart",S.cart)}
    function money(n){return new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(n)}function norm(x){return String(x||"").toLocaleLowerCase(S.lang==="tr"?"tr-TR":undefined).normalize("NFD").replace(/[\u0300-\u036f]/g,"")}

    function saveFavs(){storage.setJSON("favorites",S.favorites)}
    function isFav(id){return !!S.favorites[id]}
    function toggleFav(id){
      if(!cfg("enableFavorites", true)) return;
      const product=find(id); if(!product) return;
      if(isFav(id)){ delete S.favorites[id]; saveFavs(); renderFavoriteMutation(id); toast(T("unfavorited"),T("unfavoritedText")); }
      else { S.favorites[id]=1; saveFavs(); renderFavoriteMutation(id); toast(T("favorited"),T("favoritedText")); }
    }
    function labelFromIcon(icon){
      const map={
        "fa-snowflake":T("cold"),
        "fa-leaf":T("vegetarian"),
        "fa-pepper-hot":T("spicy"),
        "fa-people-group":T("shareable"),
        "fa-cookie-bite":T("sweet"),
        "fa-cheese":T("cheesy"),
        "fa-drumstick-bite":T("protein"),
        "fa-droplet":T("creamy"),
        "fa-lemon":T("fresh"),
        "fa-mug-hot":T("coffeePair"),
        "fa-burger":T("hearty"),
        "fa-fire":T("spicy")
      };
      return map[icon]||"";
    }
    function toneFromIcon(icon){
      if(icon==="fa-circle-xmark") return "danger";
      if(icon==="fa-star") return "accent";
      if(icon==="fa-fire") return "warm";
      if(icon==="fa-snowflake"||icon==="fa-droplet") return "cool";
      if(icon==="fa-leaf") return "success";
      if(icon==="fa-pepper-hot") return "danger";
      if(icon==="fa-cookie-bite"||icon==="fa-cheese"||icon==="fa-mug-hot"||icon==="fa-bread-slice"||icon==="fa-burger") return "warm";
      if(icon==="fa-drumstick-bite") return "accent";
      return "soft";
    }
    function metaItems(product){
      const out=[], seen=new Set();
      const push=(icon,label,tone)=>{
        const key=icon+"|"+label;
        if(!icon||!label||seen.has(key)) return;
        seen.add(key);
        out.push({icon,label,tone:tone||toneFromIcon(icon)});
      };
      if(!product.isAvailable){ push("fa-circle-xmark",T("sold"),"danger"); }
      else{
        if(product.isSignature) push("fa-star",T("signature"),"accent");
        if(product.isFeatured) push("fa-fire",T("popular"),"warm");
      }
      (product.icons||[]).forEach(icon=>{
        const label=labelFromIcon(icon);
        if(label) push(icon,label,toneFromIcon(icon));
      });
      return out;
    }
    function renderMenuFlags(product){
      return metaItems(product).slice(0,4).map(item=>`<span class="icon-badge tone-${item.tone}" title="${item.label}" aria-label="${item.label}"><i class="fa-solid ${item.icon}"></i></span>`).join("");
    }
    function renderDetailFlags(product){
      return metaItems(product).map(item=>`<span class="dtag tone-${item.tone}"><i class="fa-solid ${item.icon}"></i>${item.label}</span>`).join("");
    }

    let productIndex = new Map();

function rebuildProductIndex() {
  productIndex = createProductIndex(menuData);
}

rebuildProductIndex();

function all(){return Array.from(productIndex.values()).map(product=>({...product,catName:loc(getCategoryById(product.catId)?.name||product.catName)}))}
function find(id){return productIndex.get(id)}
    function match(p){let text=[loc(p.name),loc(p.desc),loc(p.detail),loc(p.badge),...loc(p.tags)].join(" ");let f=filters.find(x=>x[0]===S.filter)||filters[0];return (!S.q||norm(text).includes(norm(S.q)))&&f[2](p)}

    function activeCategoryList(){
      return getFilteredCats().length ? getFilteredCats() : menuData;
    }
    function centerInScroll(el){
      if(!el || !el.parentElement) return;
      const parent=el.parentElement.closest(".catnav,.filters") || el.parentElement;
      const left=el.offsetLeft - (parent.clientWidth/2) + (el.clientWidth/2);
      parent.scrollTo({left:Math.max(0,left), behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});
    }
    function renderSwitcher(){
      const host=$("catSwitch");
      if(!host) return;
      const cats=activeCategoryList();
      const idx=Math.max(0,cats.findIndex(c=>c.id===S.active));
      const prev=cats[idx-1], cur=cats[idx]||cats[0], next=cats[idx+1];
      if(!cur){host.innerHTML="";return;}
      host.innerHTML=`<div class="catSwitchInner">
        <button class="catSwitchBtn" ${prev?"":'disabled'} data-switch-cat="${prev?prev.id:""}" aria-label="${T("previousCategory")}">
          <i class="fa-solid fa-chevron-left"></i><span>${prev?loc(prev.name):""}</span>
        </button>
        <div class="catSwitchCurrent"><small>${T("currentCategory")}</small><strong>${loc(cur.name)}</strong></div>
        <button class="catSwitchBtn" ${next?"":'disabled'} data-switch-cat="${next?next.id:""}" aria-label="${T("nextCategory")}">
          <span>${next?loc(next.name):""}</span><i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>`;
      host.querySelectorAll("[data-switch-cat]").forEach(b=>b.onclick=()=>{if(b.dataset.switchCat)scrollCat(b.dataset.switchCat)});
    }

    function cartItems(){return Object.entries(S.cart).map(([id,q])=>({product:find(id),q})).filter(x=>x.product&&x.q>0)}function summary(){return cartItems().reduce((s,x)=>(s.q+=x.q,s.total+=x.q*Number(x.product.price||0),s.lines++,s),{q:0,total:0,lines:0})}
    function groups(){let items=cartItems();return menuData.map(c=>{let gi=items.filter(x=>x.product.catId===c.id),total=gi.reduce((a,x)=>a+Number(x.product.price||0)*x.q,0),q=gi.reduce((a,x)=>a+x.q,0);return{id:c.id,name:loc(c.name),icon:c.icon,items:gi,total,q}}).filter(g=>g.items.length)}

function orderSummaryText(summary) {
  const lang = S && S.lang ? S.lang : "tr";
  const items = Number(summary.lines || summary.i || 0);
  const qty = Number(summary.q || 0);

  const template = T("orderItems");
  if (template) {
    return T("orderItems", { items, qty });
  }

  const fallback = {
    tr: `${items} kalem · ${qty} adet`,
    en: `${items} items · ${qty} pcs`,
    ru: `${items} поз. · ${qty} шт.`,
    ar: `${items} أصناف · ${qty} قطع`
  };

  return fallback[lang] || fallback.tr;
}

    function setLang(l,close=false){S.lang=i18n[l]?l:"tr";storage.set("language",S.lang);document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==="ar"?"rtl":"ltr";applyTexts();renderAll();if(close)closeLang()}
    
function applyBrandConfig() {
  document.title = `${BRAND_CONFIG.name} QR Menü`;

  const brandStrong = document.querySelector(".brand strong");
  if (brandStrong) brandStrong.textContent = BRAND_CONFIG.name;

  const logo = document.querySelector(".logo");
  if (logo) logo.textContent = BRAND_CONFIG.logoLetter || BRAND_CONFIG.name.charAt(0) || "Q";

  if ($("brandSub")) $("brandSub").textContent = brandText("menuLabel") || "QR Menü";

  const heroTitle = document.querySelector(".hero h1");
  if (heroTitle) heroTitle.textContent = BRAND_CONFIG.name;

  const heroText = document.querySelector(".hero p");
  if (heroText) heroText.textContent = brandText("slogan");

  document.querySelectorAll("[data-wifi-name]").forEach(el => {
    el.textContent = BRAND_CONFIG.wifiName;
  });

  document.querySelectorAll("[data-wifi-pass]").forEach(el => {
    el.textContent = BRAND_CONFIG.wifiPassword;
  });

  document.querySelectorAll("[data-instagram]").forEach(el => {
    el.textContent = BRAND_CONFIG.instagram;
  });

  document.body.classList.toggle("is-demo", isDemoMode());
  document.body.classList.toggle("is-live", isLiveMode());
  document.body.classList.toggle("demo-badge-off", !cfg("showDemoBadge", true));

  if (isLiveMode() && cfg("liveLocksTheme", true)) {
    const lockedTheme = cfg("liveTheme", BRAND_CONFIG.defaultTheme || "light");
    if (S.theme !== lockedTheme) {
      S.theme = lockedTheme;
      storage.set("theme", S.theme);
      document.documentElement.dataset.theme = S.theme;
    }
  }
  document.body.classList.toggle("theme-switcher-off", !APP_CONFIG.showThemeSwitcher);
  document.body.classList.toggle("featured-off", !APP_CONFIG.showFeatured);
  document.body.classList.toggle("today-suggestion-off", !APP_CONFIG.showTodaySuggestion);
  document.body.classList.toggle("favorites-off", !APP_CONFIG.enableFavorites);
}





function syncPresentationSurface(){
  const presenterPanel=isPresenterPanelEnabled();
  document.body.classList.toggle("presenter-panel-off", !presenterPanel);
  document.body.classList.toggle("customer-live-ui", isLiveMode() && !presenterPanel);
}

function syncModeVisibility(){
  const live=isLiveMode();
  const themeBox=document.querySelector(".themebox");
  if(themeBox){
    themeBox.toggleAttribute("hidden", live || !cfg("showThemeSwitcher",true));
  }
  document.body.classList.toggle("theme-switcher-off", live || !cfg("showThemeSwitcher",true));
}


function getUrlFlag(name) {
  try {
    const value = new URLSearchParams(window.location.search).get(name);
    return value;
  } catch {
    return null;
  }
}

function isPresenterPanelEnabled() {
  const panel = getUrlFlag("panel");
  const presenter = getUrlFlag("presenter");
  const ui = getUrlFlag("ui");

  if (panel === "off" || panel === "0") return false;
  if (presenter === "0" || presenter === "false") return false;
  if (ui === "customer" || ui === "live") return false;

  return cfg("showDemoBadge", true);
}

function buildModeUrl(nextMode) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `?mode=${nextMode}`;
  }
}

function renderModeBadge(){
  syncPresentationSurface();
  syncModeVisibility();
  const badge=$("modeBadge");
  if(!badge) return;

  const enabled = isPresenterPanelEnabled();
  const demo = isDemoMode();
  const nextMode = demo ? "live" : "demo";

  if(!enabled){
    badge.setAttribute("hidden","");
    return;
  }

  badge.removeAttribute("hidden");
  badge.classList.toggle("is-demo", demo);
  badge.classList.toggle("is-live", !demo);

  const currentLabel = demo ? (T("demoMode")||"Demo Mode") : (T("liveMode")||"Live Mode");
  const subLabel = T("modePanel") || "Control Panel";
  const nextLabel = demo ? (T("switchToLive")||"Switch to live") : (T("switchToDemo")||"Switch to demo");
  const nextChip = demo ? (T("livePreview")||"Live preview") : (T("demoPreview")||"Demo preview");

  if($("modeBadgeTitle")) $("modeBadgeTitle").textContent=currentLabel;
  if($("modeBadgeSub")) $("modeBadgeSub").textContent=subLabel;
  if($("modeBadgeState")) $("modeBadgeState").textContent=demo ? "→ LIVE" : "→ DEMO";

  badge.href = buildModeUrl(nextMode);
  badge.title = nextLabel;
  badge.setAttribute("aria-label", nextLabel);
}

function applyTexts(){renderModeBadge();["brandSub","heroKicker","featuredTitle"].forEach(id=>{const el=$(id);if(el)el.textContent=T(id)});if($("heroDesc"))$("heroDesc").textContent=T("heroDesc");if($("todayLabel"))$("todayLabel").textContent=T("todayLabel");if($("todayText"))$("todayText").textContent=T("todayText");if($("featuredDesc"))$("featuredDesc").textContent=T("featuredDesc");if($("searchInput"))$("searchInput").placeholder=T("search");if($("searchToggleText"))if($("searchToggleText"))$("searchToggleText").textContent=T("searchToggle");if($("themeText"))$("themeText").textContent=T("theme");if($("listText"))$("listText").textContent=T("list");if($("emptyTitle"))$("emptyTitle").textContent=T("emptyTitle");if($("emptyText"))$("emptyText").textContent=T("emptyText");if($("taxText"))$("taxText").textContent=T("tax");if($("wifiText"))$("wifiText").textContent=T("wifi");if($("sheetTitle"))$("sheetTitle").textContent=T("sheetTitle");if($("sheetDesc"))$("sheetDesc").textContent=T("sheetDesc");if($("cartEmptyTitle"))$("cartEmptyTitle").textContent=T("emptyCartTitle");if($("cartEmptyText"))$("cartEmptyText").textContent=T("emptyCartText");if($("noteLabel"))$("noteLabel").textContent=T("noteLabel")||T("note");if($("note"))$("note").placeholder=T("notePh");if($("copyText"))$("copyText").textContent=T("waiterMode")||T("copyText")||T("copy");if($("floatTitle"))$("floatTitle").textContent=T("floatTitle",{count:summary().q});if($("floatSub"))$("floatSub").textContent=T("floatSub");if($("clearText"))$("clearText").textContent=T("clearList")||T("clear");$("detailTitle").textContent=T("detailTitle");$("detailSub").textContent=T("detailSub");if($("pickTitle"))$("pickTitle").textContent=T("pickTitle");if($("pickText"))$("pickText").textContent=T("pickText");$("langCode").textContent=T("code")}
    
    function refreshDockSoon(){
      if(typeof setupFixedMenuDock === "function"){
        clearTimeout(window.__dockRefreshTimer);
        window.__dockRefreshTimer=setTimeout(()=>{
          const event=new Event("resize");
          window.dispatchEvent(event);
        },80);
      }
    }

    function renderAll(){renderModeBadge();renderThemes();renderLangs();renderFilters();renderFeatured();renderMenu();renderCart();if(S.detail)renderDetail(S.detail);refreshDockSoon();refreshShellSoon&&refreshShellSoon();refreshUpsellCopy()}
    
function swatch(id){
  const map={
    light:"linear-gradient(135deg,#fff,#d9c3a7)",
    dark:"linear-gradient(135deg,#050505,#444)",
    espresso:"linear-gradient(135deg,#2a160d,#b77a3b)",
    cyber:"linear-gradient(135deg,#05020b,#9e6bff,#00dcff)",
    retro:"linear-gradient(135deg,#efe0bd,#8b4d2f)",
    minimal:"linear-gradient(135deg,#fff,#111)",
    "kyoto-matcha":"linear-gradient(135deg,#f8f1da,#5d7c45,#b79a55)",
    "riviera-aperitivo":"linear-gradient(135deg,#fff7df,#167aa5,#f2a641)",
    "noir-jazz":"linear-gradient(135deg,#090b12,#7a2236,#d6a04f)",
    "bauhaus-pop":"linear-gradient(135deg,#f5efe1 0 25%,#d9342b 25% 50%,#1f69b3 50% 75%,#f2c230 75%)",
    "velvet-patisserie":"linear-gradient(135deg,#fff6f7,#b56a7b,#c99755)",
    "cyber-luxe":"linear-gradient(135deg,#070a10,#58d4ff,#7f5cff)"
  };
  return map[id]||map.light;
}

function renderThemes(){
      const menu=$("themeMenu");
      if(!menu) return;

      if(!cfg("showThemeSwitcher",true)||isLiveMode()){
        menu.innerHTML="";
        menu.classList.remove("open");
        $("themeBack")&&$("themeBack").classList.remove("open");
        document.body.classList.remove("theme-open");
        return;
      }

      if(!cfg("showThemeSwitcher",true)){
        menu.innerHTML="";
        return;
      }

      try{
        const grouped=themes.reduce((acc,t)=>{
          const group=t.group||"Temalar";
          (acc[group]||(acc[group]=[])).push(t);
          return acc;
        },{});

        menu.innerHTML=`
          <div class="themeStudioHead">
            <div>
              <small><i class="fa-solid fa-wand-magic-sparkles"></i>${T("themeStudioKicker")||"Theme Studio"}</small>
              <strong>${T("themeStudioTitle")||"Mekân atmosferini seç"}</strong>
              <span>${T("themeStudioDesc")||""}</span>
            </div>
            <button class="themeClose" type="button" data-close-theme aria-label="${T("closeTheme")||T("close")||"Kapat"}">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          ${Object.entries(grouped).map(([group,items])=>`
            <div class="themeGroup">
              <div class="themeGroupTitle">${localizedThemeGroup(group)}</div>
              <div class="themeGrid">
                ${items.map(t=>`
                  <button class="themeCard ${S.theme===t.id?"active":""}" data-theme="${t.id}" type="button"
                    style="--themeBg:${t.bg};--themeText:${t.text||"#fff"}">
                    <span class="themeCardTop">
                      <span class="themeMini">
                        ${(t.colors||[]).slice(0,3).map(c=>`<i style="--c:${c}"></i>`).join("")}
                      </span>
                      <span class="themeCheck"><i class="fa-solid fa-check"></i></span>
                    </span>
                    <span class="themePill">${localizedThemeValue(t,"tag")||"Theme"}</span>
                    <b>${t.name}</b>
                    <small>${localizedThemeValue(t,"desc")||""}</small>
                  </button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        `;

        menu.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{
          S.theme=b.dataset.theme;
          storage.set("theme",S.theme);
          document.documentElement.dataset.theme=S.theme;
          renderThemes();
          toast(T("theme"),themes.find(t=>t.id===S.theme)?.name||S.theme);
          if(window.__closeThemeStudio) window.__closeThemeStudio();
        });
      }catch(error){
        console.warn("[QUPPA] Tema deneyimi render edilemedi:", error);
      }
    }
    function renderLangs(){$("langs").innerHTML=langs.map(l=>`<button class="lang ${S.lang===l[0]?"active":""}" data-lang="${l[0]}"><span class="flag">${l[1]}</span><span><b>${l[2]}</b><small>${l[3]}</small></span><i class="fa-solid fa-check"></i></button>`).join("");document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>setLang(b.dataset.lang,true))}
    function renderFilters(){let favCount=Object.keys(S.favorites||{}).length;$("filters").innerHTML=filters.map(f=>`<button class="fchip ${S.filter===f[0]?"active":""}" data-filter="${f[0]}"><i class="fa-solid ${f[1]}"></i><span>${T(f[0])}${f[0]==="favorites"&&favCount?` ${favCount}`:""}</span></button>`).join("");document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{S.filter=b.dataset.filter;renderFilters();renderMenu();requestAnimationFrame(()=>centerInScroll(document.querySelector(`[data-filter="${S.filter}"]`)))});requestAnimationFrame(()=>centerInScroll(document.querySelector(`[data-filter="${S.filter}"]`)))}
    function renderCats(cats=menuData){$("catList").innerHTML=cats.map(c=>`<button class="cat ${S.active===c.id?"active":""}" data-cat="${c.id}"><i class="fa-solid ${c.icon}"></i><span>${loc(c.name)}</span></button>`).join("");document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>scrollCat(b.dataset.cat));renderSwitcher();requestAnimationFrame(()=>centerInScroll(document.querySelector(`[data-cat="${S.active}"]`)))}
    function renderFeatured(){
      const featuredItems = menuData.flatMap(cat =>
        cat.products
          .filter(p=>p.isFeatured && p.isAvailable)
          .map(p=>({ ...p, _catName: loc(cat.name), _catIcon: cat.icon }))
      );

      $("featured").innerHTML = featuredItems.map(p=>{
        const fav = isFav(p.id);
        const q = S.cart[p.id] || 0;
        const desc = loc(p.desc);
        const badgeText = p.isSignature ? (loc(p.badge) || "Signature") : (loc(p.badge) || p._catName);
        const iconChips = (p.icons || []).slice(0,2).map(icon =>
          `<span class="fmini"><i class="fa-solid ${icon}"></i></span>`
        ).join("");

        return `<article class="fcard premium" data-detail="${p.id}">
          <div class="fmedia">
            <img src="${p.image}" alt="${loc(p.name)}" width="900" height="600" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.classList.add('broken')">
            <div class="foverlay">
              <div class="feyebrow">
                <span class="fcat"><i class="fa-solid ${p._catIcon}"></i>${p._catName}</span>
                <span class="fmark">${badgeText}</span>
              </div>
            </div>
          </div>

          <div class="fcontent">
            <div class="ftext">
              <div class="ftopline">${iconChips}<span class="fdot"></span><small>${p.isSignature ? "QUPPA Select" : "Featured Pick"}</small></div>
              <h3 class="ftitle">${loc(p.name)}</h3>
              <p class="fdesc">${desc}</p>
            </div>

            <div class="fbottom">
              <div class="fpriceBlock">
                <small>${T("price") || "Price"}</small>
                <b>${money(p.price)}</b>
              </div>
              <div class="factions">
                <button class="favbtn round ${fav?'active':''}" data-fav="${p.id}" title="${T("favorite")}" aria-label="${T("favorite")}"><i class="fa-${fav?'solid':'regular'} fa-heart"></i></button>
                ${control(p,q)}
              </div>
            </div>
          </div>
        </article>`;
      }).join("");
      bind()
    }
    function renderMenu(){let cats=menuData.map(c=>({...c,products:c.products.filter(match)})).filter(c=>c.products.length);$("empty").classList.toggle("show",!cats.length);if(!cats.length){$("menu").innerHTML="";renderCats(menuData);renderSwitcher();return}if(!cats.some(c=>c.id===S.active))S.active=cats[0].id;$("menu").innerHTML=cats.map(c=>`<article class="section" id="${c.id}" data-sec="${c.id}"><div class="sectionTop"><div><div class="kcat"><i class="fa-solid ${c.icon}"></i> ${loc(c.name)}</div><h2>${loc(c.name)}</h2><p>${loc(c.desc)}</p></div><span class="cnt">${c.products.length} ${T("products")}</span></div><div class="grid">${c.products.map((p,i)=>card(p,c.icon,i)).join("")}</div></article>`).join("");renderCats(cats);bind();spy()}
    function card(p,catIcon,i){let q=S.cart[p.id]||0,fav=isFav(p.id);return`<article class="card ${p.isAvailable?"":"off"}" data-detail="${p.id}" style="animation-delay:${Math.min(i*42,180)}ms"><div class="pic"><img src="${p.image}" alt="${loc(p.name)}" width="900" height="600" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('err')"><div class="fallback"><i class="fa-solid ${catIcon}"></i></div></div><div class="content"><div><div class="titleRow"><h3 class="title">${loc(p.name)}</h3><button class="favbtn ${fav?"active":""}" data-fav="${p.id}" title="${T("favorite")}" aria-label="${T("favorite")}"><i class="fa-${fav?"solid":"regular"} fa-heart"></i></button></div><div class="flags">${renderMenuFlags(p)}</div></div><p class="desc">${loc(p.desc)}</p><div class="bottom"><div class="price">${money(p.price)}</div>${control(p,q)}</div></div></article>`}
    function control(p,q){if(!p.isAvailable)return`<button class="add" disabled><i class="fa-solid fa-plus"></i></button>`;return q>0?`<div class="qtyInline"><button data-dec="${p.id}"><i class="fa-solid fa-minus"></i></button><strong>${q}</strong><button data-inc="${p.id}"><i class="fa-solid fa-plus"></i></button></div>`:`<button class="add" data-add="${p.id}"><i class="fa-solid fa-plus"></i></button>`}
    function bind(){document.querySelectorAll("[data-add]").forEach(b=>b.onclick=e=>{e.stopPropagation();add(b.dataset.add)});document.querySelectorAll("[data-inc]").forEach(b=>b.onclick=e=>{e.stopPropagation();setQ(b.dataset.inc,(S.cart[b.dataset.inc]||0)+1)});document.querySelectorAll("[data-dec]").forEach(b=>b.onclick=e=>{e.stopPropagation();setQ(b.dataset.dec,(S.cart[b.dataset.dec]||0)-1)});document.querySelectorAll("[data-detail]").forEach(b=>b.onclick=e=>{e.stopPropagation();openDetail(b.dataset.detail)});document.querySelectorAll("[data-fav]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(b.dataset.fav)})}

    function safeSelectorId(id){
      return window.CSS && CSS.escape ? CSS.escape(id) : String(id).replace(/"/g,'\\"');
    }
    function renderProductState(id){
      const p=find(id);
      if(!p) return;

      const q=S.cart[id]||0;
      const fav=isFav(id);
      document.querySelectorAll(`article.card[data-detail="${safeSelectorId(id)}"], article.fcard[data-detail="${safeSelectorId(id)}"]`).forEach(cardEl=>{
        const bottom=cardEl.querySelector(".bottom");
        if(bottom) bottom.innerHTML=`<div class="price">${money(p.price)}</div>${control(p,q)}`;

        const fActions=cardEl.querySelector(".factions");
        if(fActions){
          const favBtnHtml=`<button class="favbtn round ${fav?'active':''}" data-fav="${p.id}" title="${T("favorite")}" aria-label="${T("favorite")}"><i class="fa-${fav?'solid':'regular'} fa-heart"></i></button>`;
          fActions.innerHTML=`${favBtnHtml}${control(p,q)}`;
        }

        const favBtn=cardEl.querySelector(`[data-fav="${safeSelectorId(id)}"]`);
        if(favBtn){
          favBtn.classList.toggle("active",fav);
          favBtn.innerHTML=`<i class="fa-${fav?"solid":"regular"} fa-heart"></i>`;
          favBtn.title=T("favorite");
          favBtn.setAttribute("aria-label",T("favorite"));
        }
      });

      const detailAdd=$("detailAdd");
      if(S.detail===id && detailAdd){
        detailAdd.innerHTML=control(p,q);
      }

      bind();
    }
    function renderCartSurfaces(){
      renderCart();
      refreshDockSoon();
      refreshShellSoon&&refreshShellSoon();
      refreshUpsellCopy();
    }
    function renderCartMutation(id){
      renderProductState(id);
      renderCartSurfaces();
    }
    function renderFavoriteMutation(id){
      if(S.filter==="favorites"){
        renderMenu();
        renderCartSurfaces();
        return;
      }
      renderProductState(id);
      renderCartSurfaces();
    }

    
function preserveScrollOnWide(fn) {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  fn();
  if (window.innerWidth > 900) requestAnimationFrame(()=>window.scrollTo(0, y));
}

    function add(id){let p=find(id);if(!p||!p.isAvailable)return;S.cart[id]=(S.cart[id]||0)+1;save();preserveScrollOnWide(()=>renderCartMutation(id));toast(T("added",{name:loc(p.name)}),T("addedText"));maybeShowCoffeeDessertUpsell(p)}
    function setQ(id,q){q=Math.max(0,q);q?S.cart[id]=q:delete S.cart[id];save();preserveScrollOnWide(()=>renderCartMutation(id))}
    function remove(id){let p=find(id);delete S.cart[id];save();preserveScrollOnWide(()=>renderCartMutation(id));toast(T("removed"),T("removedText",{name:p?loc(p.name):""}))}
    function clearCart(){const ids=Object.keys(S.cart);S.cart={};S.waiterView=false;save();ids.forEach(renderProductState);renderCartSurfaces();toast(T("cleared"),T("clearedText"))}
    
function scrollOrderSheetToTop(){
  requestAnimationFrame(()=>{
    const sheetBody=$("sheetBody") || document.querySelector(".sheetBody");
    const sheet=$("sheet") || document.querySelector(".sheet");
    const accord=$("cartAccord");

    if(sheetBody) sheetBody.scrollTo({top:0, left:0, behavior:"auto"});
    if(sheet) sheet.scrollTo({top:0, left:0, behavior:"auto"});
    if(accord) accord.scrollIntoView({block:"start", inline:"nearest", behavior:"auto"});
  });
}



function mergePlainConfig(target, incoming, allowedKeys = null) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return false;

  Object.entries(incoming).forEach(([key, value]) => {
    if (allowedKeys && !allowedKeys.has(key)) return;
    if (value === undefined || value === null) return;

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      target[key] = { ...target[key], ...value };
    } else {
      target[key] = value;
    }
  });

  return true;
}

function normalizeBrandJson(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  if (raw.brand || raw.app) {
    return {
      brand: raw.brand || null,
      app: raw.app || null
    };
  }

  return {
    brand: raw,
    app: null
  };
}

async function loadExternalBrandConfig(){
  if(!cfg("enableExternalBrand", true)) return false;

  const path = cfg("brandPath", "./brand.json");
  let url;

  try {
    url = new URL(path, window.location.href);
    url.searchParams.set("v", APP_VERSION);
  } catch {
    url = { href: `${path}?v=${APP_VERSION}` };
  }

  try {
    const response = await fetch(url.href, { cache: "no-cache" });
    if(!response.ok) throw new Error(`brand.json yüklenemedi: ${response.status}`);

    const raw = await response.json();
    const normalized = normalizeBrandJson(raw);
    if(!normalized) throw new Error("brand.json boş veya geçersiz.");

    const appKeys = new Set(Object.keys(APP_CONFIG));
    mergePlainConfig(BRAND_CONFIG, normalized.brand);
    mergePlainConfig(APP_CONFIG, normalized.app, appKeys);

    applyRuntimeConfig();
    normalizeSavedThemeId();
    applyBrandConfig();
    applyTexts();
    renderThemes();
    renderModeBadge();

    console.info("[QUPPA] External brand config loaded:", path);
    return true;
  } catch(error) {
    if(isDemoMode()){
      console.info("[QUPPA] brand.json kullanılamadı, gömülü config ile devam ediliyor:", error.message || error);
    }
    return false;
  }
}

async function loadExternalMenuData(){
  if(!cfg("enableExternalMenu", true)) return false;

  const path = cfg("menuPath", "./menu.json");
  let url;

  try {
    url = new URL(path, window.location.href);
    url.searchParams.set("v", APP_VERSION);
  } catch {
    url = { href: `${path}?v=${APP_VERSION}` };
  }

  try {
    const response = await fetch(url.href, { cache: "no-cache" });
    if(!response.ok) throw new Error(`menu.json yüklenemedi: ${response.status}`);

    const raw = await response.json();
    const normalized = normalizeMenuData(raw);

    if(!normalized.length) throw new Error("menu.json boş veya geçersiz.");

    const warnings = validateMenuData(normalized);
    menuData = normalized;
    rebuildProductIndex();

    if(!menuData.some(category => category.id === S.active)){
      S.active = menuData[0]?.id || "";
    }

    let cartChanged = false;
    Object.keys(S.cart || {}).forEach(id=>{
      if(!find(id)){
        delete S.cart[id];
        cartChanged = true;
      }
    });
    if(cartChanged) save();

    renderAll();
    console.info("[QUPPA] External menu loaded:", path, warnings.length ? `${warnings.length} warning` : "ok");
    return true;
  } catch(error) {
    if(isDemoMode()){
      console.info("[QUPPA] menu.json kullanılamadı, gömülü menüyle devam ediliyor:", error.message || error);
    }
    return false;
  }
}

function renderCart(){
  const gs=groups();
  const s=summary();
  const has=gs.length>0;

  document.body.classList.toggle("has-cart", has);
  document.body.classList.toggle("waiter-view", !!S.waiterView && has);

  if($("topCount")) $("topCount").textContent=s.q;
  if($("float")) $("float").classList.toggle("show", has);
  if($("floatQty")) $("floatQty").textContent=s.q;
  if($("floatTitle")) $("floatTitle").textContent=T("floatTitle",{count:s.q})||`${s.q} ürün listende`;
  if($("floatSub")) $("floatSub").textContent=T("floatSub")||"Listeyi aç ve garsona göster";
  if($("floatTotal")) $("floatTotal").textContent=money(s.total);

  if($("sheetDesc")) $("sheetDesc").textContent=has
    ? orderSummaryText(s)
    : T("emptyCart");

  if($("sumText")) $("sumText").textContent=has
    ? orderSummaryText(s)
    : T("emptyCart");

  if($("sumTotal")) $("sumTotal").textContent=money(s.total);

  if($("cartEmpty")) $("cartEmpty").classList.toggle("show", !has);

  const accord=$("cartAccord");
  if(accord) accord.style.display=has ? "grid" : "none";

  if($("copyBtn")) $("copyBtn").disabled=!has;
  if($("clearCart")) $("clearCart").disabled=!has;

  const copyBtn=$("copyBtn");
  if(copyBtn){
    copyBtn.innerHTML=S.waiterView
      ? `<i class="fa-solid fa-pen-to-square"></i><span>${T("editList")}</span>`
      : `<i class="fa-solid fa-eye"></i><span>${T("waiterMode")}</span>`;
  }

  if(!has){
    S.waiterView=false;
    document.body.classList.remove("waiter-view");
  }

  if(!accord) return;

  accord.innerHTML=gs.map((g,idx)=>{
    const count=Number(g.q||0);
    const subtotal=Number(g.total||0);

    return `<div class="grp ${(!S.waiterView && idx)?"closed":""}">
      <button class="ghead" data-grp type="button">
        <span class="gico"><i class="fa-solid ${g.icon}"></i></span>
        <span class="gname">${g.name}</span>
        <span class="gmeta"><span>${count} ${T("qtyShort")}</span><b class="edit-only">${money(subtotal)}</b></span>
        <i class="fa-solid fa-chevron-down chev"></i>
      </button>
      <div class="gbody">
        ${g.items.map(x=>{
          const product=x.product;
          const lineTotal=Number(product.price||0)*x.q;

          return `<div class="row">
            <div class="rmain">
              <span class="qbadge">${x.q}×</span>
              <span class="rname">${loc(product.name)}</span>
              <div class="rctrl edit-only">
                <button class="cbtn" data-dec="${product.id}" type="button"><i class="fa-solid fa-minus"></i></button>
                <button class="cbtn" data-inc="${product.id}" type="button"><i class="fa-solid fa-plus"></i></button>
                <button class="cbtn del" data-remove="${product.id}" type="button"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
            <span class="rprice edit-only">${money(lineTotal)}</span>
          </div>`
        }).join("")}
      </div>
    </div>`
  }).join("");

  if($("noteBox")) $("noteBox").classList.toggle("open", !!S.note || S.waiterView);
  if($("note")) $("note").value=S.note;

  bind();
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    remove(b.dataset.remove);
  });
  document.querySelectorAll("[data-grp]").forEach(b=>b.onclick=e=>{
    if(S.waiterView) return;
    b.closest(".grp")?.classList.toggle("closed");
  });
}
    let __quppaDetailScrollY = 0;
function openSheet(){open($("sheet"),$("sheetBack"),"sheet-open");scrollOrderSheetToTop()}function closeSheet(){close($("sheet"),$("sheetBack"),"sheet-open")}
    function openDetail(id){__quppaDetailScrollY=window.scrollY||document.documentElement.scrollTop||0;S.detail=id;renderDetail(id);open($("detail"),$("detailBack"),"detail-open")}
    function closeDetail(){const y=__quppaDetailScrollY;close($("detail"),$("detailBack"),"detail-open");requestAnimationFrame(()=>{if(window.innerWidth>900)window.scrollTo(0,y)})}
    function renderDetail(id){let p=find(id);if(!p)return;let q=S.cart[id]||0,fav=isFav(id);$("detailBody").innerHTML=`<div class="dimg"><img src="${p.image}" alt="${loc(p.name)}" width="1200" height="800" decoding="async" onerror="this.parentElement.classList.add('err')"></div><article class="dinfo"><div class="dhead"><h3>${loc(p.name)}</h3><button class="favbtn detail-fav ${fav?"active":""}" data-fav="${p.id}" title="${T("favorite")}" aria-label="${T("favorite")}"><i class="fa-${fav?"solid":"regular"} fa-heart"></i></button></div><p>${loc(p.detail)||loc(p.desc)}</p><div class="dtags">${renderDetailFlags(p)}${loc(p.tags).slice(0,4).map(t=>`<span class="dtag"><i class="fa-solid fa-hashtag"></i>${t}</span>`).join("")}</div><div class="dbot"><strong>${money(p.price)}</strong>${control(p,q)}</div></article>`;bind()}
    
let __quppaLockDepth = 0;
let __quppaScrollY = 0;
let __quppaFixedLock = false;

function shouldUseFixedScrollLock() {
  return window.innerWidth <= 900 || /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function lockPageScroll() {
  __quppaLockDepth += 1;
  if (__quppaLockDepth > 1) return;

  __quppaScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.dataset.scrollY = String(__quppaScrollY);
  __quppaFixedLock = shouldUseFixedScrollLock();

  document.body.classList.add("modal-lock");

  if (__quppaFixedLock) {
    document.body.classList.add("modal-lock-fixed");
    document.body.style.top = `-${__quppaScrollY}px`;
  } else {
    document.body.classList.add("modal-lock-soft");
  }
}

function unlockPageScroll() {
  __quppaLockDepth = Math.max(0, __quppaLockDepth - 1);
  if (__quppaLockDepth > 0) return;

  const y = Number(document.body.dataset.scrollY || __quppaScrollY || 0);

  document.body.classList.remove("modal-lock", "modal-lock-fixed", "modal-lock-soft");
  document.body.style.top = "";
  delete document.body.dataset.scrollY;

  if (__quppaFixedLock) {
    window.scrollTo(0, y);
  }

  __quppaFixedLock = false;
}


function open(el,b,cls){lockPageScroll();hideUpsell();el.classList.add("open");b.classList.add("open");el.removeAttribute("inert");el.setAttribute("aria-hidden","false");document.body.classList.add(cls)}
    function close(el,b,cls){if(el.contains(document.activeElement))document.activeElement.blur();el.classList.remove("open");b.classList.remove("open");el.setAttribute("aria-hidden","true");el.setAttribute("inert","");document.body.classList.remove(cls);unlockPageScroll()}
    function openLang(force=false){$("closeLang").classList.toggle("show",!force);open($("langModal"),$("langBack"),"lang-open")}function closeLang(){close($("langModal"),$("langBack"),"lang-open")}
    function toast(a,b){clearTimeout(S.timer);$("toastTitle").textContent=a;$("toastMsg").textContent=b;$("toast").classList.add("show");S.timer=setTimeout(()=>$("toast").classList.remove("show"),2200)}
    function copySummary(){let s=summary(),lines=["QUPPA Sipariş Özeti",""];groups().forEach(g=>{lines.push(`${g.name} — ${g.q} ${T("products")} — ${money(g.total)}`);g.items.forEach(x=>lines.push(`${x.q}x ${loc(x.product.name)} — ${money(x.product.price*x.q)}`));lines.push("")});if(S.note.trim())lines.push(`${T("note")}: ${S.note.trim()}`,"");lines.push(`Toplam: ${money(s.total)}`);navigator.clipboard?.writeText(lines.join("\\n")).then(()=>toast(T("copied"),T("copiedText"))).catch(()=>toast(T("copied"),T("copiedText")))}
    function scrollCat(id){let el=$(id);if(!el)return;S.active=id;renderCats(activeCategoryList());renderSwitcher();el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"});requestAnimationFrame(()=>centerInScroll(document.querySelector(`[data-cat="${S.active}"]`)))}
    function spy(){if(S.obs)S.obs.disconnect();let ratios=new Map;S.obs=new IntersectionObserver(es=>{es.forEach(e=>ratios.set(e.target.dataset.sec,e.intersectionRatio));let m=[...ratios.entries()].filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1])[0];if(m&&m[0]!==S.active){S.active=m[0];renderCats(getFilteredCats());renderSwitcher();requestAnimationFrame(()=>centerInScroll(document.querySelector(`[data-cat="${S.active}"]`)))}}, {threshold:[.12,.22,.36,.52,.68],rootMargin:"-190px 0px -45% 0px"});document.querySelectorAll(".section").forEach(s=>S.obs.observe(s))}
    

function setupSheetScrollGuard(){
  const sheetBody=$("sheetBody") || document.querySelector(".sheetBody");
  if(!sheetBody) return;

  sheetBody.addEventListener("wheel", e=>{
    e.stopPropagation();
  }, {passive:true});

  sheetBody.addEventListener("touchmove", e=>{
    e.stopPropagation();
  }, {passive:true});
}

function setupThemePanel(){
  const btn=$("themeBtn");
  const menu=$("themeMenu");
  const back=$("themeBack");
  if(!btn||!menu) return;

  const closeTheme=()=>{
    menu.classList.remove("open");
    back&&back.classList.remove("open");
    btn.setAttribute("aria-expanded","false");
    document.body.classList.remove("theme-open");
    menu.setAttribute("aria-hidden","true");
    back&&back.setAttribute("aria-hidden","true");
    unlockPageScroll();
  };

  const openTheme=()=>{
    lockPageScroll();
    renderThemes();
    menu.classList.add("open");
    back&&back.classList.add("open");
    btn.setAttribute("aria-expanded","true");
    document.body.classList.add("theme-open");
    menu.setAttribute("aria-hidden","false");
    back&&back.setAttribute("aria-hidden","false");
  };

  btn.setAttribute("aria-haspopup","dialog");
  btn.setAttribute("aria-expanded","false");
  menu.setAttribute("aria-hidden","true");

  btn.onclick=e=>{
    e.preventDefault();
    e.stopPropagation();
    menu.classList.contains("open") ? closeTheme() : openTheme();
  };

  back&&(back.onclick=closeTheme);

  document.addEventListener("click",e=>{
    if(e.target.closest("[data-close-theme]")){
      closeTheme();
      return;
    }
    if(!menu.classList.contains("open")) return;
    if(menu.contains(e.target)||btn.contains(e.target)) return;
    closeTheme();
  });

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape") closeTheme();
  });

  window.addEventListener("resize",()=>{
    if(window.innerWidth>720) closeTheme();
  });

  window.__closeThemeStudio=closeTheme;
}


function getFilteredCats(){return menuData.map(c=>({...c,products:c.products.filter(match)})).filter(c=>c.products.length)}
    
    $("searchInput").oninput=e=>{S.q=e.target.value.trim();$("clearBtn").classList.toggle("show",!!S.q);$("searchPanel")?.classList.toggle("has-query",!!S.q);renderMenu();refreshShellSoon()};$("clearBtn").onclick=()=>{S.q="";$("searchInput").value="";$("clearBtn").classList.remove("show");$("searchPanel")?.classList.remove("has-query");$("searchPanel")?.classList.remove("is-open");$("searchPanel")?.classList.add("is-collapsed");renderMenu()};
    $("topCart").onclick=openSheet;$("floatBtn").onclick=openSheet;$("closeSheet").onclick=closeSheet;$("sheetBack").onclick=closeSheet;$("clearCart").onclick=clearCart;$("copyBtn").onclick=()=>{S.waiterView=!S.waiterView;renderCart();if(S.waiterView)scrollOrderSheetToTop();};
    $("closeDetail").onclick=closeDetail;$("detailBack").onclick=closeDetail;$("langBtn").onclick=()=>openLang(false);$("closeLang").onclick=closeLang;$("langBack").onclick=()=>{if(S.lang)closeLang()};
    $("note").value=S.note;$("noteBox").classList.toggle("open",!!S.note.trim());$("noteBox").querySelector("label").onclick=()=>{$("noteBox").classList.add("open");setTimeout(()=>$("note").focus(),0)};$("note").oninput=e=>{S.note=e.target.value;storage.set("note",S.note);$("noteBox").classList.toggle("open",!!S.note.trim()||document.activeElement===$("note"))};$("copyWifi").onclick=()=>copyWifi();
    document.onkeydown=e=>{if(e.key==="Escape"){$("themeMenu").classList.remove("open");closeSheet();closeDetail();if(S.lang)closeLang();$("toast").classList.remove("show")}};
    
    
    
    function refreshShellSoon(){
      clearTimeout(window.__shellRefreshTimer);
      window.__shellRefreshTimer=setTimeout(()=>{
        if(typeof setupFixedMenuDock==="function"){
          const evt=new Event("resize");
          window.dispatchEvent(evt);
        }
      },80);
    }

    function setupSearchToggle(){
      const panel=$("searchPanel"), btn=$("searchToggle"), input=$("searchInput"), clear=$("clearBtn");
      if(!panel||!btn||!input) return;

      function sync(){
        const hasQuery=!!input.value.trim();
        panel.classList.toggle("has-query", hasQuery);
        if(clear) clear.classList.toggle("show", hasQuery);
        btn.setAttribute("aria-expanded", String(panel.classList.contains("is-open") || hasQuery));
      }

      btn.addEventListener("click",()=>{
        const open=!panel.classList.contains("is-open");
        panel.classList.toggle("is-open", open);
        panel.classList.toggle("is-collapsed", !open && !input.value.trim());
        btn.setAttribute("aria-expanded", String(open));
        if(open) setTimeout(()=>input.focus(),80); refreshShellSoon();
      });

      input.addEventListener("keydown",(event)=>{
        if(event.key==="Escape" && !input.value.trim()){
          panel.classList.remove("is-open");
          panel.classList.add("is-collapsed");
          input.blur();
          sync();
        }
      });

      sync();
    }

    function setupFixedMenuDock(){return;}

    

function preventBackgroundTouchScroll(event) {
  if (!document.body.classList.contains("modal-lock")) return;
  const allowed = event.target.closest(".sheet.open,.detail.open,.modal.open,.thememenu.open");
  if (!allowed) event.preventDefault();
}

document.addEventListener("touchmove", preventBackgroundTouchScroll, { passive: false });

function registerServiceWorker(){
  if (!cfg("enablePwa", true)) return;
  if (!("serviceWorker" in navigator)) return;

  const protocol = window.location.protocol;
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  if (protocol !== "https:" && !(protocol === "http:" && isLocalhost)) {
    console.info("[QUPPA] Service Worker file:// üzerinde çalışmaz. Test için local server veya GitHub Pages kullanın.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        scope: "./"
      });

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            console.info("[QUPPA] Yeni menü sürümü hazır. Sayfa yenilendiğinde aktif olur.");
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (window.__quppaControllerChanged) return;
        window.__quppaControllerChanged = true;
        window.location.reload();
      });

      console.info("[QUPPA] Service Worker aktif:", registration.scope);
    } catch (error) {
      console.warn("[QUPPA] Service Worker kaydı başarısız:", error);
    }
  });
}


    applyBrandConfig();
    document.documentElement.dataset.theme=S.theme;if(!S.lang){S.lang="tr";setLang("tr");openLang(true)}else setLang(S.lang);
    setupSearchToggle();
    setupFixedMenuDock();
    setupUpsell();
    setupThemePanel();
    setupSheetScrollGuard();
loadExternalBrandConfig();
loadExternalMenuData();
registerServiceWorker();


async function resetQUPPACacheForDebug() {
  if (!("caches" in window)) return false;

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter(key => key.startsWith("quppa-"))
      .map(key => caches.delete(key))
  );

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }

  console.info("[QUPPA] Cache and service worker reset completed. Reload the page.");
  return true;
}

if (isDemoMode()) {
  window.QUPPA_DEBUG = {
    version: APP_VERSION,
    resetCache: resetQUPPACacheForDebug
  };
}


