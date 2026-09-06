import React from 'react';
import QrTableOrderingView from './QrTableOrderingView';

/**
 * TableOrder — public "Order from Table" page.
 * Route: /order/:qrToken (no login, no admin shell — see App.jsx).
 *
 * Flow:
 *  1. Reads `qrToken` from the URL.
 *  2. Fetches table via GET /api/tables/qr/validate/:token.
 *  3. Shows "You are ordering from Table Tn" banner + full menu w/ category
 *     filter + cart + name/phone-only checkout (POST /api/orders dine-in).
 *  4. After ordering, shows live tracker + "Call Waiter" button
 *     (POST /api/notifications).
 *  5. Invalid/expired QR renders a friendly error with a way back home.
 */
export default function TableOrder({ qrToken, onBackToStorefront }) {
  return (
    <QrTableOrderingView
      qrToken={qrToken}
      onBackToStorefront={onBackToStorefront}
    />
  );
}
