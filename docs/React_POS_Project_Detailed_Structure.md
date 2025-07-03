# React POS Sistemi – Proje Dosya Yapısı ve Açıklama (Detaylı)

Bu belge, React + TypeScript tabanlı bir POS sistemine ait proje dosya yapısını ve klasörlerin işlevlerini açıklar.

---

## 📁 Klasör ve Dosya Yapısı

```
├── index.html
├── package-lock.json
├── package.json
├── docs
│   └── HUGIN_T300_INTEGRATION.md
├── src
│   ├── index.css
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── services
│   │   └── posService.ts
│   ├── components
│   │   ├── Toast.tsx
│   │   ├── ReportsTab.tsx
│   │   ├── ProductsTab.tsx
│   │   ├── SalesTab.tsx
│   │   ├── LoginForm.tsx
│   │   ├── Layout.tsx
│   │   ├── POSSettings.tsx
│   │   ├── SettingsTab.tsx
│   │   └── StockTab.tsx
│   ├── types
│   │   └── index.ts
│   ├── main.tsx
│   └── utils
│       ├── logger.ts
│       ├── reports.ts
│       └── storage.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── eslint.config.js
├── tsconfig.node.json
├
│   
│   
├── vite.config.ts
└── .gitignore

```

---

## 📂 Klasör ve Dosyaların Detaylı Açıklamaları

### 🔹 `src/` – Uygulama Ana Kodu

- **`App.tsx`**: Ana bileşen. Sekmeler ve genel yönlendirme burada organize edilir.
- **`main.tsx`**: React uygulamasının giriş noktası. DOM'a render işlemi burada yapılır.
- **`vite-env.d.ts`**: Vite’ye özel ortam tipi tanımlarını içerir.
- **`index.css`**: Tailwind CSS’in yüklendiği global stil dosyası.

#### 📁 `components/` – Arayüz Bileşenleri

| Dosya               | Açıklama |
|---------------------|----------|
| `LoginForm.tsx`     | Giriş formu. Kullanıcı adı ve şifre girişi için. |
| `Layout.tsx`        | Sayfa yapısını düzenler. Header, içerik vs. |
| `Toast.tsx`         | Bildirim kutusu. Uyarı/success mesajı için. |
| `ProductsTab.tsx`   | Ürün listeleme ve işlemleri sekmesi. |
| `SalesTab.tsx`      | Satış işlemleri ve görüntüleme sekmesi. |
| `StockTab.tsx`      | Stok bilgisi ve güncellemeleri için sekme. |
| `SettingsTab.tsx`   | Uygulama ayarlarının yapıldığı sekme. |
| `ReportsTab.tsx`    | Satış ve performans raporları sekmesi. |
| `POSSettings.tsx`   | POS cihazına ait ayar bileşeni. |

#### 📁 `services/`

- **`posService.ts`**: POS işlemleri ve cihaz iletişimi gibi servis fonksiyonlarını içerir.

#### 📁 `utils/`

| Dosya           | Açıklama |
|------------------|----------|
| `logger.ts`      | Konsola log yazdırma işlemleri. |
| `reports.ts`     | Rapor hesaplama, gruplama fonksiyonları. |
| `storage.ts`     | LocalStorage işlemleri (veri kaydetme/okuma). |

#### 📁 `types/`

- **`index.ts`**: Uygulamada ortak kullanılan tip ve interface tanımları.

---

### 📁 `docs/`

- **`HUGIN_T300_INTEGRATION.md`**: HUGIN T300 cihazı ile entegrasyon dökümantasyonu.

---

### 📁 `.bolt/`

| Dosya           | Açıklama |
|------------------|----------|
| `config.json`    | Geliştiriciye özel CLI veya otomasyon aracı yapılandırması. |
| `prompt`         | Otomatik işlemler veya şablonlar için komut dosyası. |

---

### 📄 Diğer Dosyalar (Kök Dizin)

| Dosya                  | Açıklama |
|------------------------|----------|
| `index.html`           | Uygulamanın temel HTML şablonu (`#root`). |
| `vite.config.ts`       | Vite yapılandırma ayarları. |
| `tailwind.config.js`   | Tailwind CSS özelleştirmeleri. |
| `postcss.config.js`    | Tailwind/PostCSS derleyici yapılandırması. |
| `tsconfig.json`        | TypeScript genel ayarları. |
| `tsconfig.app.json`    | Uygulama için TS ayarları. |
| `tsconfig.node.json`   | Node.js tabanlı işlemler için TS ayarları. |
| `package.json`         | Bağımlılıklar ve script tanımları. |
| `package-lock.json`    | Kesin bağımlılık versiyonlarını kilitler. |
| `.gitignore`           | Git tarafından yoksayılacak dosyalar. |

---

### ⚠️ Hariç Tutulan

- **`node_modules/`**: Derlenmiş bağımlılıkların yer aldığı klasördür. İnceleme dışında tutulmuştur.

---
