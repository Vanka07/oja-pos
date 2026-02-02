import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Check if already dismissed
    try {
      if (localStorage.getItem('oja-install-dismissed')) return;
    } catch {}

    // Check if already installed (standalone mode)
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

    if (isiOS && isSafari) {
      setIsIOS(true);
      setShowPrompt(true);
      return;
    }

    // Listen for Android Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!showPrompt) return;
    const timer = setTimeout(() => dismiss(), 10000);
    return () => clearTimeout(timer);
  }, [showPrompt]);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    try {
      localStorage.setItem('oja-install-dismissed', '1');
    } catch {}
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
    dismiss();
  }, [deferredPrompt, dismiss]);

  if (!showPrompt || Platform.OS !== 'web') return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#1c1917',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
        borderWidth: 1,
        borderColor: '#292524',
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: '#fafaf9', fontSize: 15, fontWeight: '600' }}>
          📱 Install Oja POS
        </Text>
        <Text style={{ color: '#a8a29e', fontSize: 12, marginTop: 2 }}>
          {isIOS
            ? 'Tap Share → Add to Home Screen'
            : 'Get the full app experience'}
        </Text>
      </View>

      {!isIOS && (
        <Pressable
          onPress={handleInstall}
          style={{
            backgroundColor: '#e05e1b',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
            Install
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={dismiss}
        style={{ marginLeft: 12, padding: 4 }}
      >
        <Text style={{ color: '#78716c', fontSize: 18, fontWeight: '600' }}>✕</Text>
      </Pressable>
    </View>
  );
}
