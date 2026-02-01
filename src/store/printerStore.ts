import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

export type PaperSize = '58mm' | '80mm';

export interface PrinterDevice {
  name: string;
  address: string; // MAC address or identifier
  type: 'bluetooth' | 'usb' | 'network';
}

export interface PrinterState {
  // Connection
  connectedPrinter: PrinterDevice | null;
  lastConnectedPrinter: PrinterDevice | null;
  isConnected: boolean;
  isConnecting: boolean;
  isScanning: boolean;
  discoveredPrinters: PrinterDevice[];

  // Preferences
  paperSize: PaperSize;
  autoPrintOnSale: boolean;

  // Actions
  setPaperSize: (size: PaperSize) => void;
  setAutoPrintOnSale: (auto: boolean) => void;
  setConnectedPrinter: (printer: PrinterDevice | null) => void;
  setIsConnected: (connected: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
  setIsScanning: (scanning: boolean) => void;
  setDiscoveredPrinters: (printers: PrinterDevice[]) => void;
  addDiscoveredPrinter: (printer: PrinterDevice) => void;
  disconnect: () => void;
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      connectedPrinter: null,
      lastConnectedPrinter: null,
      isConnected: false,
      isConnecting: false,
      isScanning: false,
      discoveredPrinters: [],
      paperSize: '58mm',
      autoPrintOnSale: false,

      setPaperSize: (size) => set({ paperSize: size }),
      setAutoPrintOnSale: (auto) => set({ autoPrintOnSale: auto }),

      setConnectedPrinter: (printer) =>
        set({
          connectedPrinter: printer,
          lastConnectedPrinter: printer || undefined,
          isConnected: !!printer,
          isConnecting: false,
        }),

      setIsConnected: (connected) => set({ isConnected: connected }),
      setIsConnecting: (connecting) => set({ isConnecting: connecting }),
      setIsScanning: (scanning) => set({ isScanning: scanning }),

      setDiscoveredPrinters: (printers) => set({ discoveredPrinters: printers }),
      addDiscoveredPrinter: (printer) =>
        set((state) => {
          const exists = state.discoveredPrinters.some((p) => p.address === printer.address);
          if (exists) return state;
          return { discoveredPrinters: [...state.discoveredPrinters, printer] };
        }),

      disconnect: () =>
        set({
          connectedPrinter: null,
          isConnected: false,
          isConnecting: false,
        }),
    }),
    {
      name: 'printer-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        lastConnectedPrinter: state.lastConnectedPrinter,
        paperSize: state.paperSize,
        autoPrintOnSale: state.autoPrintOnSale,
      }),
    }
  )
);
