/**
 * Professional Thermal 80mm & A4 Cafe Invoice & Receipt Printer
 */

export function printOrderReceipt(order, settings) {
  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) {
    alert('Please allow popups to print receipts.');
    return;
  }

  const itemsHtml = order.items
    .map((item) => {
      const addonsText = item.addons && item.addons.length > 0
        ? `<div style="font-size: 11px; color: #555;">+ ${item.addons.map(a => `${a.name} (₹${a.price})`).join(', ')}</div>`
        : '';
      const notesText = item.notes
        ? `<div style="font-size: 10px; color: #777; font-style: italic;">* ${item.notes}</div>`
        : '';
      const variantText = item.variant && item.variant !== 'Standard'
        ? `<span style="font-size: 11px; color: #666;"> [${item.variant}]</span>`
        : '';

      return `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px dashed #e0e0e0; vertical-align: top;">
            <div style="font-weight: bold;">${item.name}${variantText}</div>
            ${addonsText}
            ${notesText}
            <div style="font-size: 11px; color: #777;">${item.quantity} x ₹${item.unitPrice}</div>
          </td>
          <td style="padding: 6px 0; border-bottom: 1px dashed #e0e0e0; text-align: right; vertical-align: top; font-weight: bold;">
            ₹${item.totalPrice.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join('');

  const taxHalf = (order.taxAmount / 2).toFixed(2);

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt #${order.orderNumber}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #111;
            margin: 0;
            padding: 10px;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          .small { font-size: 10px; color: #444; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 16px; font-weight: bold; text-transform: uppercase;">${settings.cafeName}</div>
          <div class="small">${settings.tagline || ''}</div>
          <div class="small">${settings.address}</div>
          <div class="small">Phone: ${settings.phone}</div>
          <div class="small">GSTIN: ${settings.taxNumber}</div>
        </div>

        <div class="double-divider"></div>

        <div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>INVOICE:</strong> ${order.orderNumber}</span>
            <span><strong>TYPE:</strong> ${(order.orderType || '').toUpperCase()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;" class="small">
            <span>DATE: ${new Date(order.orderTime).toLocaleDateString()}</span>
            <span>TIME: ${new Date(order.orderTime).toLocaleTimeString()}</span>
          </div>
          ${order.tableNumber ? `<div class="small"><strong>TABLE:</strong> ${order.tableNumber}</div>` : ''}
          ${order.customerName ? `<div class="small"><strong>CUSTOMER:</strong> ${order.customerName}</div>` : ''}
          ${order.serverStaff ? `<div class="small"><strong>SERVER:</strong> ${order.serverStaff}</div>` : ''}
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000; font-size: 11px;">
              <th style="text-align: left; padding-bottom: 4px;">ITEM</th>
              <th style="text-align: right; padding-bottom: 4px;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">₹${order.subtotal.toFixed(2)}</td>
          </tr>
          ${order.discountAmount > 0 ? `
            <tr style="color: #000;">
              <td>Discount ${order.couponCode ? `(${order.couponCode})` : ''}:</td>
              <td class="text-right">-₹${order.discountAmount.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr>
            <td class="small">CGST (2.5%):</td>
            <td class="text-right small">₹${taxHalf}</td>
          </tr>
          <tr>
            <td class="small">SGST (2.5%):</td>
            <td class="text-right small">₹${taxHalf}</td>
          </tr>
          ${order.serviceCharge > 0 ? `
            <tr>
              <td class="small">Service Charge (2.5%):</td>
              <td class="text-right small">₹${order.serviceCharge.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr style="font-size: 14px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000;">
            <td style="padding: 6px 0;">GRAND TOTAL:</td>
            <td style="padding: 6px 0;" class="text-right">₹${order.grandTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding-top: 4px;">Payment Method:</td>
            <td style="padding-top: 4px;" class="text-right">${order.paymentMethod || 'Cash'}</td>
          </tr>
          <tr>
            <td>Payment Status:</td>
            <td class="text-right">${order.paymentStatus || 'Paid'}</td>
          </tr>
        </table>

        <div class="double-divider"></div>

        <div class="text-center small">
          <p>${settings.invoiceFooterMessage || 'Thank you for your visit!'}</p>
          <p style="font-size: 9px; margin-top: 6px;">*** CUSTOMER COPY ***</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}
