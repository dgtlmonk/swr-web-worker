
// indexedDB.js
const DB_NAME = "dgtlmonk";
const STORE_NAME = "usersStore";
const OLD_STORE_NAME = "testStore";
const DB_VERSION = 3; 

export function openDB() {
  console.log('opening db...');
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Triggered when the database needs to upgrade (like renaming an object store)
    request.onupgradeneeded = function (event) {
       console.log("Upgrade needed event triggered");
      const db = event.target.result;

      // Check if the old object store exists, and rename it by copying data
      if (db.objectStoreNames.contains(OLD_STORE_NAME)) {
        const oldStore = db.transaction(OLD_STORE_NAME, "readwrite").objectStore(OLD_STORE_NAME);
        const newStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });

        // Copy data from the old store to the new one
        oldStore.openCursor().onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {
            newStore.put(cursor.value); // Add data to the new store
            cursor.continue();
          } else {
            // Once copying is done, delete the old store
            db.deleteObjectStore(OLD_STORE_NAME);
          }
        };
      } else if (!db.objectStoreNames.contains(STORE_NAME)) {
        // If the new store doesn't already exist, create it
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = function (event) {
       console.log("Database opened successfully");
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      console.error("Error opening database:", event.target.error);
      reject(event.target.error);
    };
  });
}

export function getDataFromDB() {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  });
}

export function saveDataToDB(data) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Ensure each item has an 'id' field
      data.forEach((item, index) => {
        if (!item.id) {
          // Assign an 'id' if it's missing (you can generate it based on your logic)
          item.id = Date.now() + index;  // For example, use a timestamp + index
        }
        store.put(item);  // Save the item
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  });
}
