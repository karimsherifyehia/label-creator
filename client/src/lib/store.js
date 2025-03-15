import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAppStore = create()(persist((set) => ({
    // Google integration settings
    googleSheetUrl: localStorage.getItem('googleSheetUrl') || '',
    setGoogleSheetUrl: (url) => {
        localStorage.setItem('googleSheetUrl', url);
        set({ googleSheetUrl: url });
    },
    googleSlideUrl: localStorage.getItem('googleSlideUrl') || '',
    setGoogleSlideUrl: (url) => {
        localStorage.setItem('googleSlideUrl', url);
        set({ googleSlideUrl: url });
    },
    // Printer settings
    availablePrinters: [],
    setAvailablePrinters: (printers) => set({ availablePrinters: printers }),
    selectedPrinter: localStorage.getItem('selectedPrinter')
        ? JSON.parse(localStorage.getItem('selectedPrinter') || '{}')
        : null,
    setSelectedPrinter: (printer) => {
        if (printer) {
            localStorage.setItem('selectedPrinter', JSON.stringify(printer));
        }
        else {
            localStorage.removeItem('selectedPrinter');
        }
        set({ selectedPrinter: printer });
    },
    // PrintNode configuration
    printNodeConfig: localStorage.getItem('printNodeConfig')
        ? JSON.parse(localStorage.getItem('printNodeConfig') || '{}')
        : null,
    setPrintNodeConfig: (config) => {
        if (config) {
            localStorage.setItem('printNodeConfig', JSON.stringify(config));
        }
        else {
            localStorage.removeItem('printNodeConfig');
        }
        set({ printNodeConfig: config });
    },
    // Current item
    currentItem: null,
    setCurrentItem: (item) => set({ currentItem: item }),
    // Barcode scanner
    manualEntry: false,
    setManualEntry: (value) => set({ manualEntry: value }),
    // Print status
    printStatus: 'idle',
    setPrintStatus: (status) => set({ printStatus: status }),
    // Error handling
    error: null,
    setError: (error) => set({ error }),
}), {
    name: 'label-creator-storage',
}));
