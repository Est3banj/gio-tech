const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const isApply = process.argv.includes("--apply");
const isForce = process.env.ALLOW_BATCH_WRITE === "true";

if (isApply && !isForce) {
  console.error("🛑 BLOQUEO DE SEGURIDAD ACTIVADO:");
  console.error("No se permite ejecutar escrituras masivas sobre Firestore sin la variable de entorno explícita:");
  console.error("   ALLOW_BATCH_WRITE=true node scripts/syncInventory.js --apply");
  console.error("Esto evita sobreescribir o pisar ediciones manuales del catálogo.");
  process.exit(1);
}

// 78 Items proporcionados
const RAW_ITEMS = [
  // --- SAMSUNG (22) ---
  { raw: "S20+ 5G 128/12 + SD 256", marca: "Samsung", categoria: "Celulares", contado: 1430000, nombre: "Samsung Galaxy S20+ 5G 128GB/12 RAM + SD 256GB", specs: { almacenamiento: 128, ram: 12, pantalla: 6.7, bateria: 4500, camara: 64 }, esDestacado: false },
  { raw: "Z Flip 8 512/12", marca: "Samsung", categoria: "Celulares", contado: 4550000, nombre: "Samsung Galaxy Z Flip 8 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.7, bateria: 4000, camara: 50 }, esDestacado: true },
  { raw: "Z Fold 8 512/12", marca: "Samsung", categoria: "Celulares", contado: 6200000, nombre: "Samsung Galaxy Z Fold 8 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 7.6, bateria: 4400, camara: 50 }, esDestacado: true },
  { raw: "Z Fold 8 Ultra 512/12", marca: "Samsung", categoria: "Celulares", contado: 7150000, nombre: "Samsung Galaxy Z Fold 8 Ultra 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 7.6, bateria: 4500, camara: 200 }, esDestacado: true },
  { raw: "S25 FE 512/8", marca: "Samsung", categoria: "Celulares", contado: 2700000, nombre: "Samsung Galaxy S25 FE 512GB/8 RAM", specs: { almacenamiento: 512, ram: 8, pantalla: 6.4, bateria: 4500, camara: 50 }, esDestacado: false },
  { raw: "S26 FE 256", marca: "Samsung", categoria: "Celulares", contado: 3300000, nombre: "Samsung Galaxy S26 FE 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.4, bateria: 4700, camara: 50 }, esDestacado: false },
  { raw: "S26 FE 512", marca: "Samsung", categoria: "Celulares", contado: 3850000, nombre: "Samsung Galaxy S26 FE 512GB/8 RAM", specs: { almacenamiento: 512, ram: 8, pantalla: 6.4, bateria: 4700, camara: 50 }, esDestacado: false },
  { raw: "S25 Ultra 256/12", marca: "Samsung", categoria: "Celulares", contado: 3300000, nombre: "Samsung Galaxy S25 Ultra 5G 256GB/12 RAM", specs: { almacenamiento: 256, ram: 12, pantalla: 6.8, bateria: 5000, camara: 200 }, esDestacado: true },
  { raw: "S25 Ultra 512/12", marca: "Samsung", categoria: "Celulares", contado: 3700000, nombre: "Samsung Galaxy S25 Ultra 5G 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.8, bateria: 5000, camara: 200 }, esDestacado: true },
  { raw: "S25 Ultra 1 TB", marca: "Samsung", categoria: "Celulares", contado: 4530000, nombre: "Samsung Galaxy S25 Ultra 5G 1TB/12 RAM", specs: { almacenamiento: 1024, ram: 12, pantalla: 6.8, bateria: 5000, camara: 200 }, esDestacado: true },
  { raw: "S26 Ultra 256 GB", marca: "Samsung", categoria: "Celulares", contado: 3900000, nombre: "Samsung Galaxy S26 Ultra 5G 256GB/12 RAM", specs: { almacenamiento: 256, ram: 12, pantalla: 6.8, bateria: 5000, camara: 200 }, esDestacado: true },
  { raw: "S26 Ultra 512 GB", marca: "Samsung", categoria: "Celulares", contado: 4150000, nombre: "Samsung Galaxy S26 Ultra 5G 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.8, bateria: 5000, camara: 200 }, esDestacado: true },
  { raw: "A26 256/8 5G", marca: "Samsung", categoria: "Celulares", contado: 1450000, nombre: "Samsung Galaxy A26 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A27 256/8", marca: "Samsung", categoria: "Celulares", contado: 1450000, nombre: "Samsung Galaxy A27 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A37 128/6", marca: "Samsung", categoria: "Celulares", contado: 1480000, nombre: "Samsung Galaxy A37 128GB/6 RAM", specs: { almacenamiento: 128, ram: 6, pantalla: 6.6, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A37 256/8", marca: "Samsung", categoria: "Celulares", contado: 1600000, nombre: "Samsung Galaxy A37 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.6, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A57 256/8", marca: "Samsung", categoria: "Celulares", contado: 1800000, nombre: "Samsung Galaxy A57 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.6, bateria: 5000, camara: 50 }, esDestacado: true },
  { raw: "A07 64 GB", marca: "Samsung", categoria: "Celulares", contado: 920000, nombre: "Samsung Galaxy A07 64GB/4 RAM", specs: { almacenamiento: 64, ram: 4, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A07 128/4", marca: "Samsung", categoria: "Celulares", contado: 950000, nombre: "Samsung Galaxy A07 128GB/4 RAM", specs: { almacenamiento: 128, ram: 4, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A07 128/6", marca: "Samsung", categoria: "Celulares", contado: 975000, nombre: "Samsung Galaxy A07 128GB/6 RAM", specs: { almacenamiento: 128, ram: 6, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A17 128 GB", marca: "Samsung", categoria: "Celulares", contado: 1020000, nombre: "Samsung Galaxy A17 128GB/4 RAM", specs: { almacenamiento: 128, ram: 4, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "A17 256/8 4G", marca: "Samsung", categoria: "Celulares", contado: 1210000, nombre: "Samsung Galaxy A17 4G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },

  // --- IPHONE (8) ---
  { raw: "16 Pro Max 512 GB CPO", marca: "Apple", categoria: "Celulares", contado: 4550000, nombre: "Apple iPhone 16 Pro Max 512GB CPO", specs: { almacenamiento: 512, ram: 8, pantalla: 6.9, bateria: 4685, camara: 48 }, esDestacado: true },
  { raw: "13 Remano 128 GB", marca: "Apple", categoria: "Celulares", contado: 1920000, nombre: "Apple iPhone 13 128GB Reacondicionado", specs: { almacenamiento: 128, ram: 4, pantalla: 6.1, bateria: 3227, camara: 12 }, esDestacado: false },
  { raw: "15 128 GB", marca: "Apple", categoria: "Celulares", contado: 2900000, nombre: "Apple iPhone 15 128GB", specs: { almacenamiento: 128, ram: 6, pantalla: 6.1, bateria: 3349, camara: 48 }, esDestacado: false },
  { raw: "16 128 GB", marca: "Apple", categoria: "Celulares", contado: 3100000, nombre: "Apple iPhone 16 128GB", specs: { almacenamiento: 128, ram: 8, pantalla: 6.1, bateria: 3561, camara: 48 }, esDestacado: false },
  { raw: "17 256 GB", marca: "Apple", categoria: "Celulares", contado: 3550000, nombre: "Apple iPhone 17 256GB 5G", specs: { almacenamiento: 256, ram: 8, pantalla: 6.3, bateria: 3600, camara: 48 }, esDestacado: true },
  { raw: "17 Pro 256 GB", marca: "Apple", categoria: "Celulares", contado: 4300000, nombre: "Apple iPhone 17 Pro 256GB 5G", specs: { almacenamiento: 256, ram: 8, pantalla: 6.3, bateria: 3700, camara: 48 }, esDestacado: true },
  { raw: "17 Pro Max 256 GB", marca: "Apple", categoria: "Celulares", contado: 4600000, nombre: "Apple iPhone 17 Pro Max 256GB 5G", specs: { almacenamiento: 256, ram: 12, pantalla: 6.9, bateria: 4800, camara: 48 }, esDestacado: true },
  { raw: "17 Pro Max 512 GB", marca: "Apple", categoria: "Celulares", contado: 5400000, nombre: "Apple iPhone 17 Pro Max 512GB 5G", specs: { almacenamiento: 512, ram: 12, pantalla: 6.9, bateria: 4800, camara: 48 }, esDestacado: true },

  // --- XIAOMI (28) ---
  { raw: "MI 17 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 3500000, nombre: "Xiaomi 17 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.36, bateria: 5000, camara: 50 }, esDestacado: true },
  { raw: "MI 17T 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 2900000, nombre: "Xiaomi 17T 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5000, camara: 50 }, esDestacado: true },
  { raw: "MI 17T Pro 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 3300000, nombre: "Xiaomi 17T Pro 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5000, camara: 50 }, esDestacado: true },
  { raw: "Poco C71 64/4", marca: "Xiaomi", categoria: "Celulares", contado: 920000, nombre: "Xiaomi Poco C71 64GB/4 RAM", specs: { almacenamiento: 64, ram: 4, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Poco C71 128 GB", marca: "Xiaomi", categoria: "Celulares", contado: 960000, nombre: "Xiaomi Poco C71 128GB/4 RAM", specs: { almacenamiento: 128, ram: 4, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Poco M8 Pro 5G 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 1780000, nombre: "Xiaomi Poco M8 Pro 5G 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5000, camara: 64 }, esDestacado: false },
  { raw: "X8 Pro 512/8 5G", marca: "Xiaomi", categoria: "Celulares", contado: 1970000, nombre: "Xiaomi Poco X8 Pro 5G 512GB/8 RAM", specs: { almacenamiento: 512, ram: 8, pantalla: 6.67, bateria: 5000, camara: 64 }, esDestacado: false },
  { raw: "X8 Pro 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 2100000, nombre: "Xiaomi Poco X8 Pro 5G 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5000, camara: 64 }, esDestacado: true },
  { raw: "X8 Pro Max 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 2450000, nombre: "Xiaomi Poco X8 Pro Max 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5500, camara: 108 }, esDestacado: true },
  { raw: "F8 Pro 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 2600000, nombre: "Xiaomi Poco F8 Pro 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5000, camara: 50 }, esDestacado: true },
  { raw: "Redmi 17 128/4", marca: "Xiaomi", categoria: "Celulares", contado: 1130000, nombre: "Xiaomi Redmi 17 128GB/4 RAM", specs: { almacenamiento: 128, ram: 4, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Redmi 17 256/4", marca: "Xiaomi", categoria: "Celulares", contado: 1220000, nombre: "Xiaomi Redmi 17 256GB/4 RAM", specs: { almacenamiento: 256, ram: 4, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Redmi 17 256/6", marca: "Xiaomi", categoria: "Celulares", contado: 1290000, nombre: "Xiaomi Redmi 17 256GB/6 RAM", specs: { almacenamiento: 256, ram: 6, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Note 15 Pro+ 256/8", marca: "Xiaomi", categoria: "Celulares", contado: 1850000, nombre: "Xiaomi Redmi Note 15 Pro+ 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.67, bateria: 5000, camara: 200 }, esDestacado: true },
  { raw: "Note 15 Pro+ 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 2050000, nombre: "Xiaomi Redmi Note 15 Pro+ 5G 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5000, camara: 200 }, esDestacado: true },
  { raw: "Redmi 15C 128 GB", marca: "Xiaomi", categoria: "Celulares", contado: 1010000, nombre: "Xiaomi Redmi 15C 128GB/4 RAM", specs: { almacenamiento: 128, ram: 4, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Redmi 15C 256/4+4", marca: "Xiaomi", categoria: "Celulares", contado: 1050000, nombre: "Xiaomi Redmi 15C 256GB/4+4 RAM", specs: { almacenamiento: 256, ram: 4, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Redmi 15C 256/8+8", marca: "Xiaomi", categoria: "Celulares", contado: 1110000, nombre: "Xiaomi Redmi 15C 256GB/8+8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Redmi 15 256/8", marca: "Xiaomi", categoria: "Celulares", contado: 1190000, nombre: "Xiaomi Redmi 15 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.7, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Note 15 512/8", marca: "Xiaomi", categoria: "Celulares", contado: 1330000, nombre: "Xiaomi Redmi Note 15 512GB/8 RAM", specs: { almacenamiento: 512, ram: 8, pantalla: 6.67, bateria: 5000, camara: 108 }, esDestacado: false },
  { raw: "Note 15 Pro 4G 512/12", marca: "Xiaomi", categoria: "Celulares", contado: 1590000, nombre: "Xiaomi Redmi Note 15 Pro 4G 512GB/12 RAM", specs: { almacenamiento: 512, ram: 12, pantalla: 6.67, bateria: 5000, camara: 200 }, esDestacado: false },
  { raw: "Note 15 Pro 256 5G", marca: "Xiaomi", categoria: "Celulares", contado: 1580000, nombre: "Xiaomi Redmi Note 15 Pro 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.67, bateria: 5000, camara: 200 }, esDestacado: false },
  { raw: "Note 15 Pro 5G 512/8", marca: "Xiaomi", categoria: "Celulares", contado: 1680000, nombre: "Xiaomi Redmi Note 15 Pro 5G 512GB/8 RAM", specs: { almacenamiento: 512, ram: 8, pantalla: 6.67, bateria: 5000, camara: 200 }, esDestacado: false },
  { raw: "Note 15 Pro 256 4G", marca: "Xiaomi", categoria: "Celulares", contado: 1470000, nombre: "Xiaomi Redmi Note 15 Pro 4G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.67, bateria: 5000, camara: 200 }, esDestacado: false },
  { raw: "Note 15 256 GB", marca: "Xiaomi", categoria: "Celulares", contado: 1280000, nombre: "Xiaomi Redmi Note 15 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.67, bateria: 5000, camara: 108 }, esDestacado: false },
  { raw: "Note 14 Pro+ 256/8", marca: "Xiaomi", categoria: "Celulares", contado: 1700000, nombre: "Xiaomi Redmi Note 14 Pro+ 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.67, bateria: 5000, camara: 200 }, esDestacado: false },
  { raw: "Redmi A7 Pro 64/3", marca: "Xiaomi", categoria: "Celulares", contado: 920000, nombre: "Xiaomi Redmi A7 Pro 64GB/3 RAM", specs: { almacenamiento: 64, ram: 3, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Redmi A7 Pro 128 GB", marca: "Xiaomi", categoria: "Celulares", contado: 960000, nombre: "Xiaomi Redmi A7 Pro 128GB/4 RAM", specs: { almacenamiento: 128, ram: 4, pantalla: 6.5, bateria: 5000, camara: 50 }, esDestacado: false },

  // --- TECNO (7) ---
  { raw: "Camon 50 Ultra 256/8 5G + obsequio", marca: "Tecno", categoria: "Celulares", contado: 1780000, nombre: "Tecno Camon 50 Ultra 5G 256GB/8 RAM + Obsequio", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 5000, camara: 50 }, esDestacado: true },
  { raw: "Spark 50 5G 256/8+8", marca: "Tecno", categoria: "Celulares", contado: 1410000, nombre: "Tecno Spark 50 5G 256GB/8+8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Pova Curve 2 5G 256/8", marca: "Tecno", categoria: "Celulares", contado: 1580000, nombre: "Tecno Pova Curve 2 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 8000, camara: 50 }, esDestacado: false },
  { raw: "Pova 6 5G 256/8", marca: "Tecno", categoria: "Celulares", contado: 1150000, nombre: "Tecno Pova 6 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 6000, camara: 50 }, esDestacado: false },
  { raw: "Pova Slim 5G 256/8", marca: "Tecno", categoria: "Celulares", contado: 1530000, nombre: "Tecno Pova Slim 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Spark Go 3 64/3", marca: "Tecno", categoria: "Celulares", contado: 950000, nombre: "Tecno Spark Go 3 64GB/3 RAM", specs: { almacenamiento: 64, ram: 3, pantalla: 6.6, bateria: 5000, camara: 13 }, esDestacado: false },
  { raw: "Spark Go 3 128 GB", marca: "Tecno", categoria: "Celulares", contado: 990000, nombre: "Tecno Spark Go 3 128GB/4 RAM", specs: { almacenamiento: 128, ram: 4, pantalla: 6.6, bateria: 5000, camara: 13 }, esDestacado: false },

  // --- INFINIX (3) ---
  { raw: "Note Edge 256/8", marca: "Infinix", categoria: "Celulares", contado: 1580000, nombre: "Infinix Note Edge 5G 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 6500, camara: 50 }, esDestacado: false },
  { raw: "Note 60 256/8", marca: "Infinix", categoria: "Celulares", contado: 1780000, nombre: "Infinix Note 60 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 5000, camara: 50 }, esDestacado: false },
  { raw: "Note 60 Pro 256/8", marca: "Infinix", categoria: "Celulares", contado: 1920000, nombre: "Infinix Note 60 Pro 256GB/8 RAM", specs: { almacenamiento: 256, ram: 8, pantalla: 6.78, bateria: 5000, camara: 108 }, esDestacado: true },

  // --- IPAD (6) ---
  { raw: "iPad A16 128 GB", marca: "Apple", categoria: "Tablets", contado: 2000000, nombre: "Apple iPad A16 128GB Wi-Fi", specs: { almacenamiento: 128, ram: null, pantalla: 10.9, bateria: null, camara: 12 }, esDestacado: false },
  { raw: "iPad A16 256 GB", marca: "Apple", categoria: "Tablets", contado: 2550000, nombre: "Apple iPad A16 256GB Wi-Fi", specs: { almacenamiento: 256, ram: null, pantalla: 10.9, bateria: null, camara: 12 }, esDestacado: false },
  { raw: "iPad Air M4 128 GB", marca: "Apple", categoria: "Tablets", contado: 3200000, nombre: "Apple iPad Air M4 128GB Wi-Fi 11\"", specs: { almacenamiento: 128, ram: 8, pantalla: 11, bateria: null, camara: 12 }, esDestacado: true },
  { raw: "iPad Air M4 256 GB", marca: "Apple", categoria: "Tablets", contado: 3550000, nombre: "Apple iPad Air M4 256GB Wi-Fi 11\"", specs: { almacenamiento: 256, ram: 8, pantalla: 11, bateria: null, camara: 12 }, esDestacado: true },
  { raw: "iPad Pro M5 13”", marca: "Apple", categoria: "Tablets", contado: 5300000, nombre: "Apple iPad Pro M5 13\" 256GB Wi-Fi", specs: { almacenamiento: 256, ram: 12, pantalla: 13, bateria: null, camara: 12 }, esDestacado: true },
  { raw: "iPad Pro M5 11”", marca: "Apple", categoria: "Tablets", contado: 4550000, nombre: "Apple iPad Pro M5 11\" 256GB Wi-Fi", specs: { almacenamiento: 256, ram: 12, pantalla: 11, bateria: null, camara: 12 }, esDestacado: true },

  // --- MACBOOK (4) ---
  { raw: "MacBook Neo 256 GB", marca: "Apple", categoria: "Laptops", contado: 3200000, nombre: "Apple MacBook Neo 256GB", specs: { almacenamiento: 256, ram: 8, pantalla: 13.6, bateria: null, camara: 12 }, esDestacado: false },
  { raw: "MacBook Air M4 15” 256/16", marca: "Apple", categoria: "Laptops", contado: 5000000, nombre: "Apple MacBook Air 15\" M4 256GB/16 RAM", specs: { almacenamiento: 256, ram: 16, pantalla: 15.3, bateria: null, camara: 12 }, esDestacado: true },
  { raw: "MacBook Air M4 15” 512/24", marca: "Apple", categoria: "Laptops", contado: 6000000, nombre: "Apple MacBook Air 15\" M4 512GB/24 RAM", specs: { almacenamiento: 512, ram: 24, pantalla: 15.3, bateria: null, camara: 12 }, esDestacado: true },
  { raw: "MacBook Air M5 13” 512/16", marca: "Apple", categoria: "Laptops", contado: 5300000, nombre: "Apple MacBook Air 13\" M5 512GB/16 RAM", specs: { almacenamiento: 512, ram: 16, pantalla: 13.6, bateria: null, camara: 12 }, esDestacado: true },
];

const DEFAULT_IMAGES = {
  "Samsung": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800",
  "Apple-Celulares": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&q=80&w=800",
  "Apple-Tablets": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800",
  "Apple-Laptops": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
  "Xiaomi": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800",
  "Tecno": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800",
  "Infinix": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800",
};

function getDefaultImage(marca, categoria) {
  if (marca === "Apple") {
    return DEFAULT_IMAGES[`Apple-${categoria}`] || DEFAULT_IMAGES["Apple-Celulares"];
  }
  return DEFAULT_IMAGES[marca] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800";
}

function normalizeStr(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectBrand(doc) {
  if (doc.marca && ["samsung", "apple", "xiaomi", "tecno", "infinix", "motorola", "oppo"].includes(doc.marca.toLowerCase())) {
    const m = doc.marca.toLowerCase();
    if (m === "samsung") return "Samsung";
    if (m === "apple") return "Apple";
    if (m === "xiaomi") return "Xiaomi";
    if (m === "tecno") return "Tecno";
    if (m === "infinix") return "Infinix";
    if (m === "motorola") return "Motorola";
    if (m === "oppo") return "Oppo";
  }

  const s = normalizeStr((doc.nombre || "") + " " + (doc.descripcion || ""));
  if (s.includes("samsung") || s.includes("galaxy")) return "Samsung";
  if (s.includes("iphone") || s.includes("apple") || s.includes("macbook") || s.includes("ipad") || s.includes("airpod") || s.includes("airtag")) return "Apple";
  if (s.includes("xiaomi") || s.includes("redmi") || s.includes("poco")) return "Xiaomi";
  if (s.includes("tecno") || s.includes("camon") || s.includes("pova") || s.includes("spark")) return "Tecno";
  if (s.includes("infinix") || s.includes("infinitix") || s.includes("hot 70") || s.includes("hot 60")) return "Infinix";
  if (s.includes("motorola") || s.includes("moto")) return "Motorola";
  if (s.includes("oppo")) return "Oppo";
  return "Otra";
}

function extractStorage(nameAndDesc, specs) {
  const s = normalizeStr(nameAndDesc);
  if (s.includes("1tb") || s.includes("1 tb") || s.includes("1024")) return 1024;
  if (s.includes("512gb") || s.includes("512 gb") || s.includes("512")) return 512;
  if (s.includes("256gb") || s.includes("256 gb") || s.includes("256")) return 256;
  if (s.includes("128gb") || s.includes("128 gb") || s.includes("128")) return 128;
  if (s.includes("64gb") || s.includes("64 gb") || s.includes("64")) return 64;
  if (s.includes("32gb") || s.includes("32 gb") || s.includes("32")) return 32;
  if (specs?.almacenamiento && specs.almacenamiento >= 32 && specs.almacenamiento <= 2048) return specs.almacenamiento;
  return null;
}

function extractRAM(nameAndDesc, specs) {
  const s = normalizeStr(nameAndDesc);
  const mVirtual = s.match(/\b(\d{1,2})\s*plus\s*\d{1,2}\b/);
  if (mVirtual) return Number(mVirtual[1]);
  const mRam = s.match(/(?:[/+]|\b)(\d{1,2})\s*(?:gb)?\s*ram\b/);
  if (mRam) return Number(mRam[1]);
  if (specs?.ram && specs.ram <= 24) return specs.ram;
  return null;
}

function getCanonicalModelKey(itemOrDoc) {
  const brand = detectBrand(itemOrDoc);
  const name = itemOrDoc.nombre || "";
  const raw = itemOrDoc.raw || "";
  const desc = itemOrDoc.descripcion || "";
  const fullText = name + " " + raw + " " + desc;
  const s = normalizeStr(name + " " + raw);
  const storage = extractStorage(name + " " + raw, itemOrDoc.specs) || extractStorage(fullText, itemOrDoc.specs);
  const ram = extractRAM(name + " " + raw, itemOrDoc.specs) || extractRAM(fullText, itemOrDoc.specs);

  // SAMSUNG
  if (brand === "Samsung") {
    if (s.includes("s20") && s.includes("plus")) return `samsung:s20plus:${storage || 128}`;
    if (s.includes("flip 8") || s.includes("z flip 8")) return `samsung:zflip8:${storage || 512}`;
    if (s.includes("fold 8 ultra") || s.includes("z fold 8 ultra")) return `samsung:zfold8ultra:${storage || 512}`;
    if (s.includes("fold 8") || s.includes("z fold 8")) return `samsung:zfold8:${storage || 512}`;
    if (s.includes("s25 fe")) return `samsung:s25fe:${storage || 512}`;
    if (s.includes("s26 fe")) return `samsung:s26fe:${storage || 256}`;
    if (s.includes("s25 ultra")) return `samsung:s25ultra:${storage || 512}`;
    if (s.includes("s26 ultra")) return `samsung:s26ultra:${storage || 256}`;
    if (s.includes("s25") && !s.includes("ultra") && !s.includes("fe")) return `samsung:s25:${storage || 256}`;
    if (s.includes("a26")) return `samsung:a26:${storage || 256}`;
    if (s.includes("a27")) return `samsung:a27:${storage || 256}`;
    if (s.includes("a37")) return `samsung:a37:${storage || 128}:${ram || 6}`;
    if (s.includes("a57")) return `samsung:a57:${storage || 256}`;
    if (s.includes("a56")) return `samsung:a56:${storage || 256}`;
    if (s.includes("a36")) return `samsung:a36:${storage || 256}`;
    if (s.includes("a07")) return `samsung:a07:${storage || 64}:${ram || 4}`;
    if (s.includes("a17")) return `samsung:a17:${storage || 128}`;
  }

  // APPLE
  if (brand === "Apple") {
    if (s.includes("16 pro max") && (s.includes("cpo") || s.includes("reacondicionado") || s.includes("remano"))) return `apple:iphone16promax:cpo:${storage || 512}`;
    if (s.includes("17 pro max")) return `apple:iphone17promax:${storage || 256}`;
    if (s.includes("17 pro") && !s.includes("max")) return `apple:iphone17pro:${storage || 256}`;
    if (s.includes("17") && !s.includes("pro") && !s.includes("max") && (s.includes("iphone") || s.includes("5g"))) return `apple:iphone17:${storage || 256}`;
    if (s.includes("16 pro max")) return `apple:iphone16promax:${storage || 256}`;
    if (s.includes("16 pro") && !s.includes("max")) return `apple:iphone16pro:${storage || 256}`;
    if (s.includes("16") && !s.includes("pro") && !s.includes("max") && s.includes("iphone")) return `apple:iphone16:${storage || 128}`;
    if (s.includes("15 pro max")) return `apple:iphone15promax:${storage || 256}`;
    if (s.includes("15") && !s.includes("pro") && !s.includes("max") && s.includes("iphone")) return `apple:iphone15:${storage || 128}`;
    if (s.includes("13") && s.includes("iphone")) return `apple:iphone13:${storage || 128}`;
    if (s.includes("ipad a16") || (s.includes("ipad") && s.includes("10th"))) return `apple:ipad_a16:${storage || 128}`;
    if (s.includes("ipad air") && (s.includes("m4") || s.includes("m3") || s.includes("m2"))) return `apple:ipad_air_m4:${storage || 128}`;
    if (s.includes("ipad pro") && (s.includes("m5") || s.includes("m4"))) return `apple:ipad_pro_m5:${s.includes("13") ? "13" : "11"}:${storage || 256}`;
    if (s.includes("macbook neo")) return `apple:macbook_neo:${storage || 256}`;
    if (s.includes("macbook air") && s.includes("15") && s.includes("m4")) return `apple:macbook_air_15_m4:${storage || 256}:${ram || 16}`;
    if (s.includes("macbook air") && (s.includes("m5") || normalizeStr(fullText).includes("m5"))) return `apple:macbook_air_13_m5:${storage || 512}`;
    if (s.includes("macbook air") && s.includes("m3")) return `apple:macbook_air_13_m3:${storage || 256}`;
  }

  // XIAOMI
  if (brand === "Xiaomi") {
    if (s.includes("17t pro") || s.includes("mi 17t pro")) return `xiaomi:17tpro:${storage || 512}`;
    if (s.includes("17t") || s.includes("mi 17t")) return `xiaomi:17t:${storage || 512}`;
    if ((s.includes("mi 17") || s.includes("xiaomi 17")) && !s.includes("17t") && !s.includes("redmi")) return `xiaomi:17:${storage || 512}`;
    if (s.includes("poco c71") || s.includes("c71")) return `xiaomi:pococ71:${storage || 64}`;
    if (s.includes("poco m8 pro") || s.includes("m8 pro")) return `xiaomi:pocom8pro:${storage || 512}`;
    if (s.includes("x8 pro max") || s.includes("poco x8 pro max")) return `xiaomi:pocox8promax:${storage || 512}`;
    if (s.includes("x8 pro") || s.includes("poco x8 pro")) return `xiaomi:pocox8pro:${storage || 512}:${ram || 8}`;
    if (s.includes("f8 pro") || s.includes("poco f8 pro")) return `xiaomi:pocof8pro:${storage || 512}`;
    if (s.includes("note 15 pro plus") || s.includes("note 15 pro+")) return `xiaomi:note15proplus:${storage || 256}:${ram || 8}`;
    if (s.includes("note 15 pro") && s.includes("5g")) return `xiaomi:note15pro_5g:${storage || 256}:${ram || 8}`;
    if (s.includes("note 15 pro") && s.includes("4g")) return `xiaomi:note15pro_4g:${storage || 256}:${ram || 8}`;
    if (s.includes("note 15") && !s.includes("pro")) return `xiaomi:note15:${storage || 256}`;
    if (s.includes("note 14 pro plus") || s.includes("note 14 pro+")) return `xiaomi:note14proplus:${storage || 256}`;
    if (s.includes("redmi 17")) return `xiaomi:redmi17:${storage || 128}:${ram || 4}`;
    if (s.includes("redmi 15c") || s.includes("15c")) return `xiaomi:redmi15c:${storage || 128}:${ram || 4}`;
    if (s.includes("redmi 15") && !s.includes("15c") && !s.includes("note")) return `xiaomi:redmi15:${storage || 256}`;
    if (s.includes("redmi a7 pro") || s.includes("a7 pro")) return `xiaomi:redmia7pro:${storage || 64}`;
  }

  // TECNO
  if (brand === "Tecno") {
    if (s.includes("camon 50 ultra") || s.includes("camon 50")) return `tecno:camon50ultra:${storage || 256}`;
    if (s.includes("spark 50 5g") || (s.includes("spark 50") && s.includes("5g"))) return `tecno:spark50_5g:${storage || 256}`;
    if (s.includes("pova curve 2")) return `tecno:povacurve2:${storage || 256}`;
    if (s.includes("pova 6")) return `tecno:pova6:${storage || 256}`;
    if (s.includes("pova slim")) return `tecno:povaslim:${storage || 256}`;
    if (s.includes("spark go 3")) return `tecno:sparkgo3:${storage || 64}`;
  }

  // INFINIX
  if (brand === "Infinix") {
    if (s.includes("note edge")) return `infinix:noteedge:${storage || 256}`;
    if (s.includes("note 60 pro")) return `infinix:note60pro:${storage || 256}`;
    if (s.includes("note 60") && !s.includes("pro")) return `infinix:note60:${storage || 256}`;
  }

  return `${brand.toLowerCase()}:${s}`;
}

function findMatchingProduct(item, firestoreDocs) {
  const itemKey = getCanonicalModelKey(item);

  for (const doc of firestoreDocs) {
    const docKey = getCanonicalModelKey(doc);
    if (itemKey === docKey) {
      return doc;
    }
  }

  return null;
}

async function main() {
  console.log(`\n======================================================`);
  console.log(` 🚀 GIO-TECH INVENTORY SYNC (${isApply ? "MODO REAL: APLICANDO CAMBIOS" : "MODO PREVIEW: DRY RUN"})`);
  console.log(`======================================================\n`);

  const snap = await db.collection("productos").get();
  const existingDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`📦 Total productos actuales en Firestore: ${existingDocs.length}`);
  console.log(`📋 Total ítems a sincronizar del nuevo listado: ${RAW_ITEMS.length}\n`);

  const matchedDocIds = new Set();
  const toUpdate = [];
  const toCreate = [];

  for (const item of RAW_ITEMS) {
    const availableDocs = existingDocs.filter(d => !matchedDocIds.has(d.id));
    const matchedDoc = findMatchingProduct(item, availableDocs);

    const cuotas6 = Math.round(item.contado * 0.175);
    const cuotas8 = Math.round(item.contado * 0.175 * 2);

    if (matchedDoc) {
      matchedDocIds.add(matchedDoc.id);
      const updatePayload = {
        contado: item.contado,
        cuotas6: cuotas6,
        cuotas8: cuotas8,
        enStock: true,
      };

      if (!matchedDoc.specs || (!matchedDoc.specs.ram && !matchedDoc.specs.almacenamiento)) {
        updatePayload.specs = { ...(matchedDoc.specs || {}), ...item.specs };
      }

      toUpdate.push({
        id: matchedDoc.id,
        nombreActual: matchedDoc.nombre,
        nombreNuevo: item.nombre,
        canonicalKey: getCanonicalModelKey(item),
        precioAnterior: matchedDoc.contado,
        precioNuevo: item.contado,
        marca: item.marca,
        categoria: item.categoria,
        payload: updatePayload,
      });
    } else {
      const createPayload = {
        nombre: item.nombre,
        marca: item.marca,
        categoria: item.categoria,
        contado: item.contado,
        cuotas6: cuotas6,
        cuotas8: cuotas8,
        cuotaInicial: null,
        specs: item.specs,
        enStock: true,
        esDestacado: Boolean(item.esDestacado),
        imagen: getDefaultImage(item.marca, item.categoria),
        descripcion: `${item.nombre}.\n\n✅ 100% Original, Libre de Fábrica con Garantía Oficial Gio-Tech.\n💳 Financiación disponible en cómodas cuotas con aprobación inmediata.`,
        promo: false,
        promoPrice: null,
        promoBadgeText: null,
        promoBadgeBg: null,
        promoHighlight: null,
        nuevo: true,
        nuevoBadgeText: item.esDestacado ? "DESTACADO" : "NUEVO",
        nuevoBadgeBg: item.esDestacado ? "#d81b60" : "#28a745",
        badgeMode: item.esDestacado ? "promo" : "nuevo",
        solo12Meses: false,
        cuotas12: null,
      };

      toCreate.push({
        nombre: item.nombre,
        canonicalKey: getCanonicalModelKey(item),
        marca: item.marca,
        categoria: item.categoria,
        contado: item.contado,
        cuotas6: cuotas6,
        cuotas8: cuotas8,
        specs: item.specs,
        payload: createPayload,
      });
    }
  }

  console.log(`\n--- RESUMEN DE OPERACIONES ---`);
  console.log(`🔄 Productos a ACTUALIZAR: ${toUpdate.length}`);
  console.log(`✨ Productos a CREAR: ${toCreate.length}`);
  console.log(`📌 Productos existentes no modificados (accesorios/otros): ${existingDocs.length - matchedDocIds.size}`);

  console.log(`\n--- DETALLE DE ACTUALIZACIONES MATCHED ---`);
  toUpdate.forEach((u, i) => {
    console.log(` ${i + 1}. [${u.id}] "${u.nombreActual}" -> Nuevo Contado: $${u.precioNuevo.toLocaleString()} (Antes: $${u.precioAnterior?.toLocaleString()}) [Key: ${u.canonicalKey}]`);
  });

  if (isApply) {
    console.log(`\n⏳ Aplicando escrituras en Firestore...`);

    for (const item of toUpdate) {
      await db.collection("productos").doc(item.id).update(item.payload);
      console.log(`  [UPDATE] ${item.id} -> ${item.nombreActual} ($${item.precioAnterior?.toLocaleString()} => $${item.precioNuevo?.toLocaleString()})`);
    }

    for (const item of toCreate) {
      const docRef = await db.collection("productos").add(item.payload);
      console.log(`  [CREATE] ${docRef.id} -> ${item.nombre} ($${item.contado?.toLocaleString()})`);
    }

    console.log(`\n✅ ¡Sincronización completada exitosamente en Firestore!`);
  } else {
    console.log(`\n🔍 MODO DRY-RUN: Ejecutá con --apply para confirmar y persistir en Firestore.`);
  }

  const auditPath = path.join(__dirname, `sync-audit-${Date.now()}.json`);
  fs.writeFileSync(auditPath, JSON.stringify({ timestamp: new Date().toISOString(), isApply, toUpdate, toCreate }, null, 2));
  console.log(`📄 Auditoría guardada en: ${auditPath}\n`);
}

main().catch((err) => {
  console.error("❌ Error ejecutando sincronización:", err);
  process.exit(1);
});
