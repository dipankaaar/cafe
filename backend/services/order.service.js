import { OrderModel } from '../models/Order.model.js';
import { TableModel } from '../models/Table.model.js';
import { CouponModel, CustomerModel } from '../models/Customer.model.js';
import { InventoryModel } from '../models/Inventory.model.js';
import { NotificationModel, AuditLogModel } from '../models/System.model.js';
import { CouponService } from './coupon.service.js';
import { eventHub } from './eventHub.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS, normalizeOrderStatus, isValidStatusTransition } from '../config/constants.js';
import { getCurrentTimestamp, pointsForAmount } from '../utils/helpers.js';

export class OrderService {
  /**
   * Create a new Order (POS / Online Storefront / QR Table Ordering)
   */
  static createOrder(orderData, clientIp = '127.0.0.1') {
    if (!orderData.items || orderData.items.length === 0) {
      throw new ApiError(400, 'Order cart cannot be empty');
    }

    // ---- Payload integrity: reject corrupt totals/quantities before they touch revenue/stock ----
    // (Guards against crafted API calls with negative prices, NaN totals, or absurd quantities
    // that would otherwise corrupt P&L figures and inflate inventory on completion.)
    const money = (v, field) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 10000000) {
        throw new ApiError(400, `Invalid ${field}: must be a non-negative number`);
      }
      return n;
    };
    orderData.items.forEach((it, i) => {
      const qty = Number(it.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || qty > 99) {
        throw new ApiError(400, `Invalid quantity for item ${i + 1}: must be 1–99`);
      }
      it.quantity = Math.floor(qty);
      ['price', 'unitPrice', 'totalPrice', 'sellingPrice'].forEach((k) => {
        if (it[k] !== undefined && it[k] !== null) {
          const n = Number(it[k]);
          if (!Number.isFinite(n) || n < 0) throw new ApiError(400, `Invalid ${k} for item ${i + 1}`);
        }
      });
    });
    orderData.subtotal = money(orderData.subtotal ?? 0, 'subtotal');
    orderData.discountAmount = money(orderData.discountAmount ?? 0, 'discount');
    orderData.taxAmount = money(orderData.taxAmount ?? 0, 'tax');
    orderData.serviceCharge = money(orderData.serviceCharge ?? 0, 'service charge');
    orderData.grandTotal = money(orderData.grandTotal ?? 0, 'grand total');
    if (orderData.discountAmount > orderData.subtotal) {
      throw new ApiError(400, 'Discount cannot exceed the order subtotal');
    }
    if (orderData.grandTotal > orderData.subtotal - orderData.discountAmount + orderData.taxAmount + orderData.serviceCharge + 1) {
      throw new ApiError(400, 'Grand total is inconsistent with the bill breakup');
    }

    // Normalize orderType & tableNumber aliases
    orderData.orderType = orderData.orderType || orderData.type || 'dine-in';
    if (orderData.tableNo && !orderData.tableNumber) orderData.tableNumber = orderData.tableNo;

    // Delivery orders must carry a drop address (Swiggy/Zomato-style contract)
    if (String(orderData.orderType || '').toLowerCase() === 'delivery') {
      if (!orderData.deliveryAddress || !String(orderData.deliveryAddress).trim()) {
        throw new ApiError(400, 'Delivery address is required for delivery orders');
      }
      if (!orderData.customerPhone || !String(orderData.customerPhone).trim()) {
        throw new ApiError(400, 'Customer phone is required for delivery orders');
      }
      orderData.deliveryStatus = orderData.deliveryStatus || 'preparing';
    }

    // Strict coupon re-validation when a coupon is attached (POS + storefront ready)
    if (orderData.couponCode) {
      try {
        CouponService.validateCoupon({
          couponCode: orderData.couponCode,
          subtotal: Number(orderData.subtotal || 0),
          cartItems: orderData.items || [],
          orderType: orderData.orderType || 'dine-in',
          customerId: orderData.customerId,
          customerPhone: orderData.customerPhone
        });
      } catch (e) {
        throw new ApiError(400, e.message || 'Invalid coupon for this order');
      }
    }

    // Loyalty redeem pre-check: customer must have enough points
    const redeemPts = Math.floor(Number(orderData.loyaltyPointsRedeemed || 0));
    if (redeemPts > 0) {
      if (!orderData.customerId) throw new ApiError(400, 'Loyalty redemption requires a linked customer');
      const cust = CustomerModel.findById(orderData.customerId);
      if (!cust) throw new ApiError(404, 'Loyalty customer not found');
      if (cust.loyaltyPoints < redeemPts) {
        throw new ApiError(400, `Insufficient loyalty points (balance: ${cust.loyaltyPoints}, requested: ${redeemPts})`);
      }
    }

    // QR Table Ordering Security & Context Check
    if (orderData.orderSource === 'QR_TABLE' || orderData.qrToken) {
      let table = null;
      if (orderData.qrToken) {
        table = TableModel.findByQrToken(orderData.qrToken);
        if (!table) {
          throw new ApiError(400, 'Invalid or expired QR token for this table');
        }
      } else if (orderData.tableId) {
        table = TableModel.findById(orderData.tableId);
      }

      if (table) {
        if (table.qrStatus === 'disabled') {
          throw new ApiError(403, `Ordering from Table ${table.tableNumber} is currently disabled.`);
        }
        orderData.tableId = table.id;
        orderData.tableNumber = table.tableNumber;
        orderData.orderSource = 'QR_TABLE';
        orderData.qrToken = table.qrToken;
        if (!orderData.serverStaff) {
          orderData.serverStaff = `QR Self-Order (${table.tableNumber})`;
        }
      }
    }

    const createdOrder = OrderModel.create(orderData);

    // 1. If assigned to a table, update table status to Occupied
    if (createdOrder.tableId) {
      const updatedTable = TableModel.updateStatus(createdOrder.tableId, 'Occupied', createdOrder.customerName, createdOrder.id);
      eventHub.broadcast('TABLE_STATUS_CHANGED', { id: createdOrder.tableId, status: 'Occupied' });
      eventHub.broadcast('table_updated', updatedTable);
    }

    // 2. If coupon applied, record usage
    if (createdOrder.couponId || createdOrder.couponCode) {
      CouponModel.recordUsage(createdOrder.couponId || createdOrder.couponCode, createdOrder.discountAmount, createdOrder.grandTotal);
    }

    // 2b. Loyalty redeem: deduct points immediately (1 pt = Rs1 discount already applied to totals by POS)
    if (redeemPts > 0 && orderData.customerId) {
      CustomerModel.updateLoyalty(orderData.customerId, -redeemPts, 0, false);
      AuditLogModel.log({
        user: createdOrder.serverStaff || 'Cashier',
        action: 'REDEEM_LOYALTY',
        category: 'Customers',
        details: `Redeemed ${redeemPts} loyalty points (Rs${redeemPts}) for ${createdOrder.customerName} on order #${createdOrder.orderNumber}`,
        ip: clientIp
      });
    }

    // 3. Dispatch Live Notification
    const isQr = createdOrder.orderSource === 'QR_TABLE';
    const isDelivery = String(createdOrder.orderType || '').toLowerCase() === 'delivery';
    const newOrderNotif = NotificationModel.create({
      title: isQr ? `New QR Table Order (${createdOrder.tableNumber})` : isDelivery ? 'New Delivery Order' : 'New Order Received',
      message: isDelivery
        ? `Delivery order #${createdOrder.orderNumber} to ${String(createdOrder.deliveryAddress || '').slice(0, 60)} for ₹${createdOrder.grandTotal.toFixed(2)}`
        : `Order #${createdOrder.orderNumber} ${isQr ? `at Table ${createdOrder.tableNumber}` : `(${createdOrder.orderType.toUpperCase()})`} placed for ₹${createdOrder.grandTotal.toFixed(2)}`,
      type: isQr ? 'order' : 'order',
      link: isDelivery ? '/orders?tab=delivery' : '/kitchen'
    });

    // 4. Record Audit Log
    AuditLogModel.log({
      user: createdOrder.serverStaff || 'Online Guest',
      action: 'CREATE_ORDER',
      category: 'Orders',
      details: `Created order #${createdOrder.orderNumber} (Source: ${createdOrder.orderSource}) for ₹${createdOrder.grandTotal.toFixed(2)} (${createdOrder.items.length} items)`,
      ip: clientIp
    });

    // 5. Broadcast Real-Time SSE to Kitchen KDS, POS, & Admin
    eventHub.broadcast('NEW_ORDER', createdOrder);
    eventHub.broadcast('order_created', createdOrder);
    eventHub.broadcast('NEW_NOTIFICATION', newOrderNotif);
    eventHub.broadcast('ORDER_ALERT', newOrderNotif);

    return createdOrder;
  }

  /**
   * Transition Order Status with cross-module workflow actions
   */
  static updateStatus(orderId, nextStatus, reason = '', clientIp = '127.0.0.1') {
    const currentOrder = OrderModel.findById(orderId);
    if (!currentOrder) {
      throw new ApiError(404, `Order with ID "${orderId}" not found`);
    }

    const normalized = normalizeOrderStatus(nextStatus);
    if (!normalized) {
      throw new ApiError(400, `Invalid order status "${nextStatus}". Allowed: placed, accepted, brewing, ready, out_for_delivery, delivered, completed, cancelled, refunded`);
    }
    if (!isValidStatusTransition(currentOrder.status, normalized)) {
      throw new ApiError(400, `Cannot transition order #${currentOrder.orderNumber} from "${currentOrder.status}" to "${normalized}"`);
    }
    nextStatus = normalized;

    const isDeliveryOrder = String(currentOrder.orderType || '').toLowerCase() === 'delivery';
    if (nextStatus === ORDER_STATUS.OUT_FOR_DELIVERY && !isDeliveryOrder) {
      throw new ApiError(400, 'Only delivery orders can go out for delivery');
    }
    if (nextStatus === ORDER_STATUS.DELIVERED && !isDeliveryOrder) {
      throw new ApiError(400, 'Only delivery orders can be marked delivered');
    }

    const now = getCurrentTimestamp();
    let kitchenAcceptedAt = currentOrder.kitchenAcceptedAt;
    let kitchenReadyAt = currentOrder.kitchenReadyAt;
    let completedAt = currentOrder.completedAt;
    let paymentStatus = currentOrder.paymentStatus;
    // Delivery-leg patch fields (persisted via OrderModel.updateStatus)
    const deliveryPatch = {};
    const isCompletion = nextStatus === ORDER_STATUS.COMPLETED || nextStatus === ORDER_STATUS.DELIVERED;

    if (nextStatus === ORDER_STATUS.ACCEPTED && !kitchenAcceptedAt) {
      kitchenAcceptedAt = now;
    } else if (nextStatus === ORDER_STATUS.READY && !kitchenReadyAt) {
      kitchenReadyAt = now;
      const readyNotif = NotificationModel.create({
        title: 'Order Ready to Serve',
        message: `Order #${currentOrder.orderNumber} ${currentOrder.tableNumber ? `for Table ${currentOrder.tableNumber}` : ''} is prepared and ready!`,
        type: 'success',
        link: '/orders'
      });
      eventHub.broadcast('NEW_NOTIFICATION', readyNotif);
    } else if (nextStatus === ORDER_STATUS.OUT_FOR_DELIVERY) {
      // Rider leaves with the food — generate handover OTP (customer shows it, rider verifies)
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      deliveryPatch.deliveryOtp = otp;
      deliveryPatch.deliveryStatus = 'out_for_delivery';
      deliveryPatch.outForDeliveryAt = now;
      if (!kitchenReadyAt) kitchenReadyAt = now;
      const riderLabel = currentOrder.riderName ? `Rider ${currentOrder.riderName}` : 'Rider';
      const ofdNotif = NotificationModel.create({
        title: 'Order Out for Delivery',
        message: `Order #${currentOrder.orderNumber} is out for delivery (${riderLabel}). OTP ${otp} shared with customer.`,
        type: 'info',
        link: '/orders?tab=delivery'
      });
      eventHub.broadcast('NEW_NOTIFICATION', ofdNotif);
      eventHub.broadcast('DELIVERY_OUT', { id: orderId, orderNumber: currentOrder.orderNumber, status: nextStatus, riderName: currentOrder.riderName || null });
      AuditLogModel.log({
        user: 'Delivery Desk',
        action: 'OUT_FOR_DELIVERY',
        category: 'Orders',
        details: `Order #${currentOrder.orderNumber} dispatched ${currentOrder.riderName ? `with ${currentOrder.riderName}` : ''}. Handover OTP generated.`,
        ip: clientIp
      });
    } else if (isCompletion) {
      if (nextStatus === ORDER_STATUS.DELIVERED) {
        deliveryPatch.deliveryStatus = 'delivered';
        deliveryPatch.deliveredAt = now;
      }
      completedAt = now;
      paymentStatus = 'Paid';
      completedAt = now;
      paymentStatus = 'Paid';

      // A. Automatic Recipe-Based Inventory Deduction
      if (Array.isArray(currentOrder.items)) {
        currentOrder.items.forEach((item) => {
          const productId = item.productId || item.id;
          const deducted = InventoryModel.deductIngredients(productId, item.quantity || 1);
          // Low-stock alert per depleted ingredient
          (deducted || []).forEach((ing) => {
            if (ing.status === 'Low Stock') {
              const lowNotif = NotificationModel.create({
                title: 'Low Stock Alert',
                message: `${ing.name} stock has dropped to ${ing.currentStock} ${ing.unit} (min ${ing.minStock})`,
                type: 'warning',
                link: '/inventory'
              });
              eventHub.broadcast('NEW_NOTIFICATION', lowNotif);
              eventHub.broadcast('LOW_STOCK_ALERT', lowNotif);
            }
          });
        });
      }

      // B. Award Customer Loyalty Points and Spend (1pt per Rs100) on completed order
      // Redeem deduction already happened at creation time; only earn here.
      if (currentOrder.customerId) {
        const pointsEarned = pointsForAmount(currentOrder.grandTotal, 1);
        CustomerModel.updateLoyalty(currentOrder.customerId, pointsEarned, currentOrder.grandTotal, true);
      } else if (currentOrder.customerPhone) {
        // Link by phone if id missing: earn points on matched profile
        try {
          const match = CustomerModel.findByPhone(currentOrder.customerPhone);
          if (match) {
            const pointsEarned = pointsForAmount(currentOrder.grandTotal, 1);
            CustomerModel.updateLoyalty(match.id, pointsEarned, currentOrder.grandTotal, true);
          }
        } catch (e) {}
      }

      // D. Record Audit Log
      AuditLogModel.log({
        user: nextStatus === ORDER_STATUS.DELIVERED ? 'Delivery Desk' : 'Kitchen/Staff',
        action: nextStatus === ORDER_STATUS.DELIVERED ? 'DELIVER_ORDER' : 'COMPLETE_ORDER',
        category: 'Orders',
        details: nextStatus === ORDER_STATUS.DELIVERED
          ? `Delivered order #${currentOrder.orderNumber} to ${String(currentOrder.deliveryAddress || '').slice(0, 80)}, recorded ₹${currentOrder.grandTotal.toFixed(2)}`
          : `Completed order #${currentOrder.orderNumber}, deducted inventory stock, recorded ₹${currentOrder.grandTotal.toFixed(2)}`,
        ip: clientIp
      });
    } else if (nextStatus === ORDER_STATUS.CANCELLED) {
      AuditLogModel.log({
        user: 'Staff',
        action: 'CANCEL_ORDER',
        category: 'Orders',
        details: `Cancelled order #${currentOrder.orderNumber}. Reason: ${reason || 'Not specified'}`,
        ip: clientIp
      });
    } else if (nextStatus === ORDER_STATUS.REFUNDED) {
      paymentStatus = 'Refunded';
      AuditLogModel.log({
        user: 'Staff',
        action: 'REFUND_ORDER',
        category: 'Orders',
        details: `Refunded order #${currentOrder.orderNumber} (₹${currentOrder.grandTotal.toFixed(2)}). Reason: ${reason || 'Not specified'}`,
        ip: clientIp
      });
      NotificationModel.create({
        title: 'Order Refunded',
        message: `Order #${currentOrder.orderNumber} refunded ₹${currentOrder.grandTotal.toFixed(2)}`,
        type: 'warning',
        link: '/orders'
      });
      eventHub.broadcast('NEW_NOTIFICATION', NotificationModel.findAll(1)[0]);
    }

    // Generic status-change audit trail (covers Accepted / Preparing / Ready / Out-for-delivery too)
    if (![ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(nextStatus)) {
      AuditLogModel.log({
        user: 'Kitchen/Staff',
        action: 'UPDATE_ORDER_STATUS',
        category: 'Orders',
        details: `Order #${currentOrder.orderNumber} status: ${currentOrder.status} → ${nextStatus}`,
        ip: clientIp
      });
    }

    // Perform database update on the Order first
    const updatedOrder = OrderModel.updateStatus(orderId, {
      status: nextStatus,
      kitchenAcceptedAt,
      kitchenReadyAt,
      completedAt,
      paymentStatus,
      ...deliveryPatch
    });

    // Handle Table State Automation based on remaining active orders
    const isTerminal = [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(nextStatus);
    if (currentOrder.tableId && isTerminal) {
      const activeOrders = TableModel.getActiveOrders(currentOrder.tableId);
      if (activeOrders.length === 0) {
        TableModel.updateStatus(currentOrder.tableId, 'Cleaning', null, null);
      } else {
        // Table still has pending orders in same sitting
        TableModel.updateStatus(currentOrder.tableId, 'Occupied', activeOrders[0].customerName, activeOrders[0].id);
      }
    }

    // Broadcast Real-Time SSE status update (Updates KDS, POS, and Customer live tracking)
    eventHub.broadcast('ORDER_STATUS_CHANGED', {
      id: orderId,
      orderNumber: currentOrder.orderNumber,
      status: nextStatus,
      tableNumber: currentOrder.tableNumber,
      completedAt
    });
    eventHub.broadcast('order_status_changed', {
      id: orderId,
      orderNumber: currentOrder.orderNumber,
      status: nextStatus,
      tableNumber: currentOrder.tableNumber,
      completedAt
    });
    if (currentOrder.tableId && isTerminal) {
      const latestTable = TableModel.findById(currentOrder.tableId);
      if (latestTable) eventHub.broadcast('table_updated', latestTable);
    }

    return updatedOrder;
  }

  /**
   * Assign / change the delivery rider on a delivery order.
   */
  static assignRider(orderId, { riderName, riderPhone, riderId } = {}, clientIp = '127.0.0.1') {
    const currentOrder = OrderModel.findById(orderId);
    if (!currentOrder) throw new ApiError(404, `Order with ID "${orderId}" not found`);
    if (String(currentOrder.orderType || '').toLowerCase() !== 'delivery') {
      throw new ApiError(400, 'Riders can only be assigned to delivery orders');
    }
    if (['delivered', 'cancelled', 'refunded'].includes(String(currentOrder.status || '').toLowerCase())) {
      throw new ApiError(400, `Cannot assign rider to a ${currentOrder.status} order`);
    }
    if (!riderName || !String(riderName).trim()) throw new ApiError(400, 'Rider name is required');
    const updated = OrderModel.updateStatus(orderId, {
      status: currentOrder.status,
      riderId: riderId || currentOrder.riderId || `rider-${Date.now()}`,
      riderName: String(riderName).trim(),
      riderPhone: riderPhone ? String(riderPhone).trim() : currentOrder.riderPhone
    });
    eventHub.broadcast('RIDER_ASSIGNED', {
      id: orderId, orderNumber: currentOrder.orderNumber,
      riderName: String(riderName).trim(), riderPhone: riderPhone || null
    });
    AuditLogModel.log({
      user: 'Delivery Desk', action: 'ASSIGN_RIDER', category: 'Orders',
      details: `Assigned rider ${String(riderName).trim()} to delivery order #${currentOrder.orderNumber}`,
      ip: clientIp
    });
    return updated;
  }

  /**
   * Verify the handover OTP (rider collects OTP from customer) → marks delivered.
   */
  static verifyDeliveryOtp(orderId, otp, clientIp = '127.0.0.1') {
    const currentOrder = OrderModel.findById(orderId);
    if (!currentOrder) throw new ApiError(404, `Order with ID "${orderId}" not found`);
    if (String(currentOrder.status || '').toLowerCase() !== 'out_for_delivery') {
      throw new ApiError(400, 'OTP can only be verified for orders out for delivery');
    }
    if (!currentOrder.deliveryOtp || String(otp || '').trim() !== String(currentOrder.deliveryOtp)) {
      throw new ApiError(400, 'Invalid handover OTP. Ask the customer for the 4-digit code in their tracker.');
    }
    return this.updateStatus(orderId, 'delivered', 'OTP verified at doorstep', clientIp);
  }

  /**
   * Refund a completed order (convenience wrapper over updateStatus).
   */
  static refundOrder(orderId, reason = '', clientIp = '127.0.0.1') {
    return this.updateStatus(orderId, 'refunded', reason, clientIp);
  }
}
