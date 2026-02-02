import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { type Sale, formatNaira } from '@/store/retailStore';

export interface PaymentReceiptData {
  customerName: string;
  amountPaid: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: string;
  shopName: string;
  shopPhone?: string;
}

function buildReceiptHtml(sale: Sale, shopName: string, shopPhone?: string): string {
  const receiptNumber = sale.id.slice(-6).toUpperCase();
  const date = new Date(sale.createdAt);
  const dateStr = date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabels: Record<string, string> = {
    cash: 'Cash',
    transfer: 'Transfer',
    pos: 'POS',
    credit: 'Credit',
  };

  const itemRows = sale.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333;">${item.product.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555; text-align: right;">${formatNaira(item.product.sellingPrice)}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333; text-align: right; font-weight: 500;">${formatNaira(item.product.sellingPrice * item.quantity)}</td>
    </tr>`
    )
    .join('');

  const discountSection =
    sale.discount > 0
      ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span style="color: #777; font-size: 13px;">Subtotal</span>
      <span style="color: #333; font-size: 13px;">${formatNaira(sale.subtotal)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span style="color: #e05e1b; font-size: 13px;">Discount</span>
      <span style="color: #e05e1b; font-size: 13px;">-${formatNaira(sale.discount)}</span>
    </div>`
      : '';

  const isCreditSale = sale.paymentMethod === 'credit';
  const previousBalance = sale.customerPreviousBalance ?? 0;
  const newCreditBalance = previousBalance + sale.total;

  const creditBalanceSection = isCreditSale && sale.customerPreviousBalance !== undefined
    ? `
    <div style="border-top: 2px solid #f59e0b; margin-top: 12px; padding-top: 12px;">
      <div style="background: #fef3c7; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
        <p style="color: #92400e; font-size: 13px; font-weight: 700; text-align: center; margin-bottom: 8px;">⚠️ CREDIT SALE</p>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #92400e; font-size: 12px;">Previous Balance</span>
          <span style="color: #92400e; font-size: 12px;">${formatNaira(previousBalance)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #92400e; font-size: 12px;">This Sale</span>
          <span style="color: #92400e; font-size: 12px;">+${formatNaira(sale.total)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #fbbf24; padding-top: 6px; margin-top: 6px;">
          <span style="color: #92400e; font-size: 14px; font-weight: 800;">Total Balance Owed</span>
          <span style="color: #92400e; font-size: 14px; font-weight: 800;">${formatNaira(newCreditBalance)}</span>
        </div>
      </div>
    </div>`
    : '';

  const cashSection =
    sale.paymentMethod === 'cash' && sale.cashReceived && sale.cashReceived > 0
      ? `
    <div style="border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #777; font-size: 12px;">Cash Received</span>
        <span style="color: #333; font-size: 12px;">${formatNaira(sale.cashReceived)}</span>
      </div>
      ${
        sale.changeGiven && sale.changeGiven > 0
          ? `<div style="display: flex; justify-content: space-between;">
        <span style="color: #777; font-size: 12px;">Change</span>
        <span style="color: #333; font-size: 12px;">${formatNaira(sale.changeGiven)}</span>
      </div>`
          : ''
      }
    </div>`
      : '';

  const customerSection =
    sale.customerName
      ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span style="color: #777; font-size: 12px;">Customer</span>
      <span style="color: #333; font-size: 12px;">${sale.customerName}</span>
    </div>`
      : '';

  const staffSection =
    sale.staffName
      ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span style="color: #777; font-size: 12px;">Staff</span>
      <span style="color: #333; font-size: 12px;">${sale.staffName}</span>
    </div>`
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #333; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div style="max-width: 380px; margin: 0 auto; padding: 0;">
    <!-- Header -->
    <div style="background: #e05e1b; padding: 24px 20px; text-align: center;">
      <h1 style="color: #fff; font-size: 22px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px;">${shopName}</h1>
      ${shopPhone ? `<p style="color: rgba(255,255,255,0.85); font-size: 13px;">${shopPhone}</p>` : ''}
    </div>

    <!-- Receipt Info -->
    <div style="padding: 16px 20px; border-bottom: 1px dashed #ddd;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #777; font-size: 12px;">Receipt #</span>
        <span style="color: #333; font-size: 12px; font-weight: 600;">${receiptNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #777; font-size: 12px;">Date</span>
        <span style="color: #333; font-size: 12px;">${dateStr}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #777; font-size: 12px;">Time</span>
        <span style="color: #333; font-size: 12px;">${timeStr}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #777; font-size: 12px;">Payment</span>
        <span style="color: #333; font-size: 12px; font-weight: 500;">${paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span>
      </div>
      ${customerSection}
      ${staffSection}
    </div>

    <!-- Items Table -->
    <div style="padding: 12px 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #e05e1b;">
            <th style="padding: 8px 0; font-size: 11px; color: #999; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
            <th style="padding: 8px 0; font-size: 11px; color: #999; text-align: center; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
            <th style="padding: 8px 0; font-size: 11px; color: #999; text-align: right; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
            <th style="padding: 8px 0; font-size: 11px; color: #999; text-align: right; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding: 12px 20px; border-top: 1px dashed #ddd;">
      ${discountSection}
      <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: ${sale.discount > 0 ? '1px solid #eee' : 'none'}; margin-top: ${sale.discount > 0 ? '6px' : '0'};">
        <span style="color: #333; font-size: 18px; font-weight: 800;">TOTAL</span>
        <span style="color: #e05e1b; font-size: 18px; font-weight: 800;">${formatNaira(sale.total)}</span>
      </div>
      ${cashSection}
      ${creditBalanceSection}
    </div>

    <!-- Footer -->
    <div style="padding: 20px; text-align: center; border-top: 1px dashed #ddd;">
      <p style="color: #555; font-size: 13px; margin-bottom: 8px;">Thank you for your patronage!</p>
      <p style="color: #aaa; font-size: 11px;">Powered by Oja POS &bull; ojapos.app</p>
    </div>
  </div>
</body>
</html>`;
}

export async function generateReceiptPdf(
  sale: Sale,
  shopName: string,
  shopPhone?: string
): Promise<void> {
  const html = buildReceiptHtml(sale, shopName, shopPhone);

  if (Platform.OS === 'web') {
    // Web: open HTML in a new window and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Small delay to let styles render
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  } else {
    // Native: use expo-print to generate PDF, then share
    const { uri } = await Print.printToFileAsync({
      html,
      width: 380,
    });

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Receipt PDF',
        UTI: 'com.adobe.pdf',
      });
    }
  }
}

function buildPaymentReceiptHtml(data: PaymentReceiptData): string {
  const dateStr = new Date().toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const methodLabel = data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1);
  const isCleared = data.newBalance <= 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #333; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div style="max-width: 380px; margin: 0 auto; padding: 0;">
    <!-- Header -->
    <div style="background: #e05e1b; padding: 24px 20px; text-align: center;">
      <h1 style="color: #fff; font-size: 22px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px;">${data.shopName}</h1>
      ${data.shopPhone ? `<p style="color: rgba(255,255,255,0.85); font-size: 13px;">${data.shopPhone}</p>` : ''}
    </div>

    <!-- Title -->
    <div style="padding: 16px 20px; text-align: center; border-bottom: 1px dashed #ddd;">
      <h2 style="color: #e05e1b; font-size: 18px; font-weight: 800; margin-bottom: 8px;">💰 PAYMENT RECEIPT</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #777; font-size: 12px;">Date</span>
        <span style="color: #333; font-size: 12px;">${dateStr}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #777; font-size: 12px;">Time</span>
        <span style="color: #333; font-size: 12px;">${timeStr}</span>
      </div>
    </div>

    <!-- Customer & Payment Details -->
    <div style="padding: 16px 20px; border-bottom: 1px dashed #ddd;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #777; font-size: 13px;">Customer</span>
        <span style="color: #333; font-size: 13px; font-weight: 600;">${data.customerName}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #777; font-size: 13px;">Payment Method</span>
        <span style="color: #333; font-size: 13px; font-weight: 500;">${methodLabel}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #e05e1b; margin-top: 8px;">
        <span style="color: #333; font-size: 18px; font-weight: 800;">AMOUNT PAID</span>
        <span style="color: #10b981; font-size: 18px; font-weight: 800;">${formatNaira(data.amountPaid)}</span>
      </div>
    </div>

    <!-- Balance Section -->
    <div style="padding: 16px 20px; border-bottom: 1px dashed #ddd;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #777; font-size: 13px;">Previous Balance</span>
        <span style="color: #333; font-size: 13px;">${formatNaira(data.previousBalance)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #777; font-size: 13px;">Amount Paid</span>
        <span style="color: #10b981; font-size: 13px;">-${formatNaira(data.amountPaid)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #eee;">
        <span style="color: #333; font-size: 15px; font-weight: 700;">New Balance</span>
        <span style="color: ${isCleared ? '#10b981' : '#ef4444'}; font-size: 15px; font-weight: 700;">${isCleared ? '₦0' : formatNaira(data.newBalance)}</span>
      </div>
    </div>

    ${isCleared ? `
    <!-- Cleared Badge -->
    <div style="padding: 16px 20px; text-align: center;">
      <div style="background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 12px; padding: 12px;">
        <span style="color: #059669; font-size: 16px; font-weight: 700;">✅ BALANCE CLEARED</span>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="padding: 20px; text-align: center; border-top: 1px dashed #ddd;">
      <p style="color: #555; font-size: 13px; margin-bottom: 8px;">Thank you for your payment! 🙏</p>
      <p style="color: #aaa; font-size: 11px;">Powered by Oja POS &bull; ojapos.app</p>
    </div>
  </div>
</body>
</html>`;
}

export async function generatePaymentReceiptPdf(data: PaymentReceiptData): Promise<void> {
  const html = buildPaymentReceiptHtml(data);

  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  } else {
    const { uri } = await Print.printToFileAsync({
      html,
      width: 380,
    });

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Payment Receipt',
        UTI: 'com.adobe.pdf',
      });
    }
  }
}
