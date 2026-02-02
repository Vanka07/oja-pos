import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';

export default function OfflineBar() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    // Check initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (Platform.OS !== 'web') return null;

  if (showBackOnline) {
    return (
      <View
        style={{
          backgroundColor: '#16a34a',
          paddingVertical: 6,
          paddingHorizontal: 16,
          alignItems: 'center',
          zIndex: 9998,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
          Back online ✓
        </Text>
      </View>
    );
  }

  if (!isOffline) return null;

  return (
    <View
      style={{
        backgroundColor: '#d97706',
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: 'center',
        zIndex: 9998,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
        📡 You're offline — sales still work!
      </Text>
    </View>
  );
}
