// Barcode lookup via Open Food Facts API

export interface BarcodeResult {
  found: boolean;
  name?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  quantity?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  'beverages': 'Drinks',
  'drinks': 'Drinks',
  'waters': 'Drinks',
  'sodas': 'Drinks',
  'juices': 'Drinks',
  'tea': 'Drinks',
  'coffee': 'Drinks',
  'milk': 'Dairy',
  'snacks': 'Snacks',
  'chips': 'Snacks',
  'biscuits': 'Snacks',
  'cookies': 'Snacks',
  'chocolate': 'Snacks',
  'candy': 'Snacks',
  'sweets': 'Snacks',
  'cereals': 'Food',
  'noodles': 'Food',
  'pasta': 'Food',
  'rice': 'Food',
  'bread': 'Food',
  'flour': 'Food',
  'canned': 'Food',
  'sauces': 'Food',
  'condiments': 'Food',
  'spices': 'Food',
  'seasonings': 'Food',
  'dairy': 'Dairy',
  'cheese': 'Dairy',
  'yogurt': 'Dairy',
  'butter': 'Dairy',
  'oils': 'Cooking',
  'cooking': 'Cooking',
  'fats': 'Cooking',
  'cleaning': 'Household',
  'detergent': 'Household',
  'soap': 'Household',
  'laundry': 'Household',
  'personal-care': 'Personal Care',
  'hygiene': 'Personal Care',
  'cosmetics': 'Personal Care',
  'beauty': 'Personal Care',
  'shampoo': 'Personal Care',
  'toothpaste': 'Personal Care',
  'baby': 'Baby Products',
  'frozen': 'Frozen Food',
  'meat': 'Meat & Fish',
  'fish': 'Meat & Fish',
  'fruits': 'Fruits & Vegetables',
  'vegetables': 'Fruits & Vegetables',
};

function mapCategory(categoryTags: string[]): string | undefined {
  if (!categoryTags || categoryTags.length === 0) return undefined;

  for (const tag of categoryTags) {
    // tags come as "en:beverages" or "en:sweetened-beverages"
    const cleaned = tag.replace(/^[a-z]{2}:/, '').toLowerCase();

    // Direct match
    if (CATEGORY_MAP[cleaned]) return CATEGORY_MAP[cleaned];

    // Fuzzy: check if any key is contained in the tag or vice versa
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return value;
      }
    }
  }

  return undefined;
}

// In-memory cache
const cache = new Map<string, BarcodeResult>();

export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  // Check cache first
  const cached = cache.get(barcode);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const result: BarcodeResult = { found: false };
      cache.set(barcode, result);
      return result;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product?.product_name) {
      const result: BarcodeResult = { found: false };
      cache.set(barcode, result);
      return result;
    }

    const product = data.product;
    const result: BarcodeResult = {
      found: true,
      name: product.product_name,
      brand: product.brands || undefined,
      category: mapCategory(product.categories_tags || []),
      imageUrl: product.image_front_small_url || undefined,
      quantity: product.quantity || undefined,
    };

    cache.set(barcode, result);
    return result;
  } catch {
    const result: BarcodeResult = { found: false };
    cache.set(barcode, result);
    return result;
  }
}
