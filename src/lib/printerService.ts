import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { type Sale, formatNaira } from '@/store/retailStore';
import { type ShopInfo } from '@/store/onboardingStore';
import { type PaperSize } from '@/store/printerStore';

// ── Receipt HTML Generator ─────────────────────────────────────────────

function generateReceiptHTML(
  sale: Sale,
  shopInfo: ShopInfo,
  paperSize: PaperSize = '58mm'
): string {
  const width = paperSize === '58mm' ? '48mm' : '72mm';
  const fontSize = paperSize === '58mm' ? '11px' : '13px';
  const receiptNo = sale.id.slice(-6).toUpperCase();
  const date = new Date(sale.createdAt);
  const dateStr = date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabel =
    sale.paymentMethod === 'pos'
      ? 'POS Terminal'
      : sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1);

  const itemsHTML = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 2px 0; text-align: left;">${item.product.name}</td>
        <td style="padding: 2px 0; text-align: right; white-space: nowrap;">${item.quantity} × ${formatNaira(item.product.sellingPrice)}</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: right; font-weight: 600; padding-bottom: 4px;">${formatNaira(item.product.sellingPrice * item.quantity)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      color: #000;
      background: #fff;
      width: ${width};
      max-width: 100%;
      margin: 0 auto;
      padding: 8px;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .shop-name {
      font-size: ${paperSize === '58mm' ? '14px' : '16px'};
      font-weight: 800;
      margin-bottom: 2px;
    }
    .total-line {
      font-size: ${paperSize === '58mm' ? '14px' : '16px'};
      font-weight: 800;
    }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; }
    .footer { margin-top: 8px; font-size: ${paperSize === '58mm' ? '9px' : '10px'}; color: #666; }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-name">${escapeHtml(shopInfo.name)}</div>
    ${shopInfo.address ? `<div>${escapeHtml(shopInfo.address)}</div>` : ''}
    ${shopInfo.phone ? `<div>Tel: ${escapeHtml(shopInfo.phone)}</div>` : ''}
  </div>

  <hr class="divider">

  <table>
    <tr>
      <td>Receipt #${receiptNo}</td>
      <td class="right">${dateStr}</td>
    </tr>
    <tr>
      <td>Payment: ${paymentLabel}</td>
      <td class="right">${timeStr}</td>
    </tr>
    ${sale.staffName ? `<tr><td colspan="2">Staff: ${escapeHtml(sale.staffName)}</td></tr>` : ''}
    ${sale.customerName ? `<tr><td colspan="2">Customer: ${escapeHtml(sale.customerName)}</td></tr>` : ''}
  </table>

  <hr class="divider">

  <table>
    ${itemsHTML}
  </table>

  <hr class="divider">

  <table>
    <tr>
      <td>Subtotal</td>
      <td class="right">${formatNaira(sale.subtotal)}</td>
    </tr>
    ${
      sale.discount > 0
        ? `<tr>
        <td>Discount</td>
        <td class="right">-${formatNaira(sale.discount)}</td>
      </tr>`
        : ''
    }
    <tr>
      <td class="total-line">TOTAL</td>
      <td class="right total-line">${formatNaira(sale.total)}</td>
    </tr>
    ${
      sale.cashReceived
        ? `<tr>
        <td>Cash Received</td>
        <td class="right">${formatNaira(sale.cashReceived)}</td>
      </tr>`
        : ''
    }
    ${
      sale.changeGiven
        ? `<tr>
        <td>Change</td>
        <td class="right">${formatNaira(sale.changeGiven)}</td>
      </tr>`
        : ''
    }
  </table>

  <hr class="divider">

  <div class="center">
    <div style="margin: 4px 0;">Thank you for your patronage! 🙏</div>
  </div>

  <hr class="divider">

  <div class="center footer">
    <div>Powered by Oja POS</div>
    <div>ojapos.app</div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Test Receipt HTML ──────────────────────────────────────────────────

function generateTestReceiptHTML(shopInfo: ShopInfo, paperSize: PaperSize): string {
  const width = paperSize === '58mm' ? '48mm' : '72mm';
  const fontSize = paperSize === '58mm' ? '11px' : '13px';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      color: #000;
      background: #fff;
      width: ${width};
      max-width: 100%;
      margin: 0 auto;
      padding: 8px;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .shop-name {
      font-size: ${paperSize === '58mm' ? '14px' : '16px'};
      font-weight: 800;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-name">${escapeHtml(shopInfo.name)}</div>
    ${shopInfo.address ? `<div>${escapeHtml(shopInfo.address)}</div>` : ''}
    ${shopInfo.phone ? `<div>Tel: ${escapeHtml(shopInfo.phone)}</div>` : ''}
  </div>

  <hr class="divider">

  <div class="center bold">*** TEST PRINT ***</div>

  <hr class="divider">

  <div>Paper Size: ${paperSize}</div>
  <div>Date: ${new Date().toLocaleString('en-NG')}</div>

  <hr class="divider">

  <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
  <div>abcdefghijklmnopqrstuvwxyz</div>
  <div>0123456789 ₦#@!?</div>

  <hr class="divider">

  <div class="center" style="font-size: 9px; color: #666;">
    <div>Powered by Oja POS</div>
  </div>
</body>
</html>`;
}

// ── Print Functions ─────────────────────────────────────────────────────

/**
 * Print a sale receipt. Uses window.print() on web, expo-print on native.
 */
export async function printReceipt(
  sale: Sale,
  shopInfo: ShopInfo,
  paperSize: PaperSize = '58mm'
): Promise<void> {
  const html = generateReceiptHTML(sale, shopInfo, paperSize);

  if (Platform.OS === 'web') {
    return printHTMLWeb(html);
  }

  // Native: use expo-print
  await Print.printAsync({
    html,
    width: paperSize === '58mm' ? 384 : 576, // 203 DPI thermal printer widths
  });
}

/**
 * Print a test receipt.
 */
export async function printTestReceipt(
  shopInfo: ShopInfo,
  paperSize: PaperSize = '58mm'
): Promise<void> {
  const html = generateTestReceiptHTML(shopInfo, paperSize);

  if (Platform.OS === 'web') {
    return printHTMLWeb(html);
  }

  await Print.printAsync({
    html,
    width: paperSize === '58mm' ? 384 : 576,
  });
}

/**
 * Get receipt HTML for preview purposes.
 */
export function getReceiptHTML(
  sale: Sale,
  shopInfo: ShopInfo,
  paperSize: PaperSize = '58mm'
): string {
  return generateReceiptHTML(sale, shopInfo, paperSize);
}

// ── Web Print Helper ────────────────────────────────────────────────────

function printHTMLWeb(html: string): Promise<void> {
  return new Promise((resolve) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      // Fallback: create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1000);
        }, 250);
      }
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        resolve();
      }, 250);
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } catch {
        // ignore
      }
      resolve();
    }, 2000);
  });
}
