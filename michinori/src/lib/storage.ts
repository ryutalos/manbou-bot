import { openDB, type IDBPDatabase } from "idb";

// ── 永続化レイヤ ──
// モックでは Claude アーティファクトの window.storage (key-value, 非同期) に依存していた。
// 実アプリでは同じ get/set/delete インターフェースを IndexedDB で提供する。
// キー空間はモックと同一: "tabi-index" / "trip:<id>" / "tabi-probe" など。

const DB_NAME = "michinori";
const STORE = "kv";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export interface KVStorage {
  get(key: string): Promise<{ value: string } | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export const storage: KVStorage = {
  async get(key) {
    const db = await getDB();
    const value = await db.get(STORE, key);
    return typeof value === "string" ? { value } : null;
  },
  async set(key, value) {
    const db = await getDB();
    await db.put(STORE, value, key);
  },
  async delete(key) {
    const db = await getDB();
    await db.delete(STORE, key);
  },
};
