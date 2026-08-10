export interface HistoryOutput {
  name: string;
  mime: string;
  size: number;
  blob: Blob;
  preview?: string;
}

export interface HistoryRecord {
  id: string;
  sourceName: string;
  sourceExt: string;
  sourceSize: number;
  category: string;
  toolId: string;
  target: string;
  fromLabel: string;
  toLabel: string;
  date: number;
  durationMs: number;
  outputCount: number;
  outputTotal: number;
  outputs: HistoryOutput[];
  zip?: HistoryOutput;
  status: "done" | "failed";
}

const DB_NAME = "convertx-history";
const STORE = "records";
const MAX_RECORDS = 40;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const HISTORY_UPDATED_EVENT = "convertx-history-updated";

export function notifyHistoryUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
  }
}

export async function addHistory(record: HistoryRecord): Promise<void> {
  await tx("readwrite", (s) => s.put(record));
  const all = await listHistory();
  if (all.length > MAX_RECORDS) {
    const toRemove = all.slice(MAX_RECORDS);
    for (const r of toRemove) await deleteHistory(r.id);
  }
  notifyHistoryUpdated();
}

export function listHistory(): Promise<HistoryRecord[]> {
  return tx("readonly", (s) => s.getAll());
}

export function deleteHistory(id: string): Promise<void> {
  return tx("readwrite", (s) => s.delete(id)).then(() => notifyHistoryUpdated());
}

export async function clearHistory(): Promise<void> {
  await openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(STORE, "readwrite");
        t.objectStore(STORE).clear();
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      })
  );
  notifyHistoryUpdated();
}

export function downloadOutput(record: HistoryRecord, output: HistoryOutput) {
  const url = URL.createObjectURL(output.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = output.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadZipRecord(record: HistoryRecord) {
  if (!record.zip) return;
  downloadOutput(record, record.zip);
}
