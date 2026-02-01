import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = 1;

interface UpdateState {
  currentVersion: string;
  currentBuild: number;
  lastUpdateCheck: string | null;
  updateAvailable: boolean;
  latestVersion: string | null;
  updateUrl: string | null;
  dismissedVersion: string | null;

  checkForUpdate: () => Promise<boolean>;
  dismissUpdate: (version: string) => void;
}

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set, get) => ({
      currentVersion: APP_VERSION,
      currentBuild: BUILD_NUMBER,
      lastUpdateCheck: null,
      updateAvailable: false,
      latestVersion: null,
      updateUrl: null,
      dismissedVersion: null,

      checkForUpdate: async () => {
        // In production, this would fetch from your server
        // For now, simulating the check
        try {
          // Example: const response = await fetch('https://yourserver.com/api/version');
          // const data = await response.json();

          // Simulated response - in production, replace with actual API call
          const mockServerResponse = {
            version: APP_VERSION, // Same version = no update
            build: BUILD_NUMBER,
            url: 'https://download.oja.app/latest.apk',
            releaseNotes: 'Bug fixes and improvements',
          };

          const hasUpdate = mockServerResponse.build > get().currentBuild;
          const isDismissed = get().dismissedVersion === mockServerResponse.version;

          set({
            lastUpdateCheck: new Date().toISOString(),
            updateAvailable: hasUpdate && !isDismissed,
            latestVersion: hasUpdate ? mockServerResponse.version : null,
            updateUrl: hasUpdate ? mockServerResponse.url : null,
          });

          return hasUpdate && !isDismissed;
        } catch (error) {
          // Silently fail - we're offline-first
          return false;
        }
      },

      dismissUpdate: (version) => {
        set({ dismissedVersion: version, updateAvailable: false });
      },
    }),
    {
      name: 'update-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
