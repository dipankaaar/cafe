import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { dbService, DB_KEYS } from '../services/dbService';
import {
  initialCafeSettings,
  initialCategories,
  initialAddons,
  initialProducts,
  initialTables,
  initialCustomers,
  initialCoupons,
  initialInventory,
  initialSuppliers,
  initialPurchases,
  initialExpenses,
  initialStaff,
  initialReservations,
  initialOrders,
  initialAuditLogs,
  initialNotifications
} from '../services/seedData';
import { validateAndCalculateCoupon } from '../services/couponValidator';
import { normalizeOrderStatus, generateOrderNumber } from '../utils/orderStatus';
import { useAuth } from './AuthContext';
import { playNewOrderChime } from '../services/soundService';

export function normalizeProduct(p) {
  if (!p) return p;
  const sellingPrice = Number(p.sellingPrice ?? p.price ?? 0);
  const tablePrice = p.tablePrice !== undefined && p.tablePrice !== null && p.tablePrice !== ''
    ? Number(p.tablePrice)
    : sellingPrice;
  const onlinePrice = p.onlinePrice !== undefined && p.onlinePrice !== null && p.onlinePrice !== ''
    ? Number(p.onlinePrice)
    : sellingPrice;
  const tableEnabled = p.tableEnabled !== undefined
    ? Boolean(p.tableEnabled)
    : (p.table_enabled !== undefined ? Boolean(p.table_enabled) : true);
  const onlineEnabled = p.onlineEnabled !== undefined
    ? Boolean(p.onlineEnabled)
    : (p.online_enabled !== undefined ? Boolean(p.online_enabled) : true);

  return {
    ...p,
    sellingPrice,
    tablePrice,
    onlinePrice,
    tableEnabled,
    onlineEnabled
  };
}

const CafeContext = createContext();

