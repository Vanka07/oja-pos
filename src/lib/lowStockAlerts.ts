import { Linking, Platform } from 'react-native';
import { useRetailStore } from '@/store/retailStore';

export function getLowStockProducts() {
  const state = useRetailStore.getState();
  return state.products.filter((p) => p.quantity <= p.lowStockThreshold);
}

export function formatLowStockMessage(products: { name: string; quantity: number }[]): string {
  if (products.length === 0) return '';
  const lines = products.map((p) => `${p.name}: ${p.quantity} left`);
  return `⚠️ Oja Low Stock Alert\n\n${lines.join('\n')}\n\nRestock soon!`;
}

export async function checkAndSendLowStockAlerts(phoneNumber: string): Promise<boolean> {
  const lowStockProducts = getLowStockProducts();
  if (lowStockProducts.length === 0) return false;

  const message = formatLowStockMessage(lowStockProducts);
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');

  // Try WhatsApp app deep link first
  const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
  const webFallback = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Linking.openURL(webFallback);
    }
    return true;
  } catch {
    // Final fallback
    try {
      await Linking.openURL(webFallback);
      return true;
    } catch {
      return false;
    }
  }
}

export function checkSoldProductsLowStock(
  soldProductIds: string[]
): { name: string; quantity: number }[] {
  const state = useRetailStore.getState();
  return state.products
    .filter((p) => soldProductIds.includes(p.id) && p.quantity <= p.lowStockThreshold)
    .map((p) => ({ name: p.name, quantity: p.quantity }));
}
