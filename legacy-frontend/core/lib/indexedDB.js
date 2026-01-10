// IndexedDB utilities for offline caching

const DB_NAME = "FlintOfflineDB";
const DB_VERSION = 1;

// Store names
const STORES = {
  PROFILES: "profiles",
  MESSAGES: "messages",
  MESSAGE_QUEUE: "messageQueue",
  MATCHES: "matches",
  AUDIO_CACHE: "audioCache",
};

let db = null;

// Initialize IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Profiles store
      if (!database.objectStoreNames.contains(STORES.PROFILES)) {
        const profileStore = database.createObjectStore(STORES.PROFILES, {
          keyPath: "_id",
        });
        profileStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Messages store
      if (!database.objectStoreNames.contains(STORES.MESSAGES)) {
        const messageStore = database.createObjectStore(STORES.MESSAGES, {
          keyPath: "_id",
        });
        messageStore.createIndex("matchId", "matchId", { unique: false });
        messageStore.createIndex("timestamp", "createdAt", { unique: false });
      }

      // Message queue for offline messages
      if (!database.objectStoreNames.contains(STORES.MESSAGE_QUEUE)) {
        const queueStore = database.createObjectStore(STORES.MESSAGE_QUEUE, {
          keyPath: "localId",
        });
        queueStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Matches store
      if (!database.objectStoreNames.contains(STORES.MATCHES)) {
        const matchStore = database.createObjectStore(STORES.MATCHES, {
          keyPath: "_id",
        });
        matchStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Audio cache store
      if (!database.objectStoreNames.contains(STORES.AUDIO_CACHE)) {
        const audioStore = database.createObjectStore(STORES.AUDIO_CACHE, {
          keyPath: "url",
        });
        audioStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

// Generic get function
export const getFromStore = async (storeName, key) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic get all function
export const getAllFromStore = async (storeName) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic put function
export const putInStore = async (storeName, data) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic delete function
export const deleteFromStore = async (storeName, key) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Clear entire store
export const clearStore = async (storeName) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Profile-specific functions
export const cacheProfiles = async (profiles) => {
  const timestamp = Date.now();
  const promises = profiles.map((profile) =>
    putInStore(STORES.PROFILES, { ...profile, timestamp })
  );
  return Promise.all(promises);
};

export const getCachedProfiles = async () => {
  return getAllFromStore(STORES.PROFILES);
};

// Message-specific functions
export const cacheMessages = async (matchId, messages) => {
  const promises = messages.map((message) =>
    putInStore(STORES.MESSAGES, message)
  );
  return Promise.all(promises);
};

export const getCachedMessages = async (matchId) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.MESSAGES], "readonly");
    const store = transaction.objectStore(STORES.MESSAGES);
    const index = store.index("matchId");
    const request = index.getAll(matchId);

    request.onsuccess = () => {
      // Sort by createdAt ascending (oldest first)
      const messages = request.result.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      resolve(messages);
    };
    request.onerror = () => reject(request.error);
  });
};

// Message queue functions
export const addToMessageQueue = async (message) => {
  const queueItem = {
    ...message,
    localId: message.localId || `local_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
    status: "pending",
  };
  await putInStore(STORES.MESSAGE_QUEUE, queueItem);
  return queueItem;
};

export const getMessageQueue = async () => {
  return getAllFromStore(STORES.MESSAGE_QUEUE);
};

export const removeFromMessageQueue = async (localId) => {
  return deleteFromStore(STORES.MESSAGE_QUEUE, localId);
};

// Match-specific functions
export const cacheMatches = async (matches) => {
  const timestamp = Date.now();
  const promises = matches.map((match) =>
    putInStore(STORES.MATCHES, { ...match, timestamp })
  );
  return Promise.all(promises);
};

export const getCachedMatches = async () => {
  return getAllFromStore(STORES.MATCHES);
};

// Audio cache functions
export const cacheAudio = async (url, blob) => {
  const audioData = {
    url,
    blob,
    timestamp: Date.now(),
  };
  return putInStore(STORES.AUDIO_CACHE, audioData);
};

export const getCachedAudio = async (url) => {
  return getFromStore(STORES.AUDIO_CACHE, url);
};

// Clean old cache (older than 7 days)
export const cleanOldCache = async () => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const storeName of Object.values(STORES)) {
    const database = await initDB();
    const transaction = database.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    if (store.indexNames.contains("timestamp")) {
      const index = store.index("timestamp");
      const range = IDBKeyRange.upperBound(sevenDaysAgo);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }
};

export { STORES };
