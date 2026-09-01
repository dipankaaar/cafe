import QRCode from 'qrcode';

/**
 * Service for generating QR Data URLs and opening high-contrast Table Tent Print Dialogs
 */
export const qrPrintService = {
  /**
   * Generate QR Code as Base64 Data URL
   */
  async generateDataUrl(text, options = {}) {
    try {
      return await QRCode.toDataURL(text, {
        width: options.width || 450,
        margin: options.margin || 2,
        color: {
          dark: options.dark || '#000000',
          light: options.light || '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      throw err;
    }
  },

  /**
   * Generate Ordering URL for a table token
   */
  getOrderingUrl(qrToken) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/#order/${qrToken}`;
  },

  /**
   * Download a Single Table QR Code as PNG
   */
  async downloadQrPng(table) {
    const url = this.getOrderingUrl(table.qrToken);
    const dataUrl = await this.generateDataUrl(url, { width: 600 });
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Dinenos_QR_${table.tableNumber.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Open Print Dialog for a Single Table QR Tent Card
   */
  async printSingleTable(table, settings = {}) {
    const url = this.getOrderingUrl(table.qrToken);
    const qrDataUrl = await this.generateDataUrl(url, { width: 500 });
    const cafeName = settings.cafeName || 'Dinenos Coffee House';

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Popup blocker prevented print window from opening. Please allow popups.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR - Table ${table.tableNumber} - ${cafeName}</title>
        <style>
          @page {
            size: A5 portrait;
            margin: 10mm;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fdfdfd;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .tent-card {
            width: 100%;
            max-width: 420px;
            background: #ffffff;
            border: 2px solid #111111;
            border-radius: 20px;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            position: relative;
          }
          .tent-card::before {
            content: '';
            position: absolute;
            top: 6px; left: 6px; right: 6px; bottom: 6px;
            border: 1px dashed #DD5903;
            border-radius: 14px;
            pointer-events: none;
          }
          .brand-logo {
            font-family: Georgia, 'Arapey', serif;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #111111;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .brand-sub {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #DD5903;
            font-weight: 700;
            margin-bottom: 24px;
          }
          .table-badge {
            display: inline-block;
            background: #111111;
            color: #ffffff;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 1px;
            padding: 8px 24px;
            border-radius: 50px;
            margin-bottom: 22px;
          }
          .table-zone {
            font-size: 13px;
            color: #666666;
            margin-top: -16px;
            margin-bottom: 20px;
            font-weight: 500;
          }
          .qr-wrapper {
            background: #ffffff;
            padding: 14px;
            display: inline-block;
            border: 2px solid #eeeeee;
            border-radius: 16px;
            margin-bottom: 22px;
          }
          .qr-img {
            width: 240px;
            height: 240px;
            display: block;
          }
          .scan-heading {
            font-size: 18px;
            font-weight: 800;
            color: #111111;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .scan-instruction {
            font-size: 12px;
            color: #555555;
            line-height: 1.5;
            margin-bottom: 20px;
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
          }
          .footer-info {
            border-top: 1px solid #eeeeee;
            padding-top: 14px;
            display: flex;
            justify-content: space-around;
            font-size: 11px;
            color: #777777;
            font-weight: 600;
          }
          .footer-item span {
            color: #111111;
          }
        </style>
      </head>
      <body>
        <div class="tent-card">
          <div class="brand-logo">☕ DINENOS</div>
          <div class="brand-sub">ARTISANAL COFFEE HOUSE & BISTRO</div>
          
          <div class="table-badge">TABLE ${table.tableNumber}</div>
          <div class="table-zone">${table.zone || 'Indoor Cafe'} • Seats ${table.capacity || 4}</div>

          <div class="qr-wrapper">
            <img src="${qrDataUrl}" alt="Table ${table.tableNumber} QR" class="qr-img" />
          </div>

          <div class="scan-heading">📷 SCAN TO ORDER & PAY</div>
          <div class="scan-instruction">
            Open your smartphone camera or Google Lens to explore our menu, customize ingredients, and order directly from your table.
          </div>

          <div class="footer-info">
            <div class="footer-item">📶 Wi-Fi: <span>Dinenos_Guest</span></div>
            <div class="footer-item">⚡ High-Speed Ordering</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  /**
   * Bulk Print All Active Table QR Cards
   */
  async printAllTables(tables, settings = {}) {
    if (!tables || tables.length === 0) return;
    const cafeName = settings.cafeName || 'Dinenos Coffee House';

    const cardsHtmlPromises = tables.map(async (table) => {
      const url = this.getOrderingUrl(table.qrToken);
      const qrDataUrl = await this.generateDataUrl(url, { width: 500 });

      return `
        <div class="tent-card-page">
          <div class="tent-card">
            <div class="brand-logo">☕ DINENOS</div>
            <div class="brand-sub">ARTISANAL COFFEE HOUSE & BISTRO</div>
            
            <div class="table-badge">TABLE ${table.tableNumber}</div>
            <div class="table-zone">${table.zone || 'Indoor Cafe'} • Capacity: ${table.capacity || 4} Guests</div>

            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="Table ${table.tableNumber} QR" class="qr-img" />
            </div>

            <div class="scan-heading">📷 SCAN TO ORDER & PAY</div>
            <div class="scan-instruction">
              Open your phone camera to view our live artisanal menu, customize drinks, and submit orders directly to our kitchen.
            </div>

            <div class="footer-info">
              <div class="footer-item">📶 Wi-Fi: <span>Dinenos_Guest</span></div>
              <div class="footer-item">⚡ Table Self-Service</div>
            </div>
          </div>
        </div>
      `;
    });

    const cardsHtml = (await Promise.all(cardsHtmlPromises)).join('');

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Popup blocker prevented print window from opening. Please allow popups.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk Print Table QRs - ${cafeName}</title>
        <style>
          @page {
            size: A5 portrait;
            margin: 0;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            margin: 0;
            padding: 0;
          }
          .tent-card-page {
            width: 100vw;
            height: 100vh;
            page-break-after: always;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .tent-card {
            width: 100%;
            max-width: 420px;
            background: #ffffff;
            border: 2px solid #111111;
            border-radius: 20px;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            position: relative;
          }
          .tent-card::before {
            content: '';
            position: absolute;
            top: 6px; left: 6px; right: 6px; bottom: 6px;
            border: 1px dashed #DD5903;
            border-radius: 14px;
            pointer-events: none;
          }
          .brand-logo {
            font-family: Georgia, 'Arapey', serif;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #111111;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .brand-sub {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #DD5903;
            font-weight: 700;
            margin-bottom: 24px;
          }
          .table-badge {
            display: inline-block;
            background: #111111;
            color: #ffffff;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 1px;
            padding: 8px 24px;
            border-radius: 50px;
            margin-bottom: 22px;
          }
          .table-zone {
            font-size: 13px;
            color: #666666;
            margin-top: -16px;
            margin-bottom: 20px;
            font-weight: 500;
          }
          .qr-wrapper {
            background: #ffffff;
            padding: 14px;
            display: inline-block;
            border: 2px solid #eeeeee;
            border-radius: 16px;
            margin-bottom: 22px;
          }
          .qr-img {
            width: 240px;
            height: 240px;
            display: block;
          }
          .scan-heading {
            font-size: 18px;
            font-weight: 800;
            color: #111111;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .scan-instruction {
            font-size: 12px;
            color: #555555;
            line-height: 1.5;
            margin-bottom: 20px;
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
          }
          .footer-info {
            border-top: 1px solid #eeeeee;
            padding-top: 14px;
            display: flex;
            justify-content: space-around;
            font-size: 11px;
            color: #777777;
            font-weight: 600;
          }
          .footer-item span {
            color: #111111;
          }
        </style>
      </head>
      <body>
        ${cardsHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
