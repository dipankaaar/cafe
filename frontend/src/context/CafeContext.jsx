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
import { useAuth } from './AuthContext';

const CafeContext = createContext();

export function CafeProvider({ children }) {
  const { currentUser } = useAuth();
  const userName = currentUser ? `${currentUser.name} (${currentUser.role})` : 'System';

  // State slices initialized from local cache or seed data
  const [settings, setSettings] = useState(() => dbService.get(DB_KEYS.SETTINGS, initialCafeSettings));
  const [categories, setCategories] = useState(() => dbService.get(DB_KEYS.CATEGORIES, initialCategories));
  const [addons, setAddons] = useState(() => dbService.get(DB_KEYS.ADDONS, initialAddons));
  const [products, setProducts] = useState(() => dbService.get(DB_KEYS.PRODUCTS, initialProducts));
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
          fetchedSettings
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
          api.getSettings().catch(() => null)
        ]);

        if (fetchedProducts && fetchedProducts.length > 0) setProducts(fetchedProducts);
        if (fetchedCategories && fetchedCategories.length > 0) setCategories(fetchedCategories);
        if (fetchedAddons && fetchedAddons.length > 0) setAddons(fetchedAddons);
        if (fetchedOrders && fetchedOrders.length > 0) setOrders(fetchedOrders);
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
      } catch (err) {
        console.warn('Using cached offline data fallback:', err);
      }
    }

    loadBackendData();

    // Subscribe to SSE real-time events
    const sse = api.subscribeToEvents((event) => {
      if (event.type === 'NEW_ORDER') {
        setOrders((prev) => {
          if (prev.some((o) => o.id === event.data.id)) return prev;
          return [event.data, ...prev];
        });
      } else if (event.type === 'ORDER_STATUS_CHANGED') {
        setOrders((prev) =>
          prev.map((o) => (o.id === event.data.id ? { ...o, ...event.data } : o))
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
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNum = orderData.orderNumber || `${settings.invoicePrefix || 'DIN-'}${nextNum}`;

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: invoiceNum,
      orderType: orderData.orderType || 'dine-in',
      tableNumber: orderData.tableNumber || null,
      tableId: orderData.tableId || null,
      customerId: orderData.customerId || null,
      customerName: orderData.customerName || 'Walk-in Guest',
      customerPhone: orderData.customerPhone || '',
      status: orderData.status || 'New',
      orderTime: new Date().toISOString(),
      kitchenAcceptedAt: null,
      kitchenReadyAt: null,
      completedAt: null,
      items: orderData.items || [],
      subtotal: Number((orderData.subtotal || 0).toFixed(2)),
      discountAmount: Number((orderData.discountAmount || 0).toFixed(2)),
      couponCode: orderData.couponCode || null,
      couponId: orderData.couponId || null,
      taxAmount: Number((orderData.taxAmount || 0).toFixed(2)),
      serviceCharge: Number((orderData.serviceCharge || 0).toFixed(2)),
      grandTotal: Number((orderData.grandTotal || 0).toFixed(2)),
      paymentMethod: orderData.paymentMethod || 'Cash',
      paymentStatus: orderData.paymentStatus || 'Pending',
      notes: orderData.notes || '',
      serverStaff: orderData.serverStaff || currentUser?.name || 'Cashier'
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Send to Backend API
    api.createOrder(newOrder).catch((e) => console.warn('Order API sync error:', e));

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
    addToastNotification(
      'New Order Received',
      `Order #${newOrder.orderNumber} (${newOrder.orderType.toUpperCase()}) placed by ${newOrder.customerName}`,
      'order',
      '/kitchen'
    );

    // 4. Log Audit
    addAuditLog(
      'CREATE_ORDER',
      'Orders',
      `Created order #${newOrder.orderNumber} for ₹${newOrder.grandTotal.toFixed(2)} (${newOrder.items.length} items)`
    );

    return newOrder;
  }, [settings, currentUser, addToastNotification, addAuditLog]);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const now = new Date().toISOString();
    const updatedOrder = { ...targetOrder, status: newStatus };

    if (newStatus === 'Accepted' && !targetOrder.kitchenAcceptedAt) {
      updatedOrder.kitchenAcceptedAt = now;
    } else if (newStatus === 'Ready' && !targetOrder.kitchenReadyAt) {
      updatedOrder.kitchenReadyAt = now;
      addToastNotification(
        'Order Ready for Pickup / Table',
        `Order #${targetOrder.orderNumber} is prepared and ready to serve!`,
        'success',
        '/orders'
      );
    } else if (newStatus === 'Completed') {
      updatedOrder.completedAt = now;
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
        'COMPLETE_ORDER',
        'Orders',
        `Completed order #${targetOrder.orderNumber}, recorded payment ₹${targetOrder.grandTotal}, deducted inventory, awarded loyalty.`
      );
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // Send update to Backend API
    api.updateOrderStatus(orderId, newStatus).catch((e) => console.warn('Order status sync error:', e));
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
          return { ...o, status: 'Cancelled', notes: `${o.notes || ''} [Cancelled: ${reason}]` };
        }
        return o;
      })
    );
    api.updateOrderStatus(orderId, 'Cancelled', reason).catch(() => {});
    addAuditLog('CANCEL_ORDER', 'Orders', `Cancelled order ID ${orderId}. Reason: ${reason}`);
    addToastNotification('Order Cancelled', `Order #${orderId} has been cancelled.`, 'error', '/orders');
  }, [addAuditLog, addToastNotification]);

  // -------------------------------------------------------------
  // MENU & PRODUCTS
  // -------------------------------------------------------------
  const addProduct = useCallback((newProduct) => {
    const product = {
      id: `prod-${Date.now()}`,
      ...newProduct,
      costPrice: Number(newProduct.costPrice || 0),
      sellingPrice: Number(newProduct.sellingPrice || 0),
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
      prev.map((p) => (p.id === productId ? { ...p, ...updatedData } : p))
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
    addAuditLog('UPDATE_CATEGORY', 'Menu', `Updated category ID ${catId}`);
  }, [addAuditLog]);

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
  }, []);

  // -------------------------------------------------------------
  // TABLES & FLOOR PLAN
  // -------------------------------------------------------------
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
    addAuditLog('UPDATE_COUPON', 'Coupons', `Updated coupon ID ${couponId}`);
  }, [addAuditLog]);

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
      currentStock: Number(itemData.currentStock || 0),
      minStock: Number(itemData.minStock || 5),
      maxStock: Number(itemData.maxStock || 50),
      costPerUnit: Number(itemData.costPerUnit || 100),
      status: Number(itemData.currentStock || 0) <= Number(itemData.minStock || 5) ? 'Low Stock' : 'In Stock'
    };
    setInventory((prev) => [...prev, newItem]);
    api.createInventoryItem(newItem).catch(() => {});
    addAuditLog('ADD_INVENTORY_ITEM', 'Inventory', `Added new raw stock item "${newItem.name}" (${newItem.unit})`);
    return newItem;
  }, [addAuditLog]);

  // -------------------------------------------------------------
  // SUPPLIERS & PURCHASES
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

  const createPurchaseOrder = useCallback((poData) => {
    const newPO = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      ...poData,
      totalAmount: Number(poData.totalAmount || 0),
      orderDate: new Date().toISOString().split('T')[0],
      status: 'Completed',
      receivedDate: new Date().toISOString().split('T')[0]
    };

    setPurchases((prev) => [newPO, ...prev]);
    api.createPurchaseOrder(newPO).catch(() => {});

    // Automatically increase inventory stock for items in PO
    if (newPO.items && newPO.items.length > 0) {
      setInventory((prevInv) => {
        let updated = [...prevInv];
        newPO.items.forEach((poItem) => {
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
    }

    addAuditLog('CREATE_PURCHASE', 'Purchases', `Created Purchase Order #${newPO.poNumber} for ₹${newPO.totalAmount}`);
    addToastNotification('Purchase Received', `Inventory restocked from PO #${newPO.poNumber}.`, 'success', '/purchases');
    return newPO;
  }, [addAuditLog, addToastNotification]);

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
    setStaff((prev) => [...prev, newStaff]);
    api.createStaff(newStaff).catch(() => {});
    addAuditLog('ADD_STAFF', 'Staff', `Created staff account for "${newStaff.name}" (${newStaff.role})`);
    return newStaff;
  }, [addAuditLog]);

  const updateStaffMember = useCallback((staffId, updatedData) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, ...updatedData } : s))
    );
    api.updateStaff(staffId, updatedData).catch(() => {});
    addAuditLog('UPDATE_STAFF', 'Staff', `Updated staff record for ID ${staffId}`);
  }, [addAuditLog]);

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

        // Actions
        createOrder,
        updateOrderStatus,
        cancelOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        addCategory,
        updateCategory,
        addAddon,
        updateAddon,
        updateTableStatus,
        addTable,
        addReservation,
        updateReservationStatus,
        addCustomer,
        updateCustomer,
        addCoupon,
        updateCoupon,
        toggleCouponStatus,
        adjustInventoryStock,
        addInventoryItem,
        addSupplier,
        createPurchaseOrder,
        addExpense,
        deleteExpense,
        addStaffMember,
        updateStaffMember,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateSettings,
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
