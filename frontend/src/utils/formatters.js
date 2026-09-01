/**
 * Frontend Formatting & Calculation Utilities
 */

export function formatCurrency(amount, currency = '₹') {
  const num = Number(amount || 0);
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatTime(timeString) {
  if (!timeString) return '';
  try {
    const d = new Date(timeString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return timeString;
  } catch (e) {
    return timeString;
  }
}

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(dateString);
  } catch (e) {
    return dateString;
  }
}
