/**
 * Get or create a device ID
 * Uses crypto.randomUUID() and stores in localStorage
 * Falls back to sessionStorage if localStorage is unavailable
 */
export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'skinmax_device_id';
  
  // Try localStorage first
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return stored;
      }
    } catch (e) {
      // localStorage might be disabled, try sessionStorage
    }
    
    // Generate new device ID
    const deviceId = crypto.randomUUID();
    
    try {
      localStorage.setItem(STORAGE_KEY, deviceId);
      return deviceId;
    } catch (e) {
      // If localStorage fails, try sessionStorage as fallback
      try {
        sessionStorage.setItem(STORAGE_KEY, deviceId);
        return deviceId;
      } catch (e2) {
        // If both fail, return the ID anyway (it just won't persist)
        console.warn('Could not persist device ID to storage');
        return deviceId;
      }
    }
  }
  
  // Server-side: generate a new ID (won't persist, but that's okay for SSR)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

