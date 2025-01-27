/**
 * Storage Factory - fabryka do zwracania Storage
 * Jeśli obsługiwany zwracany jest natywny
 * @param {Storage} getStorage: () => localStorage || sessionStorage
 */

const StorageFactory = (getStorage) => {
  let memoryStorage = {};
  let storeIsSupported = null;
  let storage;

  function isSupported() {
    if (storeIsSupported !== null) {
      return storeIsSupported;
    }

    try {
      storage = getStorage();
      const testKey = String(new Date);
      storage.setItem(testKey, testKey);
      const getTestKey = storage.getItem(testKey);
      storage.removeItem(testKey);
      storeIsSupported = getTestKey === testKey;
    } catch (e) {
      storeIsSupported = false;
    }

    return storeIsSupported;
  }

  function clear () {
    if (isSupported()) {
      storage.clear();
    } else {
      memoryStorage = {};
    }
  }

  function getItem (name) {
    if (isSupported()) {
      return storage.getItem(name);
    }
    if (memoryStorage.hasOwnProperty(name)) {
      return memoryStorage[name];
    }
    return null;
  }

  function key (index) {
    if (isSupported()) {
      return storage.key(index);
    } else {
      return Object.keys(memoryStorage)[index] || null;
    }
  }

  function removeItem (name) {
    if (isSupported()) {
      storage.removeItem(name);
    } else {
      delete memoryStorage[name];
    }
  }

  function setItem (name, value) {
    if (isSupported()) {
      storage.setItem(name, value);
    } else {
      memoryStorage[name] = String(value);
    }
  }

  function length() {
    if (isSupported()) {
      return storage.length;
    } else {
      return Object.keys(memoryStorage).length;
    }
  }

  return isSupported()
    ? storage
    : {
      getItem,
      setItem,
      removeItem,
      clear,
      key,
      get length() {
        return length();
      },
    };
};

export default StorageFactory;
export const localStore = StorageFactory(() => localStorage);
export const sessionStore = StorageFactory(() => sessionStorage);
