import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

let mmkv: any = null;

if (Platform.OS !== 'web') {
  const { MMKV } = require('react-native-mmkv');
  mmkv = new MMKV({ id: 'oja-pos-storage' });
}

// Zustand persist adapter — MMKV on native, localStorage on web
export const zustandStorage: StateStorage = {
  getItem: (name: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name) ?? null;
    }
    return mmkv.getString(name) ?? null;
  },
  setItem: (name: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
    } else {
      mmkv.set(name, value);
    }
  },
  removeItem: (name: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
    } else {
      mmkv.delete(name);
    }
  },
};

// Direct storage helpers for non-Zustand usage (e.g. syncService)
export function getStorageItem(key: string): string | null {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return mmkv.getString(key) ?? null;
}

export function setStorageItem(key: string, value: string): void {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    mmkv.set(key, value);
  }
}

// Supabase-compatible async storage adapter
export const supabaseStorage = {
  getItem: (key: string): string | null => {
    return getStorageItem(key);
  },
  setItem: (key: string, value: string): void => {
    setStorageItem(key, value);
  },
  removeItem: (key: string): void => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      mmkv.delete(key);
    }
  },
};
