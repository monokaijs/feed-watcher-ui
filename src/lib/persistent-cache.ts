interface PersistentCacheEntry {
  data: any;
  timestamp: number;
  etag?: string;
  expiresAt: number;
}

class PersistentCache {
  private readonly prefix = 'feed-watcher-cache:';
  private readonly maxSize = 50; // Maximum number of cached items
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set(key: string, data: any, ttl: number = this.defaultTTL, etag?: string): void {
    if (typeof window === 'undefined') return;

    try {
      const entry: PersistentCacheEntry = {
        data,
        timestamp: Date.now(),
        etag,
        expiresAt: Date.now() + ttl,
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
      this.cleanup();
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // If localStorage is full, try to clear some space
      this.cleanup(true);
    }
  }

  get(key: string): any | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const entry: PersistentCacheEntry = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      this.delete(key);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }

  private cleanup(aggressive: boolean = false): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    const entries: Array<{ key: string; entry: PersistentCacheEntry }> = [];

    // Collect all cache entries
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry = JSON.parse(item);
          entries.push({ key, entry });
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    });

    // Remove expired entries
    const now = Date.now();
    entries.forEach(({ key, entry }) => {
      if (now > entry.expiresAt) {
        localStorage.removeItem(key);
      }
    });

    // If aggressive cleanup or too many entries, remove oldest
    const validEntries = entries.filter(({ entry }) => now <= entry.expiresAt);
    if (aggressive || validEntries.length > this.maxSize) {
      // Sort by timestamp (oldest first)
      validEntries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
      
      const toRemove = aggressive 
        ? Math.floor(validEntries.length / 2) 
        : validEntries.length - this.maxSize;

      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(validEntries[i].key);
      }
    }
  }

  getStats(): { size: number; totalSize: string; entries: Array<{ key: string; age: number; size: string }> } {
    if (typeof window === 'undefined') {
      return { size: 0, totalSize: '0 B', entries: [] };
    }

    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    let totalBytes = 0;
    const entries = keys.map(key => {
      const item = localStorage.getItem(key) || '';
      const bytes = new Blob([item]).size;
      totalBytes += bytes;

      try {
        const entry = JSON.parse(item);
        return {
          key: key.replace(this.prefix, ''),
          age: Date.now() - entry.timestamp,
          size: this.formatBytes(bytes),
        };
      } catch {
        return {
          key: key.replace(this.prefix, ''),
          age: 0,
          size: this.formatBytes(bytes),
        };
      }
    });

    return {
      size: keys.length,
      totalSize: this.formatBytes(totalBytes),
      entries,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export const persistentCache = new PersistentCache();
