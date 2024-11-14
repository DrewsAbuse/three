const DB_NAME = 'EntityDB';
const ENTITIES_STORE_NAME = 'entities';

let DB: IDBDatabase | null = null;
const request = indexedDB.open(DB_NAME, 1);

request.onupgradeneeded = event => {
  const db = (event.target as IDBOpenDBRequest).result;
  db.createObjectStore(ENTITIES_STORE_NAME, {keyPath: 'name'});
};
request.onsuccess = () => {
  DB = request.result;
};
request.onerror = () => new Error('IndexedDB failed to open.');

const ensureDbReady = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (DB) {
      resolve(DB);
    } else {
      const checkInterval = setInterval(() => {
        if (DB) {
          clearInterval(checkInterval);
          resolve(DB);
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
        const getEntityDataRequest = store.get(entity);

        getEntityDataRequest.onsuccess = event => {
          const {result} = event.target as IDBRequest;

          return result ? resolve(result.data) : reject(new Error('Entity not found'));
        };

        getEntityDataRequest.onerror = () => reject(new Error('Error getting entity data'));
      })
  );

export const storeEntityData = (entity: string, data: unknown): Promise<void> =>
  ensureDbReady().then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(ENTITIES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(ENTITIES_STORE_NAME);
        const storeEntityDataRequest = store.put({name: entity, data});

        storeEntityDataRequest.onsuccess = () => resolve();
        storeEntityDataRequest.onerror = () => reject(new Error('Error storing entity data'));
      })
  );
