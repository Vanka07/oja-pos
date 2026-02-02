import { useCatalogStore } from '@/store/catalogStore';
import { useRetailStore, type Product } from '@/store/retailStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Platform } from 'react-native';

interface MinimalProduct {
  n: string; // name
  p: number; // price (sellingPrice)
  c: string; // category
}

interface CatalogData {
  shop: string;
  desc: string;
  wa: string;
  products: MinimalProduct[];
}

const CATALOG_BASE_URL = 'https://ojapos.app/catalog.html';
const MAX_URL_LENGTH = 2000;

export function generateCatalogData(): CatalogData | null {
  const catalogStore = useCatalogStore.getState();
  const retailStore = useRetailStore.getState();
  const onboardingStore = useOnboardingStore.getState();

  if (!catalogStore.catalogEnabled) return null;

  const shopName = onboardingStore.shopInfo?.name || 'My Shop';
  const allProducts = retailStore.products;

  // Filter to selected catalog products, or all if none selected
  const selectedIds = catalogStore.catalogProducts;
  const filteredProducts =
    selectedIds.length > 0
      ? allProducts.filter((p) => selectedIds.includes(p.id))
      : allProducts;

  const minimalProducts: MinimalProduct[] = filteredProducts.map((p) => ({
    n: p.name,
    p: p.sellingPrice,
    c: p.category,
  }));

  return {
    shop: shopName,
    desc: catalogStore.shopDescription,
    wa: catalogStore.whatsappNumber,
    products: minimalProducts,
  };
}

export function generateCatalogUrl(): { url: string; truncated: boolean } {
  const data = generateCatalogData();
  if (!data) return { url: '', truncated: false };

  let truncated = false;
  let products = [...data.products];

  // Try encoding, truncate if too long
  const encode = (d: CatalogData) => {
    const json = JSON.stringify(d);
    // Use btoa for web, Buffer-like approach for native
    let base64: string;
    if (Platform.OS === 'web') {
      base64 = btoa(unescape(encodeURIComponent(json)));
    } else {
      // React Native has btoa in newer Hermes
      try {
        base64 = btoa(unescape(encodeURIComponent(json)));
      } catch {
        // Fallback: manual base64
        base64 = encodeBase64(json);
      }
    }
    return `${CATALOG_BASE_URL}#data=${base64}`;
  };

  let url = encode(data);

  // If too long, progressively truncate products
  while (url.length > MAX_URL_LENGTH && products.length > 0) {
    truncated = true;
    products.pop();
    url = encode({ ...data, products });
  }

  return { url, truncated };
}

export function generateShareMessage(): string {
  const { url } = generateCatalogUrl();
  const onboardingStore = useOnboardingStore.getState();
  const shopName = onboardingStore.shopInfo?.name || 'My Shop';

  return `🛒 Check out my products!\n📱 Browse & order here: ${url}\n\n${shopName} — Powered by Oja POS`;
}

// Simple base64 encoder fallback for React Native
function encodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new TextEncoder().encode(str);
  let result = '';
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < len ? chars[b3 & 63] : '=';
  }

  return result;
}
