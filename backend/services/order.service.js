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
    const newOrderNotif = NotificationModel.create({
      title: isQr ? `New QR Table Order (${createdOrder.tableNumber})` : 'New Order Received',
      message: `Order #${createdOrder.orderNumber} ${isQr ? `at Table ${createdOrder.tableNumber}` : `(${createdOrder.orderType.toUpperCase()})`} placed for ₹${createdOrder.grandTotal.toFixed(2)}`,
      type: isQr ? 'order' : 'order',
      link: '/kitchen'
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
      throw new ApiError(400, `Invalid order status "${nextStatus}". Allowed: placed, accepted, brewing, ready, completed, cancelled, refunded`);
    }
    if (!isValidStatusTransition(currentOrder.status, normalized)) {
      throw new ApiError(400, `Cannot transition order #${currentOrder.orderNumber} from "${currentOrder.status}" to "${normalized}"`);
    }
    nextStatus = normalized;

    const now = getCurrentTimestamp();
    let kitchenAcceptedAt = currentOrder.kitchenAcceptedAt;
    let kitchenReadyAt = currentOrder.kitchenReadyAt;
    let completedAt = currentOrder.completedAt;
    let paymentStatus = currentOrder.paymentStatus;

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
    } else if (nextStatus === ORDER_STATUS.COMPLETED) {
      completedAt = now;
      paymentStatus = 'Paid';

      // A. Automatic Recipe-Based Inventory Deduction
      if (Array.isArray(currentOrder.items)) {
        currentOrder.items.forEach((item) => {
          const deducted = InventoryModel.deductIngredients(item.productId, item.quantity || 1);
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
        user: 'Kitchen/Staff',
        action: 'COMPLETE_ORDER',
        category: 'Orders',
        details: `Completed order #${currentOrder.orderNumber}, deducted inventory stock, recorded ₹${currentOrder.grandTotal.toFixed(2)}`,
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

    // Generic status-change audit trail (covers Accepted / Preparing / Ready too)
    if (![ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(nextStatus)) {
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
      paymentStatus
    });

    // Handle Table State Automation based on remaining active orders
    if (currentOrder.tableId && (nextStatus === ORDER_STATUS.COMPLETED || nextStatus === ORDER_STATUS.CANCELLED || nextStatus === ORDER_STATUS.REFUNDED)) {
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
    if (currentOrder.tableId && (nextStatus === ORDER_STATUS.COMPLETED || nextStatus === ORDER_STATUS.CANCELLED || nextStatus === ORDER_STATUS.REFUNDED)) {
      const latestTable = TableModel.findById(currentOrder.tableId);
      if (latestTable) eventHub.broadcast('table_updated', latestTable);
    }

    return updatedOrder;
  }

  /**
   * Refund a completed order (convenience wrapper over updateStatus).
   */
  static refundOrder(orderId, reason = '', clientIp = '127.0.0.1') {
    return this.updateStatus(orderId, 'refunded', reason, clientIp);
  }
}