export function CafeProvider({ children }) {
  const { currentUser } = useAuth();
  const userName = currentUser ? `${currentUser.name} (${currentUser.role})` : 'System';

  // State slices initialized from local cache or seed data
  const [settings, setSettings] = useState(() => {
    const cached = dbService.get(DB_KEYS.SETTINGS, initialCafeSettings);
    if (!cached || cached.cafeName?.includes('Dinenos') || cached.address?.includes('Brisbane')) {
      return { 
        ...initialCafeSettings, 
        ...cached, 
        cafeName: 'Petuk Adda Cafe', 
        tagline: initialCafeSettings.tagline,
        address: initialCafeSettings.address, 
        phone: initialCafeSettings.phone, 
        altPhone: initialCafeSettings.altPhone,
        email: initialCafeSettings.email, 
        openingHours: initialCafeSettings.openingHours,
        deliveryArea: initialCafeSettings.deliveryArea,
        invoicePrefix: 'DN-'
      };
    }
    return cached;
  });
  const [categories, setCategories] = useState(() => {
    const cached = dbService.get(DB_KEYS.CATEGORIES, initialCategories);
    if (!cached || !cached.length || cached.some(c => c.id === 'cat-1' || c.name === 'Hot Coffee')) {
      dbService.set(DB_KEYS.CATEGORIES, initialCategories);
      return initialCategories;
    }
    return cached;
  });
  const [addons, setAddons] = useState(() => dbService.get(DB_KEYS.ADDONS, initialAddons));
  const [products, setProducts] = useState(() => {
    const cached = dbService.get(DB_KEYS.PRODUCTS, initialProducts);
    if (!cached || !cached.length || cached.some(p => p.id === 'prod-1' || p.name === 'Classic Latte' || p.id === 'prod-12')) {
      const normalized = initialProducts.map(normalizeProduct);
      dbService.set(DB_KEYS.PRODUCTS, normalized);
      return normalized;
    }
    return cached.map(normalizeProduct);
  });
  const [tables, setTables] = useState(() => dbService.get(DB_KEYS.TABLES, initialTables));
  const [customers, setCustomers] = useState(() => dbService.get(DB_KEYS.CUSTOMERS, initialCustomers));
  const [coupons, setCoupons] = useState(() => dbService.get(DB_KEYS.COUPONS, initialCoupons));
  const [inventory, setInventory] = useState(() => dbService.get(DB_KEYS.INVENTORY, initialInventory));
  const [suppliers, setSuppliers] = useState(() => dbService.get(DB_KEYS.SUPPLIERS, initialSuppliers));
  const [purchases, setPurchases] = useState(() => dbService.get(DB_KEYS.PURCHASES, initialPurchases));
  const [expenses, setExpenses] = useState(() => dbService.get(DB_KEYS.EXPENSES, initialExpenses));
  const [staff, setStaff] = useState(() => dbService.get(DB_KEYS.STAFF, initialStaff));
  const [reservations, setReservations] = useState(() => dbService.get(DB_KEYS.RESERVATIONS, initialReservations));
  const [orders, setOrders] = useState(() => dbService.get(DB_KEYS.ORDERS, initialOrders));
  const [auditLogs, setAuditLogs] = useState(() => dbService.get(DB_KEYS.AUDIT_LOGS, initialAuditLogs));
  const [notifications, setNotifications] = useState(() => dbService.get(DB_KEYS.NOTIFICATIONS, initialNotifications));
  // Multi-branch: outlet registry + admin's active scope ('all' = every outlet)
  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(() => {
    try {
      return localStorage.getItem('petuk_active_branch_v1') || 'all';
    } catch { return 'all'; }
  });

  const switchBranch = useCallback((branchId) => {
    const next = branchId || 'all';
    setActiveBranchId(next);
    try { localStorage.setItem('petuk_active_branch_v1', next); } catch { /* private mode */ }
  }, []);

  // Live new order popup queue for kitchen & cashier alert
  const [newOrderAlertQueue, setNewOrderAlertQueue] = useState([]);

  const dismissNewOrderAlert = useCallback((orderId) => {
    setNewOrderAlertQueue((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const triggerNewOrderAlert = useCallback((order) => {
    playNewOrderChime();
    setNewOrderAlertQueue((prev) => {
      if (prev.some((o) => o.id === order.id)) return prev;
      return [...prev, order];
    });
  }, []);

  // Sync to database
  useEffect(() => { dbService.set(DB_KEYS.SETTINGS, settings); }, [settings]);
  useEffect(() => { dbService.set(DB_KEYS.CATEGORIES, categories); }, [categories]);
  useEffect(() => { dbService.set(DB_KEYS.ADDONS, addons); }, [addons]);
  useEffect(() => { dbService.set(DB_KEYS.PRODUCTS, products); }, [products]);
  useEffect(() => { dbService.set(DB_KEYS.TABLES, tables); }, [tables]);
  useEffect(() => { dbService.set(DB_KEYS.CUSTOMERS, customers); }, [customers]);
  useEffect(() => { dbService.set(DB_KEYS.COUPONS, coupons); }, [coupons]);
  useEffect(() => { dbService.set(DB_KEYS.INVENTORY, inventory); }, [inventory]);
  useEffect(() => { dbService.set(DB_KEYS.SUPPLIERS, suppliers); }, [suppliers]);
  useEffect(() => { dbService.set(DB_KEYS.PURCHASES, purchases); }, [purchases]);
  useEffect(() => { dbService.set(DB_KEYS.EXPENSES, expenses); }, [expenses]);
  useEffect(() => { dbService.set(DB_KEYS.STAFF, staff); }, [staff]);
  useEffect(() => { dbService.set(DB_KEYS.RESERVATIONS, reservations); }, [reservations]);
  useEffect(() => { dbService.set(DB_KEYS.ORDERS, orders); }, [orders]);
  useEffect(() => { dbService.set(DB_KEYS.AUDIT_LOGS, auditLogs); }, [auditLogs]);
  useEffect(() => { dbService.set(DB_KEYS.NOTIFICATIONS, notifications); }, [notifications]);

  // Load from backend SQLite API on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [
          fetchedProducts,
          fetchedCategories,
          fetchedAddons,
          fetchedOrders,
          fetchedTables,
          fetchedReservations,
          fetchedCustomers,
          fetchedCoupons,
          fetchedInventory,
          fetchedSuppliers,
          fetchedPurchases,
          fetchedExpenses,
          fetchedStaff,
          fetchedNotifs,
          fetchedLogs,
          fetchedSettings,
          fetchedBranches
        ] = await Promise.all([
          api.getProducts().catch(() => null),
          api.getCategories().catch(() => null),
          api.getAddons().catch(() => null),
          api.getOrders().catch(() => null),
          api.getTables().catch(() => null),
          api.getReservations().catch(() => null),
          api.getCustomers().catch(() => null),
          api.getCoupons().catch(() => null),
          api.getInventory().catch(() => null),
          api.getSuppliers().catch(() => null),
          api.getPurchases().catch(() => null),
          api.getExpenses().catch(() => null),
          api.getStaff().catch(() => null),
          api.getNotifications().catch(() => null),
          api.getAuditLogs().catch(() => null),
          api.getSettings().catch(() => null),
          api.getBranches().catch(() => null)
        ]);

        if (fetchedProducts && fetchedProducts.length > 0) setProducts(fetchedProducts.map(normalizeProduct));
        if (fetchedCategories && fetchedCategories.length > 0) setCategories(fetchedCategories);
        if (fetchedAddons && fetchedAddons.length > 0) setAddons(fetchedAddons);
        if (fetchedOrders && fetchedOrders.length > 0) {
          setOrders(fetchedOrders.map((o) => ({ ...o, status: normalizeOrderStatus(o.status) })));
        }
        if (fetchedTables && fetchedTables.length > 0) setTables(fetchedTables);
        if (fetchedReservations && fetchedReservations.length > 0) setReservations(fetchedReservations);
        if (fetchedCustomers && fetchedCustomers.length > 0) setCustomers(fetchedCustomers);
        if (fetchedCoupons && fetchedCoupons.length > 0) setCoupons(fetchedCoupons);
        if (fetchedInventory && fetchedInventory.length > 0) setInventory(fetchedInventory);
        if (fetchedSuppliers && fetchedSuppliers.length > 0) setSuppliers(fetchedSuppliers);
        if (fetchedPurchases && fetchedPurchases.length > 0) setPurchases(fetchedPurchases);
        if (fetchedExpenses && fetchedExpenses.length > 0) setExpenses(fetchedExpenses);
        if (fetchedStaff && fetchedStaff.length > 0) setStaff(fetchedStaff);
        if (fetchedNotifs && fetchedNotifs.length > 0) setNotifications(fetchedNotifs);
        if (fetchedLogs && fetchedLogs.length > 0) setAuditLogs(fetchedLogs);
        if (fetchedSettings && Object.keys(fetchedSettings).length > 0) setSettings((prev) => ({ ...prev, ...fetchedSettings }));
        if (fetchedBranches && fetchedBranches.length > 0) setBranches(fetchedBranches);
      } catch (err) {
        console.warn('Using cached offline data fallback:', err);
      }
    }

    loadBackendData();

    // Subscribe to SSE real-time events
    const sse = api.subscribeToEvents((event) => {
      if (event.type === 'NEW_ORDER' || event.type === 'order_created') {
        const incoming = { ...event.data, status: normalizeOrderStatus(event.data.status) };
        setOrders((prev) => {
          if (prev.some((o) => o.id === incoming.id)) return prev;
          return [incoming, ...prev];
        });

        // 🛎️ Play Order Bell Chime & Display Live Popup
        playNewOrderChime();
        setNewOrderAlertQueue((prev) => {
          if (prev.some((o) => o.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      } else if (event.type === 'ORDER_STATUS_CHANGED' || event.type === 'order_status_changed') {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === event.data.id
              ? { ...o, ...event.data, status: normalizeOrderStatus(event.data.status) }
              : o
          )
        );
      } else if (event.type === 'NEW_RESERVATION') {
        setReservations((prev) => {
          if (prev.some((r) => r.id === event.data.id)) return prev;
          return [event.data, ...prev];
        });
      } else if (event.type === 'TABLE_STATUS_CHANGED') {
        setTables((prev) =>
          prev.map((t) => (t.id === event.data.id ? { ...t, status: event.data.status } : t))
        );
      } else if (event.type === 'table_updated') {
        setTables((prev) =>
          prev.map((t) => (t.id === event.data.id ? { ...t, ...event.data } : t))
        );
      } else if (event.type === 'NEW_NOTIFICATION' || event.type === 'notification_created') {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === event.data.id)) return prev;
          return [event.data, ...prev];
        });
      } else if (event.type === 'RIDER_ASSIGNED' || event.type === 'DELIVERY_OUT') {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === event.data.id ? { ...o, ...event.data, status: normalizeOrderStatus(event.data.status || o.status) } : o
          )
        );
      } else if (event.type === 'BRANCH_CREATED') {
        setBranches((prev) => (prev.some((b) => b.id === event.data.id) ? prev : [...prev, event.data]));
      } else if (event.type === 'BRANCH_UPDATED') {
        setBranches((prev) => prev.map((b) => (b.id === event.data.id ? { ...b, ...event.data } : b)));
      } else if (event.type === 'BRANCH_DELETED') {
        setBranches((prev) => prev.filter((b) => b.id !== event.data.id));
      }
    });

    return () => {
      if (sse) sse.close();
    };
  }, []);

  // Toast / notification helper
  const addToastNotification = useCallback((title, message, type = 'info', link = '/') => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      type,
      time: 'Just now',
      isRead: false,
      link
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 99)]);
  }, []);

  const addAuditLog = useCallback((action, category, details) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: userName,
      action,
      category,
      details,
      ip: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 499)]);
  }, [userName]);

  // -------------------------------------------------------------
  // ORDER MANAGEMENT & WORKFLOW
  // -------------------------------------------------------------
  const createOrder = useCallback((orderData) => {
    const invoiceNum = orderData.orderNumber || generateOrderNumber((settings.invoicePrefix || 'DN-').replace(/-$/, ''));

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: invoiceNum,
      orderType: orderData.orderType || 'dine-in',
      branchId: orderData.branchId || (activeBranchId !== 'all' ? activeBranchId : 'br-main'),
      tableNumber: orderData.tableNumber || null,
      tableId: orderData.tableId || null,
      customerId: orderData.customerId || null,
      customerName: orderData.customerName || 'Walk-in Guest',
      customerPhone: orderData.customerPhone || '',
      status: normalizeOrderStatus(orderData.status || 'placed'),
      orderTime: new Date().toISOString(),
      kitchenAcceptedAt: null,
      brewingStartedAt: null,
      kitchenReadyAt: null,
      completedAt: null,
      // Delivery leg (delivery orders only)
      deliveryAddress: orderData.deliveryAddress || '',
      deliveryLandmark: orderData.deliveryLandmark || '',
      deliveryInstructions: orderData.deliveryInstructions || '',
      riderId: orderData.riderId || null,
      riderName: orderData.riderName || '',
      riderPhone: orderData.riderPhone || '',
      deliveryOtp: null,
      deliveryStatus: (orderData.orderType || '').toLowerCase() === 'delivery' ? 'preparing' : null,
      outForDeliveryAt: null,
      deliveredAt: null,
      items: orderData.items || [],
      subtotal: Number((orderData.subtotal || 0).toFixed(2)),
      discountAmount: Number((orderData.discountAmount || 0).toFixed(2)),
      couponCode: orderData.couponCode || null,
      couponId: orderData.couponId || null,
      taxAmount: Number((orderData.taxAmount || 0).toFixed(2)),
      serviceCharge: Number((orderData.serviceCharge || 0).toFixed(2)),
      grandTotal: Number((orderData.grandTotal || 0).toFixed(2)),
      paymentMethod: orderData.paymentMethod || 'Cash',
      payments: orderData.payments || null,
      paymentStatus: orderData.paymentStatus || 'Pending',
      notes: orderData.notes || '',
      serverStaff: orderData.serverStaff || currentUser?.name || 'Cashier'
    };

    setOrders((prev) => [newOrder, ...prev]);

    // POST /api/orders — reconcile with the server record when it responds
    api.createOrder(newOrder)
      .then((saved) => {
        const record = saved && (saved.data || saved);
        if (record && record.id) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === newOrder.id ? { ...record, status: normalizeOrderStatus(record.status) } : o
            )
          );
        }
      })
      .catch((e) => console.warn('Order API sync error:', e));

    // 1. If assigned to a Table, set table to Occupied
    if (newOrder.tableId) {
      setTables((prev) =>
        prev.map((tbl) =>
          tbl.id === newOrder.tableId
            ? { ...tbl, status: 'Occupied', currentOrderId: newOrder.id, customerName: newOrder.customerName }
            : tbl
        )
      );
    }

    // 2. If coupon applied, record usage
    if (newOrder.couponId) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === newOrder.couponId
            ? {
                ...c,
                usedCount: c.usedCount + 1,
                totalDiscountGiven: c.totalDiscountGiven + newOrder.discountAmount,
                revenueGenerated: c.revenueGenerated + newOrder.grandTotal
              }
            : c
        )
      );
    }

    // 3. Notify Kitchen
    const isDeliveryNew = (newOrder.orderType || '').toLowerCase() === 'delivery';
    addToastNotification(
      isDeliveryNew ? 'New Delivery Order' : 'New Order Received',
      isDeliveryNew
        ? `Delivery order #${newOrder.orderNumber} to ${(newOrder.deliveryAddress || '').slice(0, 60)}`
        : `Order #${newOrder.orderNumber} (${newOrder.orderType.toUpperCase()}) placed by ${newOrder.customerName}`,
      'order',
      isDeliveryNew ? '/orders' : '/kitchen'
    );

    // 4. Log Audit
    addAuditLog(
      'CREATE_ORDER',
      'Orders',
      `Created order #${newOrder.orderNumber} for ₹${newOrder.grandTotal.toFixed(2)} (${newOrder.items.length} items)`
    );

    return newOrder;
  }, [settings, currentUser, activeBranchId, addToastNotification, addAuditLog]);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const normalized = normalizeOrderStatus(newStatus);
    const now = new Date().toISOString();
    const updatedOrder = { ...targetOrder, status: normalized };

    if (normalized === 'accepted' && !targetOrder.kitchenAcceptedAt) {
      updatedOrder.kitchenAcceptedAt = now;
    } else if (normalized === 'brewing' && !targetOrder.brewingStartedAt) {
      updatedOrder.brewingStartedAt = now;
      if (!updatedOrder.kitchenAcceptedAt) updatedOrder.kitchenAcceptedAt = now;
    } else if (normalized === 'ready' && !targetOrder.kitchenReadyAt) {
      updatedOrder.kitchenReadyAt = now;
      addToastNotification(
        'Order Ready for Pickup / Table',
        `Order #${targetOrder.orderNumber} is prepared and ready to serve!`,
        'success',
        '/orders'
      );
    } else if (normalized === 'out_for_delivery') {
      updatedOrder.outForDeliveryAt = now;
      updatedOrder.deliveryStatus = 'out_for_delivery';
      addToastNotification(
        'Order Out for Delivery',
        `Order #${targetOrder.orderNumber} dispatched${targetOrder.riderName ? ` with ${targetOrder.riderName}` : ''}.`,
        'info',
        '/orders'
      );
      addAuditLog(
        'OUT_FOR_DELIVERY',
        'Orders',
        `Order #${targetOrder.orderNumber} dispatched for delivery.`
      );
    } else if (normalized === 'completed' || normalized === 'delivered') {
      if (normalized === 'delivered') {
        updatedOrder.deliveredAt = now;
        updatedOrder.deliveryStatus = 'delivered';
      } else {
        updatedOrder.completedAt = now;
      }
      updatedOrder.paymentStatus = 'Paid';

      // Cross-module updates upon completion:
      // A. Automatic Inventory Deduction for items & raw materials
      setInventory((prevInventory) => {
        let updatedInv = [...prevInventory];

        targetOrder.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product && product.inventoryIngredients) {
            product.inventoryIngredients.forEach((ing) => {
              const qtyToDeduct = ing.quantity * item.quantity;
              updatedInv = updatedInv.map((invItem) => {
                if (invItem.id === ing.ingredientId) {
                  const newStock = Math.max(0, Number((invItem.currentStock - qtyToDeduct).toFixed(3)));
                  const isLow = newStock <= invItem.minStock;
                  if (isLow && invItem.status !== 'Low Stock') {
                    addToastNotification(
                      'Low Stock Warning',
                      `${invItem.name} stock has dropped to ${newStock} ${invItem.unit}.`,
                      'warning',
                      '/inventory'
                    );
                  }
                  return {
                    ...invItem,
                    currentStock: newStock,
                    status: isLow ? 'Low Stock' : 'In Stock'
                  };
                }
                return invItem;
              });
            });
          }
        });

        return updatedInv;
      });

      // B. Update Customer Lifetime Spend & Loyalty Points
      if (targetOrder.customerId) {
        const pointsEarned = Math.floor(targetOrder.grandTotal / 100) * (settings.loyaltyPointsPerHundred || 1);
        setCustomers((prev) =>
          prev.map((cust) => {
            if (cust.id === targetOrder.customerId) {
              const updatedSpent = cust.totalSpent + targetOrder.grandTotal;
              let newTier = cust.tier;
              if (updatedSpent >= 10000) newTier = 'Platinum';
              else if (updatedSpent >= 5000) newTier = 'Gold';
              else if (updatedSpent >= 2500) newTier = 'Silver';

              return {
                ...cust,
                totalOrders: cust.totalOrders + 1,
                totalSpent: updatedSpent,
                loyaltyPoints: cust.loyaltyPoints + pointsEarned,
                tier: newTier,
                lastVisit: now
              };
            }
            return cust;
          })
        );
      }

      // C. Free up Table if Dine-In
      if (targetOrder.tableId) {
        setTables((prev) =>
          prev.map((tbl) =>
            tbl.id === targetOrder.tableId
              ? { ...tbl, status: 'Cleaning', currentOrderId: null, customerName: null }
              : tbl
          )
        );
      }

      addAuditLog(
        normalized === 'delivered' ? 'DELIVER_ORDER' : 'COMPLETE_ORDER',
        'Orders',
        normalized === 'delivered'
          ? `Delivered order #${targetOrder.orderNumber}, recorded payment ₹${targetOrder.grandTotal}, deducted inventory, awarded loyalty.`
          : `Completed order #${targetOrder.orderNumber}, recorded payment ₹${targetOrder.grandTotal}, deducted inventory, awarded loyalty.`
      );
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // PATCH /api/orders/:id/status — reconcile with the server record when it responds
    api.updateOrderStatus(orderId, normalized)
      .then((saved) => {
        const record = saved && (saved.data || saved);
        if (record && record.id) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, ...record, status: normalizeOrderStatus(record.status) } : o
            )
          );
        }
      })
      .catch((e) => console.warn('Order status sync error:', e));
  }, [orders, products, settings, addToastNotification, addAuditLog]);

  const cancelOrder = useCallback((orderId, reason = 'Customer request') => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          if (o.tableId) {
            setTables((tbls) =>
              tbls.map((t) => (t.id === o.tableId ? { ...t, status: 'Available', currentOrderId: null, customerName: null } : t))
            );
          }
          return { ...o, status: 'cancelled', notes: `${o.notes || ''} [Cancelled: ${reason}]` };
        }
        return o;
      })
    );
    api.updateOrderStatus(orderId, 'cancelled', reason).catch(() => {});
    addAuditLog('CANCEL_ORDER', 'Orders', `Cancelled order ID ${orderId}. Reason: ${reason}`);
    addToastNotification('Order Cancelled', `Order #${orderId} has been cancelled.`, 'error', '/orders');
  }, [addAuditLog, addToastNotification]);

  const refundOrder = useCallback((orderId, reason = 'Refund via Orders dashboard') => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'refunded', paymentStatus: 'Refunded', notes: `${o.notes || ''} [Refunded: ${reason}]` }
          : o
      )
    );
    api.refundOrder(orderId, reason).catch(() => api.updateOrderStatus(orderId, 'refunded', reason).catch(() => {}));
    addAuditLog('REFUND_ORDER', 'Orders', `Refunded order ID ${orderId}. Reason: ${reason}`);
    addToastNotification('Order Refunded', `Order #${orderId} has been refunded.`, 'warning', '/orders');
  }, [addAuditLog, addToastNotification]);

  const deleteOrder = useCallback((orderId) => {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
      dbService.set(DB_KEYS.ORDERS, next);
      return next;
    });
    api.deleteOrder(orderId).catch(() => {});
    addAuditLog('DELETE_ORDER', 'Orders', `Deleted order ID ${orderId}`);
    addToastNotification('Order Deleted', `Order #${orderId} permanently deleted.`, 'info', '/orders');
  }, [addAuditLog, addToastNotification]);


  // -------------------------------------------------------------
  // DELIVERY LEG (rider assignment + OTP handover)
  // -------------------------------------------------------------
  const assignRider = useCallback(async (orderId, { riderName, riderPhone, riderId } = {}) => {
    const updated = await api.assignRider(orderId, { riderName, riderPhone, riderId });
    const record = updated && (updated.data || updated);
    if (record && record.id) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...record, status: normalizeOrderStatus(record.status) } : o)));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, riderName, riderPhone } : o)));
    }
    addAuditLog('ASSIGN_RIDER', 'Orders', `Assigned rider ${riderName} to order ID ${orderId}`);
    addToastNotification('Rider Assigned', `${riderName} will deliver order #${orderId}.`, 'info', '/orders');
    return record || updated;
  }, [addAuditLog, addToastNotification]);

  const verifyDeliveryOtp = useCallback(async (orderId, otp) => {
    const updated = await api.verifyDelivery(orderId, otp);
    const record = updated && (updated.data || updated);
    if (record && record.id) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...record, status: normalizeOrderStatus(record.status) } : o)));
    }
    addAuditLog('DELIVER_ORDER', 'Orders', `OTP verified — delivered order ID ${orderId}`);
    addToastNotification('Order Delivered', `Order #${orderId} delivered. OTP verified.`, 'success', '/orders');
    return record || updated;
  }, [addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // BRANCHES (multi-outlet)
  // -------------------------------------------------------------
  const addBranch = useCallback(async (branchData) => {
    const created = await api.createBranch(branchData);
    const record = created && (created.data || created);
    if (record && record.id) setBranches((prev) => [...prev, record]);
    else await api.getBranches().then((list) => { if (Array.isArray(list)) setBranches(list); }).catch(() => {});
    addAuditLog('CREATE_BRANCH', 'Branches', `Opened branch ${branchData.name}`);
    addToastNotification('Branch Added', `${branchData.name} is now live.`, 'success', '/settings');
    return record || created;
  }, [addAuditLog, addToastNotification]);

  const updateBranch = useCallback(async (branchId, patch) => {
    const updated = await api.updateBranch(branchId, patch);
    const record = updated && (updated.data || updated);
    if (record && record.id) setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...record } : b)));
    addAuditLog('UPDATE_BRANCH', 'Branches', `Updated branch ID ${branchId}`);
    return record || updated;
  }, [addAuditLog]);

  const deleteBranch = useCallback(async (branchId) => {
    await api.deleteBranch(branchId);
    setBranches((prev) => prev.filter((b) => b.id !== branchId));
    if (activeBranchId === branchId) switchBranch('all');
    addAuditLog('DELETE_BRANCH', 'Branches', `Closed branch ID ${branchId}`);
  }, [addAuditLog, activeBranchId, switchBranch]);

  // -------------------------------------------------------------
  // MENU & PRODUCTS
  // -------------------------------------------------------------
  const addProduct = useCallback((newProduct) => {
    const tablePrice = newProduct.tablePrice !== undefined && newProduct.tablePrice !== null && newProduct.tablePrice !== ''
      ? Number(newProduct.tablePrice)
      : Number(newProduct.sellingPrice || newProduct.price || 0);
    const onlinePrice = newProduct.onlinePrice !== undefined && newProduct.onlinePrice !== null && newProduct.onlinePrice !== ''
      ? Number(newProduct.onlinePrice)
      : Number(newProduct.sellingPrice || newProduct.price || 0);
    const tableEnabled = newProduct.tableEnabled !== undefined ? Boolean(newProduct.tableEnabled) : true;
    const onlineEnabled = newProduct.onlineEnabled !== undefined ? Boolean(newProduct.onlineEnabled) : true;
    const sellingPrice = Number(newProduct.sellingPrice ?? onlinePrice ?? tablePrice ?? 0);

    const product = {
      id: `prod-${Date.now()}`,
      ...newProduct,
      costPrice: Number(newProduct.costPrice || 0),
      sellingPrice,
      tablePrice,
      onlinePrice,
      tableEnabled,
      onlineEnabled,
      prepTimeMinutes: Number(newProduct.prepTimeMinutes || 5)
    };
    setProducts((prev) => [product, ...prev]);
    api.createProduct(product).catch(() => {});
    addAuditLog('ADD_PRODUCT', 'Menu', `Added new menu product "${product.name}" in category ${product.category}`);
    addToastNotification('Product Added', `"${product.name}" is now live in the menu.`, 'success', '/menu');
    return product;
  }, [addAuditLog, addToastNotification]);

  const updateProduct = useCallback((productId, updatedData) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const merged = { ...p, ...updatedData };
        if (updatedData.tablePrice !== undefined && updatedData.tablePrice !== '') {
          merged.tablePrice = Number(updatedData.tablePrice);
        }
        if (updatedData.onlinePrice !== undefined && updatedData.onlinePrice !== '') {
          merged.onlinePrice = Number(updatedData.onlinePrice);
        }
        if (updatedData.tableEnabled !== undefined) {
          merged.tableEnabled = Boolean(updatedData.tableEnabled);
        }
        if (updatedData.onlineEnabled !== undefined) {
          merged.onlineEnabled = Boolean(updatedData.onlineEnabled);
        }
        if (updatedData.sellingPrice === undefined && (updatedData.onlinePrice !== undefined || updatedData.tablePrice !== undefined)) {
          merged.sellingPrice = merged.onlinePrice ?? merged.tablePrice ?? merged.sellingPrice;
        }
        return merged;
      })
    );
    api.updateProduct(productId, updatedData).catch(() => {});
    addAuditLog('UPDATE_PRODUCT', 'Menu', `Updated details for product ID ${productId}`);
    addToastNotification('Product Updated', 'Product changes saved successfully.', 'success', '/menu');
  }, [addAuditLog, addToastNotification]);

  const deleteProduct = useCallback((productId) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    api.deleteProduct(productId).catch(() => {});
    addAuditLog('DELETE_PRODUCT', 'Menu', `Deleted menu product "${prod?.name || productId}"`);
    addToastNotification('Product Removed', `Product has been deleted.`, 'info', '/menu');
  }, [products, addAuditLog, addToastNotification]);

  const duplicateProduct = useCallback((productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const duplicated = {
      ...prod,
      id: `prod-${Date.now()}`,
      name: `${prod.name} (Copy)`,
      tablePrice: prod.tablePrice ?? prod.sellingPrice,
      onlinePrice: prod.onlinePrice ?? prod.sellingPrice,
      tableEnabled: prod.tableEnabled ?? true,
      onlineEnabled: prod.onlineEnabled ?? true,
      isFeatured: false
    };
    setProducts((prev) => [duplicated, ...prev]);
    api.createProduct(duplicated).catch(() => {});
    addAuditLog('DUPLICATE_PRODUCT', 'Menu', `Duplicated product "${prod.name}"`);
    addToastNotification('Product Duplicated', `Created copy of "${prod.name}".`, 'success', '/menu');
  }, [products, addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // CATEGORIES & ADDONS
  // -------------------------------------------------------------
  const addCategory = useCallback((catData) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      ...catData,
      itemCount: 0,
      isActive: true
    };
    setCategories((prev) => [...prev, newCat]);
    api.createCategory(newCat).catch(() => {});
    addAuditLog('ADD_CATEGORY', 'Menu', `Added category "${newCat.name}"`);
  }, [addAuditLog]);

  const updateCategory = useCallback((catId, updatedData) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, ...updatedData } : c))
    );
    api.updateCategory(catId, updatedData).catch(() => {});
    addAuditLog('UPDATE_CATEGORY', 'Menu', `Updated category ID ${catId}`);
  }, [addAuditLog]);

  const deleteCategory = useCallback((catId) => {
    const cat = categories.find((c) => c.id === catId);
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    api.deleteCategory(catId).catch(() => {});
    addAuditLog('DELETE_CATEGORY', 'Menu', `Deleted category "${cat?.name || catId}"`);
    addToastNotification('Category Removed', `Category has been deleted.`, 'info', '/menu');
  }, [categories, addAuditLog, addToastNotification]);

  const addAddon = useCallback((addonData) => {
    const newAddon = {
      id: `add-${Date.now()}`,
      ...addonData,
      price: Number(addonData.price || 0),
      isAvailable: true
    };
    setAddons((prev) => [...prev, newAddon]);
    api.createAddon(newAddon).catch(() => {});
    addAuditLog('ADD_ADDON', 'Menu', `Added custom add-on "${newAddon.name}" (₹${newAddon.price})`);
  }, [addAuditLog]);

  const updateAddon = useCallback((addonId, updatedData) => {
    setAddons((prev) =>
      prev.map((a) => (a.id === addonId ? { ...a, ...updatedData } : a))
    );
    api.updateAddon(addonId, updatedData).catch(() => {});
    addAuditLog('UPDATE_ADDON', 'Menu', `Updated add-on ID ${addonId}`);
  }, [addAuditLog]);

  const deleteAddon = useCallback((addonId) => {
    setAddons((prev) => prev.filter((a) => a.id !== addonId));
    api.deleteAddon(addonId).catch(() => {});
    addAuditLog('DELETE_ADDON', 'Menu', `Deleted add-on ID ${addonId}`);
  }, [addAuditLog]);

  // -------------------------------------------------------------
  // TABLES & FLOOR PLAN
  // -------------------------------------------------------------
  const refreshData = useCallback(async () => {
    try {
      const [fetchedTables, fetchedOrders] = await Promise.all([
        api.getTables().catch(() => null),
        api.getOrders().catch(() => null)
      ]);
      if (fetchedTables && fetchedTables.length > 0) setTables(fetchedTables);
      if (fetchedOrders && fetchedOrders.length > 0) setOrders(fetchedOrders);
    } catch (err) {
      console.warn('Table refresh failed:', err);
    }
  }, []);

  const occupyTable = useCallback(async (tableId, { customerName = null, currentOrderId = null } = {}) => {
    try {
      const updated = await api.occupyTable(tableId, { customerName, currentOrderId });
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...updated } : t)));
      addAuditLog('OCCUPY_TABLE', 'Tables', `Marked Table ID ${tableId} as Occupied`);
      return updated;
    } catch (err) {
      // Fallback to generic status update if dedicated endpoint is unreachable
      updateTableStatus(tableId, 'Occupied');
      throw err;
    }
  }, [addAuditLog]);

  const releaseTable = useCallback(async (tableId) => {
    try {
      const updated = await api.releaseTable(tableId);
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...updated } : t)));
      addAuditLog('RELEASE_TABLE', 'Tables', `Released Table ID ${tableId} back to Available`);
      return updated;
    } catch (err) {
      updateTableStatus(tableId, 'Available');
      throw err;
    }
  }, [addAuditLog]);
  const updateTableStatus = useCallback((tableId, newStatus) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
    );
    api.updateTableStatus(tableId, newStatus).catch(() => {});
    addAuditLog('UPDATE_TABLE', 'Tables', `Updated Table ID ${tableId} status to ${newStatus}`);
  }, [addAuditLog]);

  const addTable = useCallback((tableData) => {
    const newTable = {
      id: `tbl-${Date.now()}`,
      ...tableData,
      capacity: Number(tableData.capacity || 4),
      status: 'Available',
      currentOrderId: null,
      customerName: null
    };
    setTables((prev) => [...prev, newTable]);
    api.addTable(newTable).catch(() => {});
    addAuditLog('ADD_TABLE', 'Tables', `Added table ${newTable.tableNumber} in zone ${newTable.zone}`);
    addToastNotification('Table Added', `Table ${newTable.tableNumber} created.`, 'success', '/tables');
  }, [addAuditLog, addToastNotification]);

  const updateTable = useCallback(async (tableId, updatedData) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, ...updatedData, capacity: Number(updatedData.capacity ?? t.capacity) } : t))
    );
    try {
      await api.updateTable(tableId, updatedData);
    } catch (err) {
      console.error('Failed to update table on server:', err);
    }
    addAuditLog('UPDATE_TABLE', 'Tables', `Updated Table ID ${tableId} details`);
    addToastNotification('Table Updated', 'Table details updated successfully.', 'success', '/tables');
  }, [addAuditLog, addToastNotification]);

  const deleteTable = useCallback(async (tableId) => {
    const tableToDelete = tables.find((t) => t.id === tableId);
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    try {
      await api.deleteTable(tableId);
    } catch (err) {
      console.error('Failed to delete table on server:', err);
    }
    addAuditLog('DELETE_TABLE', 'Tables', `Deleted Table ${tableToDelete?.tableNumber || tableId}`);
    addToastNotification('Table Removed', `Table ${tableToDelete?.tableNumber || ''} removed successfully.`, 'info', '/tables');
  }, [tables, addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // RESERVATIONS
  // -------------------------------------------------------------
  const addReservation = useCallback((resData) => {
    const newRes = {
      id: `res-${Date.now()}`,
      ...resData,
      guests: Number(resData.guests || 2),
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };
    setReservations((prev) => [newRes, ...prev]);
    api.createReservation(newRes).catch(() => {});

    if (newRes.tableId) {
      setTables((prev) =>
        prev.map((t) => (t.id === newRes.tableId ? { ...t, status: 'Reserved', customerName: newRes.customerName } : t))
      );
    }

    addToastNotification(
      'New Table Reservation',
      `${newRes.customerName} booked table for ${newRes.guests} guests on ${newRes.date} at ${newRes.time}`,
      'reservation',
      '/reservations'
    );
    addAuditLog('CREATE_RESERVATION', 'Reservations', `Created reservation for ${newRes.customerName}`);
    return newRes;
  }, [addToastNotification, addAuditLog]);

  const updateReservationStatus = useCallback((resId, newStatus) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id === resId) {
          if (newStatus === 'Seated' && r.tableId) {
            setTables((tbls) =>
              tbls.map((t) => (t.id === r.tableId ? { ...t, status: 'Occupied', customerName: r.customerName } : t))
            );
          } else if (['Completed', 'Cancelled', 'No-show'].includes(newStatus) && r.tableId) {
            setTables((tbls) =>
              tbls.map((t) => (t.id === r.tableId ? { ...t, status: 'Available', customerName: null } : t))
            );
          }
          return { ...r, status: newStatus };
        }
        return r;
      })
    );
    api.updateReservationStatus(resId, newStatus).catch(() => {});
    addAuditLog('UPDATE_RESERVATION', 'Reservations', `Updated reservation ${resId} status to ${newStatus}`);
  }, [addAuditLog]);

  const deleteReservation = useCallback((resId) => {
    const res = reservations.find((r) => r.id === resId);
    if (res?.tableId && res.status === 'Confirmed') {
      setTables((tbls) =>
        tbls.map((t) => (t.id === res.tableId ? { ...t, status: 'Available', customerName: null } : t))
      );
    }
    setReservations((prev) => prev.filter((r) => r.id !== resId));
    api.deleteReservation(resId).catch(() => {});
    addAuditLog('DELETE_RESERVATION', 'Reservations', `Deleted reservation for ${res?.customerName || resId}`);
    addToastNotification('Reservation Removed', 'Booking deleted.', 'info', '/reservations');
  }, [reservations, addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // CUSTOMERS & CRM
  // -------------------------------------------------------------
  const addCustomer = useCallback((custData) => {
    const newCust = {
      id: `cust-${Date.now()}`,
      ...custData,
      tier: 'Bronze',
      loyaltyPoints: 0,
      totalSpent: 0,
      totalOrders: 0,
      lastVisit: new Date().toISOString(),
      favoriteProducts: [],
      notes: custData.notes || ''
    };
    setCustomers((prev) => [newCust, ...prev]);
    api.createCustomer(newCust).catch(() => {});
    addAuditLog('ADD_CUSTOMER', 'Customers', `Created customer profile for "${newCust.name}" (${newCust.phone})`);
    addToastNotification('Customer Created', `Profile created for ${newCust.name}.`, 'success', '/customers');
    return newCust;
  }, [addAuditLog, addToastNotification]);

  const updateCustomer = useCallback((customerId, updatedData) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, ...updatedData } : c))
    );
    if (updatedData.loyaltyPoints !== undefined) {
      const current = customers.find((c) => c.id === customerId);
      const delta = updatedData.loyaltyPoints - (current?.loyaltyPoints || 0);
      api.adjustLoyalty(customerId, delta, 'Manual support adjustment').catch(() => {});
    }
    addAuditLog('UPDATE_CUSTOMER', 'Customers', `Updated customer profile ${customerId}`);
  }, [customers, addAuditLog]);

  const deleteCustomer = useCallback((customerId) => {
    const cust = customers.find((c) => c.id === customerId);
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    api.deleteCustomer(customerId).catch(() => {});
    addAuditLog('DELETE_CUSTOMER', 'Customers', `Deleted customer ${cust?.name || customerId}`);
    addToastNotification('Customer Removed', `Customer ${cust?.name || ''} deleted.`, 'info', '/customers');
  }, [customers, addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // COUPONS ENGINE
  // -------------------------------------------------------------
  const addCoupon = useCallback((couponData) => {
    const newCoupon = {
      id: `cpn-${Date.now()}`,
      ...couponData,
      code: couponData.code.trim().toUpperCase(),
      discountValue: Number(couponData.discountValue || 0),
      maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : null,
      minOrderValue: Number(couponData.minOrderValue || 0),
      usageLimit: couponData.usageLimit ? Number(couponData.usageLimit) : null,
      usedCount: 0,
      perCustomerLimit: Number(couponData.perCustomerLimit || 1),
      status: couponData.status || 'active',
      totalDiscountGiven: 0,
      revenueGenerated: 0
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    api.createCoupon(newCoupon).catch(() => {});
    addAuditLog('CREATE_COUPON', 'Coupons', `Created promo coupon "${newCoupon.code}" (${newCoupon.discountType} ${newCoupon.discountValue})`);
    addToastNotification('Coupon Created', `Coupon code "${newCoupon.code}" is ready.`, 'success', '/coupons');
    return newCoupon;
  }, [addAuditLog, addToastNotification]);

  const updateCoupon = useCallback((couponId, updatedData) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, ...updatedData } : c))
    );
    api.updateCoupon(couponId, updatedData).catch(() => {});
    addAuditLog('UPDATE_COUPON', 'Coupons', `Updated coupon ID ${couponId}`);
    addToastNotification('Coupon Updated', 'Promo coupon updated successfully.', 'success', '/coupons');
  }, [addAuditLog, addToastNotification]);

  const deleteCoupon = useCallback((couponId) => {
    const cpn = coupons.find((c) => c.id === couponId);
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    api.deleteCoupon(couponId).catch(() => {});
    addAuditLog('DELETE_COUPON', 'Coupons', `Deleted coupon "${cpn?.code || couponId}"`);
    addToastNotification('Coupon Deleted', `Coupon ${cpn?.code || ''} removed.`, 'info', '/coupons');
  }, [coupons, addAuditLog, addToastNotification]);

  const toggleCouponStatus = useCallback((couponId) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === couponId) {
          const nextStatus = c.status === 'active' ? 'disabled' : 'active';
          addAuditLog('TOGGLE_COUPON', 'Coupons', `Set coupon "${c.code}" status to ${nextStatus}`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
    api.toggleCoupon(couponId).catch(() => {});
  }, [addAuditLog]);

  // -------------------------------------------------------------
  // INVENTORY & STOCK TRANSACTIONS
  // -------------------------------------------------------------
  const adjustInventoryStock = useCallback((itemId, adjustmentQty, reason = 'Adjustment') => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedStock = Math.max(0, Number((item.currentStock + adjustmentQty).toFixed(3)));
          const isLow = updatedStock <= item.minStock;
          return {
            ...item,
            currentStock: updatedStock,
            status: isLow ? 'Low Stock' : 'In Stock'
          };
        }
        return item;
      })
    );
    api.adjustInventory(itemId, adjustmentQty, reason).catch(() => {});
    addAuditLog('ADJUST_STOCK', 'Inventory', `Adjusted item ${itemId} stock by ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty} (${reason})`);
    addToastNotification('Stock Adjusted', `Inventory stock updated successfully.`, 'success', '/inventory');
  }, [addAuditLog, addToastNotification]);

  const addInventoryItem = useCallback((itemData) => {
    const newItem = {
      id: `inv-${Date.now()}`,
      ...itemData,
      currentStock: Number(itemData.currentStock ?? itemData.stock ?? 0),
      minStock: Number(itemData.minStock ?? itemData.min_level ?? 5),
      maxStock: Number(itemData.maxStock ?? 50),
      costPerUnit: Number(itemData.costPerUnit ?? 100),
      status: Number(itemData.currentStock ?? itemData.stock ?? 0) <= Number(itemData.minStock ?? itemData.min_level ?? 5) ? 'Low Stock' : 'In Stock'
    };
    setInventory((prev) => [...prev, newItem]);
    api.createInventoryItem(newItem).catch(() => {});
    addAuditLog('ADD_INVENTORY_ITEM', 'Inventory', `Added new raw stock item "${newItem.name}" (${newItem.unit})`);
    return newItem;
  }, [addAuditLog]);

  const updateInventoryItem = useCallback((itemId, updatedData) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const merged = { ...item, ...updatedData };
        const stock = Number(merged.currentStock ?? 0);
        const min = Number(merged.minStock ?? 5);
        return { ...merged, status: stock <= min ? 'Low Stock' : 'In Stock' };
      })
    );
    api.updateInventoryItem(itemId, updatedData).catch(() => {});
    addAuditLog('UPDATE_INVENTORY_ITEM', 'Inventory', `Updated raw stock item ${itemId}`);
  }, [addAuditLog]);

  const deleteInventoryItem = useCallback((itemId) => {
    setInventory((prev) => prev.filter((i) => i.id !== itemId));
    api.deleteInventoryItem(itemId).catch(() => {});
    addAuditLog('DELETE_INVENTORY_ITEM', 'Inventory', `Deleted raw stock item ${itemId}`);
    addToastNotification('Stock Item Removed', 'Raw material deleted.', 'info', '/inventory');
  }, [addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // SUPPLIERS & PURCHASES (PO create -> receive restocks + expense)
  // -------------------------------------------------------------
  const addSupplier = useCallback((supplierData) => {
    const newSup = {
      id: `sup-${Date.now()}`,
      ...supplierData,
      totalPurchases: 0,
      status: 'Active'
    };
    setSuppliers((prev) => [...prev, newSup]);
    api.createSupplier(newSup).catch(() => {});
    addAuditLog('ADD_SUPPLIER', 'Suppliers', `Added supplier "${newSup.name}"`);
    return newSup;
  }, [addAuditLog]);

  const updateSupplier = useCallback((supplierId, updatedData) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, ...updatedData } : s))
    );
    api.updateSupplier(supplierId, updatedData).catch(() => {});
    addAuditLog('UPDATE_SUPPLIER', 'Suppliers', `Updated supplier ${supplierId}`);
  }, [addAuditLog]);

  const deleteSupplier = useCallback((supplierId) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    api.deleteSupplier(supplierId).catch(() => {});
    addAuditLog('DELETE_SUPPLIER', 'Suppliers', `Deleted supplier ${supplierId}`);
    addToastNotification('Supplier Removed', 'Vendor deleted.', 'info', '/inventory');
  }, [addAuditLog, addToastNotification]);

  const applyPoStockBump = useCallback((poItems) => {
    if (!poItems || poItems.length === 0) return;
    setInventory((prevInv) => {
      let updated = [...prevInv];
      poItems.forEach((poItem) => {
        updated = updated.map((inv) => {
          if (inv.id === poItem.ingredientId) {
            const newQty = Number((inv.currentStock + Number(poItem.quantity)).toFixed(3));
            return {
              ...inv,
              currentStock: newQty,
              status: newQty > inv.minStock ? 'In Stock' : 'Low Stock'
            };
          }
          return inv;
        });
      });
      return updated;
    });
  }, []);

  const createPurchaseOrder = useCallback((poData, opts = {}) => {
    const receiveImmediately = opts.receive ?? true;
    const newPO = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      ...poData,
      totalAmount: Number(poData.totalAmount || 0),
      orderDate: new Date().toISOString().split('T')[0],
      status: receiveImmediately ? 'Received' : 'Pending',
      receivedDate: receiveImmediately ? new Date().toISOString().split('T')[0] : null
    };

    setPurchases((prev) => [newPO, ...prev]);
    api.createPurchaseOrder({ ...newPO, status: 'Pending' })
      .then((created) => {
        const backendId = created?.id || created?.data?.id;
        if (receiveImmediately) {
          const targetId = backendId || newPO.id;
          api.receivePurchaseOrder(targetId).catch(() => {});
        }
      })
      .catch(() => {});

    // Optimistic local stock bump when receiving immediately
    if (receiveImmediately) {
      applyPoStockBump(newPO.items);
      const poExpense = {
        id: `exp-${Date.now()}`,
        title: `PO #${newPO.poNumber} — ${newPO.supplierName || 'Supplier'}`,
        category: 'Purchases',
        amount: Number(newPO.totalAmount || 0),
        paymentMethod: 'Cash',
        date: newPO.receivedDate,
        loggedBy: userName
      };
      setExpenses((prev) => [poExpense, ...prev]);
    }

    addAuditLog('CREATE_PURCHASE', 'Purchases', `Created Purchase Order #${newPO.poNumber} for ₹${newPO.totalAmount} (${newPO.status})`);
    addToastNotification(
      newPO.status === 'Pending' ? 'Purchase Order Created' : 'Purchase Received',
      newPO.status === 'Pending' ? `PO #${newPO.poNumber} is pending receipt.` : `Inventory restocked from PO #${newPO.poNumber}.`,
      'success', '/purchases'
    );
    return newPO;
  }, [addAuditLog, addToastNotification, applyPoStockBump, userName]);

  const receivePurchaseOrder = useCallback((poId) => {
    const po = purchases.find((p) => p.id === poId);
    if (!po || po.status === 'Received' || po.status === 'Completed') return po;
    const receivedDate = new Date().toISOString().split('T')[0];
    setPurchases((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'Received', receivedDate } : p))
    );
    api.receivePurchaseOrder(poId).catch(() => {});
    if (po) {
      applyPoStockBump(po.items);
      setExpenses((prev) => [{
        id: `exp-${Date.now()}`,
        title: `PO #${po.poNumber} — ${po.supplierName || 'Supplier'}`,
        category: 'Purchases',
        amount: Number(po.totalAmount || 0),
        paymentMethod: 'Cash',
        date: receivedDate,
        loggedBy: userName
      }, ...prev]);
    }
    addAuditLog('RECEIVE_PURCHASE', 'Purchases', `Received PO #${po?.poNumber} — stock updated, expense recorded`);
    addToastNotification('Purchase Received', `Inventory restocked from PO #${po?.poNumber}.`, 'success', '/purchases');
    return { ...po, status: 'Received', receivedDate };
  }, [purchases, applyPoStockBump, addAuditLog, addToastNotification, userName]);

  const deletePurchaseOrder = useCallback((poId) => {
    setPurchases((prev) => prev.filter((p) => p.id !== poId));
    api.deletePurchaseOrder(poId).catch(() => {});
    addAuditLog('DELETE_PURCHASE', 'Purchases', `Deleted purchase order ${poId}`);
  }, [addAuditLog]);

  // -------------------------------------------------------------
  // EXPENSES
  // -------------------------------------------------------------
  const addExpense = useCallback((expData) => {
    const newExp = {
      id: `exp-${Date.now()}`,
      ...expData,
      amount: Number(expData.amount || 0),
      date: expData.date || new Date().toISOString().split('T')[0],
      loggedBy: userName
    };
    setExpenses((prev) => [newExp, ...prev]);
    api.createExpense(newExp).catch(() => {});
    addAuditLog('ADD_EXPENSE', 'Expenses', `Logged ₹${newExp.amount} expense under "${newExp.category}": ${newExp.title}`);
    addToastNotification('Expense Recorded', `₹${newExp.amount} logged under ${newExp.category}.`, 'info', '/expenses');
    return newExp;
  }, [userName, addAuditLog, addToastNotification]);

  const deleteExpense = useCallback((expId) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expId));
    api.deleteExpense(expId).catch(() => {});
    addAuditLog('DELETE_EXPENSE', 'Expenses', `Deleted expense ID ${expId}`);
  }, [addAuditLog]);

  // -------------------------------------------------------------
  // STAFF MANAGEMENT
  // -------------------------------------------------------------
  const addStaffMember = useCallback((staffData) => {
    const newStaff = {
      id: `staff-${Date.now()}`,
      ...staffData,
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      avatar: staffData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
    setStaff((prev) => {
      const next = [...prev, newStaff];
      dbService.set(DB_KEYS.STAFF, next);
      return next;
    });
    api.createStaff(newStaff).catch(() => {});
    addAuditLog('ADD_STAFF', 'Staff', `Created staff account for "${newStaff.name}" (${newStaff.role})`);
    return newStaff;
  }, [addAuditLog]);

  const updateStaffMember = useCallback((staffId, updatedData) => {
    setStaff((prev) => {
      const next = prev.map((s) => (s.id === staffId ? { ...s, ...updatedData } : s));
      dbService.set(DB_KEYS.STAFF, next);
      return next;
    });
    api.updateStaff(staffId, updatedData).catch(() => {});
    addAuditLog('UPDATE_STAFF', 'Staff', `Updated staff record for ID ${staffId}`);
  }, [addAuditLog]);

  const deleteStaffMember = useCallback((staffId) => {
    const member = staff.find((s) => s.id === staffId);
    setStaff((prev) => {
      const next = prev.filter((s) => s.id !== staffId);
      dbService.set(DB_KEYS.STAFF, next);
      return next;
    });
    api.deleteStaff(staffId).catch(() => {});
    addAuditLog('DELETE_STAFF', 'Staff', `Deleted staff account for "${member?.name || staffId}"`);
    addToastNotification('Staff Removed', `Staff member ${member?.name || ''} deleted.`, 'info', '/staff');
  }, [staff, addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  const markNotificationAsRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    api.markNotificationRead(notifId).catch(() => {});
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    api.markAllNotificationsRead().catch(() => {});
  }, []);

  // -------------------------------------------------------------
  // SETTINGS & SYSTEM RESET
  // -------------------------------------------------------------
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    api.updateSettings(newSettings).catch(() => {});
    addAuditLog('UPDATE_SETTINGS', 'Settings', 'Updated global cafe configuration parameters');
    addToastNotification('Settings Saved', 'Cafe configuration updated successfully.', 'success', '/settings');
  }, [addAuditLog, addToastNotification]);

  const updateAdminCredentials = useCallback(async (credentials) => {
    try {
      await api.updateAdminCredentials(credentials);
      // Sync local staff state
      setStaff((prev) => {
        const next = prev.map((s) => (s.role === 'Admin' ? { ...s, ...credentials } : s));
        dbService.set(DB_KEYS.STAFF, next);
        return next;
      });
      // Sync settings credentials cache
      setSettings((prev) => {
        const next = {
          ...prev,
          adminEmail: credentials.email,
          adminPassword: credentials.password,
          adminPin: credentials.pin
        };
        dbService.set(DB_KEYS.SETTINGS, next);
        return next;
      });
      addAuditLog('UPDATE_CREDENTIALS', 'Security', `Updated Admin credentials for ${credentials.email}`);
      addToastNotification('Credentials Saved', 'Admin master login credentials and PIN updated successfully.', 'success', '/settings');
      return { success: true };
    } catch (err) {
      // Offline fallback: persist to local state & storage
      setStaff((prev) => {
        const next = prev.map((s) => (s.role === 'Admin' ? { ...s, ...credentials } : s));
        dbService.set(DB_KEYS.STAFF, next);
        return next;
      });
      setSettings((prev) => {
        const next = {
          ...prev,
          adminEmail: credentials.email,
          adminPassword: credentials.password,
          adminPin: credentials.pin
        };
        dbService.set(DB_KEYS.SETTINGS, next);
        return next;
      });
      addToastNotification('Credentials Saved (Local)', 'Admin login credentials updated in local storage.', 'success', '/settings');
      return { success: true };
    }
  }, [addAuditLog, addToastNotification]);

  const purgeAllDemoData = useCallback(async () => {
    try {
      await api.purgeDemoData().catch(() => {});
    } catch (e) {}
    // Clear local state
    setOrders([]);
    setCustomers([]);
    setReservations([]);
    dbService.set(DB_KEYS.ORDERS, []);
    dbService.set(DB_KEYS.CUSTOMERS, []);
    dbService.set(DB_KEYS.RESERVATIONS, []);
    addAuditLog('PURGE_DEMO', 'System', 'Purged all demo orders, demo customers, and demo reservations');
    addToastNotification('Demo Data Purged', 'All dummy orders and customer profiles have been wiped.', 'success', '/');
  }, [addAuditLog, addToastNotification]);

  const resetAllDataToDefault = useCallback(() => {
    dbService.resetAllData();
    setSettings(initialCafeSettings);
    setCategories(initialCategories);
    setAddons(initialAddons);
    setProducts(initialProducts);
    setTables(initialTables);
    setCustomers(initialCustomers);
    setCoupons(initialCoupons);
    setInventory(initialInventory);
    setSuppliers(initialSuppliers);
    setPurchases(initialPurchases);
    setExpenses(initialExpenses);
    setStaff(initialStaff);
    setReservations(initialReservations);
    setOrders(initialOrders);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
    addToastNotification('System Reset', 'All data has been reset to original factory demo seed.', 'warning', '/');
  }, [addToastNotification]);

  return (
    <CafeContext.Provider
      value={{
        // State
        settings,
        categories,
        addons,
        products,
        tables,
        customers,
        coupons,
        inventory,
        suppliers,
        purchases,
        expenses,
        staff,
        reservations,
        orders,
        auditLogs,
        notifications,
        branches,
        activeBranchId,
        newOrderAlertQueue,

        // Actions & Sound Alerts
        dismissNewOrderAlert,
        triggerNewOrderAlert,
        playNewOrderChime,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        refundOrder,
        assignRider,
        verifyDeliveryOtp,
        addBranch,
        updateBranch,
        deleteBranch,
        switchBranch,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addAddon,
        updateAddon,
        deleteAddon,
        updateTableStatus,
        occupyTable,
        releaseTable,
        refreshData,
        addTable,
        updateTable,
        deleteTable,
        addReservation,
        updateReservationStatus,
        deleteReservation,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponStatus,
        adjustInventoryStock,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createPurchaseOrder,
        receivePurchaseOrder,
        deletePurchaseOrder,
        addExpense,
        deleteExpense,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateSettings,
        updateAdminCredentials,
        purgeAllDemoData,
        deleteOrder,
        resetAllDataToDefault,
        addToastNotification,
        addAuditLog
      }}
    >
      {children}
    </CafeContext.Provider>
  );
}

export function useCafe() {
  return useContext(CafeContext);
}
