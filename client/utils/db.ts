import { openDB, DBSchema } from 'idb';

interface CrisisDB extends DBSchema {
    requests: {
        key: number;
        value: {
            name: string;
            location: {
                latitude: number;
                longitude: number;
            };
            urgentNeeds: string[];
            criticalDetails: string;
            timestamp: number;
            synced: boolean;
        };
        indexes: { 'by-synced': boolean };
    };
}

const DB_NAME = 'crisis-connect-db';
const STORE_NAME = 'requests';

export const initDB = async () => {
    return openDB<CrisisDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('by-synced', 'synced');
            }
        },
    });
};

export const saveRequestOffline = async (request: any) => {
    const db = await initDB();
    return db.add(STORE_NAME, { ...request, timestamp: Date.now(), synced: false });
};

export const getUnsyncedRequests = async () => {
    const db = await initDB();
    return db.getAllFromIndex(STORE_NAME, 'by-synced', false);
};

export const markRequestSynced = async (id: number) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = await store.get(id);
    if (request) {
        request.synced = true;
        await store.put(request);
    }
    await tx.done;
};
