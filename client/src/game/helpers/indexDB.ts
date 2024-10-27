const DB_NAME = 'EntityDB';
const ENTITIES_STORE_NAME = 'entities';

let db: IDBDatabase | null = null;
const request = indexedDB.open(DB_NAME, 1);
request.onupgradeneeded = event => {
  const db = (event.target as IDBOpenDBRequest).result;
  db.createObjectStore(ENTITIES_STORE_NAME, {keyPath: 'name'});
};
request.onsuccess = () => {
  db = request.result;
};
request.onerror = () => new Error('IndexedDB failed to open.');

const ensureDbReady = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
    } else {
      const checkInterval = setInterval(() => {
        if (db) {
          clearInterval(checkInterval);
          resolve(db);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('IndexedDB initialization timed out.'));
      }, 5000); // Timeout after 5 seconds
    }
  });

export const getEntityData = (entity: string): Promise<unknown> =>
  ensureDbReady().then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(ENTITIES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(ENTITIES_STORE_NAME);
        const request = store.get(entity);

        request.onsuccess = event => {
          const {result} = event.target as IDBRequest;
          result ? resolve(result.data) : reject('Entity not found');
        };

        request.onerror = () => reject('Error fetching entity');
      })
  );

export const storeEntityData = (entity: string, data: unknown): Promise<void> =>
  ensureDbReady().then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(ENTITIES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(ENTITIES_STORE_NAME);
        const request = store.put({name: entity, data});

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error storing entity data');
      })
  );
