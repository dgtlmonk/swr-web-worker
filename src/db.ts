
// indexedDB.js
const DB_NAME = "dgtlmonk";
const STORE_NAME = "usersStore_v8";
const OLD_STORE_NAME = "usersStore_v7";
const DB_VERSION = 8; 

export function openDB() {
  console.log('opening db...');
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Triggered when the database needs to upgrade (like renaming an object store)
    request.onupgradeneeded = function (event) {
       console.log("Upgrade needed event triggered");
      const db = event.target.result;

       if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
        console.log("Object store created");
      }

      if (db.objectStoreNames.contains(OLD_STORE_NAME)) {
        
       db.deleteObjectStore(OLD_STORE_NAME);
        // console.log("Old store found, starting migration...");
        // const transaction = event.target.transaction;
        // const oldStore = transaction.objectStore(OLD_STORE_NAME);
        //
        // // Create the new store
        // const newStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        //
        // // Copy data from the old store
        // oldStore.openCursor().onsuccess = function (event) {
        //   const cursor = event.target.result;
        //   if (cursor) {
        //     console.log("Copying record:", cursor.value);
        //     const putRequest = newStore.put(cursor.value);
        //     putRequest.onsuccess = function () {
        //       console.log("Record successfully copied");
        //     };
        //     putRequest.onerror = function () {
        //       console.error("Error copying record:", putRequest.error);
        //     };
        //     cursor.continue();
        //   } else {
        //     console.log("Migration completed, deleting old store");
        //     db.deleteObjectStore(OLD_STORE_NAME);
        //   }
        // };

        
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
