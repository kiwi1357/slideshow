import type { Gallery } from '../types';

const DB_NAME = 'SlideshowAppV2';
const STORE_NAME = 'galleries';

export const saveGalleriesToDB = async (galleries: Gallery[]) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME);
    }
  };
  
  return new Promise((resolve) => {
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(galleries, 'all_galleries');
      tx.oncomplete = () => resolve(true);
    };
  });
};

export const loadGalleriesFromDB = async (): Promise<Gallery[]> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const tx = request.result.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get('all_galleries');
      getReq.onsuccess = () => {
        const data = getReq.result || [];
        const formatted = data.map((g: Gallery) => ({
          ...g,
          images: g.images.map(img => ({
            ...img,
            preview: URL.createObjectURL(img.blob)
          }))
        }));
        resolve(formatted);
      };
    };
  });
};