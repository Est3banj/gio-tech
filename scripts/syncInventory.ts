/**
 * Gio-Tech Inventory Sync Script (TypeScript source)
 * Sincroniza el catálogo de productos con la base de datos Firestore.
 */
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

const serviceAccount = require("./service-account.json");
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

export interface RawCatalogItem {
  raw: string;
  marca: "Samsung" | "Apple" | "Xiaomi" | "Tecno" | "Infinix";
  categoria: "Celulares" | "Tablets" | "Laptops";
  contado: number;
  nombre: string;
  specs: {
    almacenamiento: number | null;
    ram: number | null;
    pantalla: number | null;
    bateria: number | null;
    camara: number | null;
  };
  esDestacado?: boolean;
}

export const CATALOG_ITEMS: RawCatalogItem[] = [
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
