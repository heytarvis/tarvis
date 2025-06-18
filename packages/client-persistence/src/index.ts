import {ClientPlugin} from "@tarvis/shared/src/types/client-plugin";
import {ChatUiContext} from "@tarvis/shared/src/types/chat-ui-context.model";
import {effect} from "@preact/signals";
import {AssistantMessage, Thread} from "@tarvis/shared/src/types/conversations";

const DB_NAME = 'chatkit_db';
const STORE_NAME = 'travis_threads';
const DB_VERSION = 1;

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.initPromise = this.initDatabase();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async getDatabase(): Promise<IDBDatabase> {
    await this.initPromise;
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export class PersistencePlugin implements ClientPlugin {
  name = 'persistence';
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async beforeRender(ctx: ChatUiContext): Promise<void> {
    try {
      const db = await this.dbManager.getDatabase();
      const threads = await this.loadThreads(db);
      if (threads) {
        ctx.threads.value = threads;
      }
    } catch (error) {
      console.error('Error loading threads from IndexedDB:', error);
    }
  }

  /**
   * Sets up a subscription for updating the threads in IndexedDB
   * */
  onMessageComplete(message: AssistantMessage, threads?: Thread[]): void {
    if (!threads || threads.length === 0) return;

    console.log('saves threads to IndexedDB', threads);
    this.saveThreads(threads);
  }

  private async loadThreads(db: IDBDatabase): Promise<Thread[] | null> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('threads');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async saveThreads(threads: Thread[]): Promise<void> {
    try {
      const db = await this.dbManager.getDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(threads, 'threads');

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error saving threads to IndexedDB:', error);
    }
  }

  destroy(): void {
    // No need to close the database here anymore since it's managed by the singleton
  }
}

export default PersistencePlugin;
