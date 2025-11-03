/**
 * WalletConnect Storage Adapter - 内存存储版本
 * 使用内存存储避免 AsyncStorage 的兼容性问题
 * 注意：应用重启后会话会丢失，但可以避免初始化错误
 */

export class WalletConnectStorage {
  private store: Map<string, any> = new Map();

  async getKeys(): Promise<string[]> {
    try {
      const keys = Array.from(this.store.keys());
      console.log('📦 Storage getKeys:', keys.length, 'keys');
      return keys;
    } catch (error) {
      console.error('Storage getKeys error:', error);
      return [];
    }
  }

  async getEntries<T = any>(): Promise<[string, T][]> {
    try {
      const entries = Array.from(this.store.entries()) as [string, T][];
      console.log('📦 Storage getEntries:', entries.length, 'entries');
      return entries;
    } catch (error) {
      console.error('Storage getEntries error:', error);
      return [];
    }
  }

  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const value = this.store.get(key);
      if (value === undefined) {
        return null;
      }
      console.log('📖 Storage getItem:', key, '- found:', !!value);
      return value as T;
    } catch (error) {
      console.error(`Storage getItem error for key ${key}:`, error);
      return null;
    }
  }

  async setItem<T = any>(key: string, value: T): Promise<void> {
    try {
      this.store.set(key, value);
      console.log('💾 Storage setItem:', key);
    } catch (error) {
      console.error(`Storage setItem error for key ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.store.delete(key);
      console.log('🗑️ Storage removeItem:', key);
    } catch (error) {
      console.error(`Storage removeItem error for key ${key}:`, error);
    }
  }
}

export const walletConnectStorage = new WalletConnectStorage();
