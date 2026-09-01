import { OrderModel } from '../models/Order.model.js';
import { TableModel } from '../models/Table.model.js';
import { CouponModel, CustomerModel } from '../models/Customer.model.js';
import { InventoryModel } from '../models/Inventory.model.js';
import { NotificationModel, AuditLogModel } from '../models/System.model.js';
import { eventHub } from './eventHub.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS } from '../config/constants.js';
import { getCurrentTimestamp } from '../utils/helpers.js';

export class OrderService {
  /**
   * Create a new Order (POS / Online Storefront / QR Table Ordering)
   */
  static createOrder(orderData, clientIp = '127.0.0.1') {
    if (!orderData.items || orderData.items.length === 0) {
      throw new ApiError(400, 'Order cart cannot be empty');
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
      TableModel.updateStatus(createdOrder.tableId, 'Occupied', createdOrder.customerName, createdOrder.id);
    }

    // 2. If coupon applied, record usage
    if (createdOrder.couponId || createdOrder.couponCode) {
      CouponModel.recordUsage(createdOrder.couponId || createdOrder.couponCode, createdOrder.discountAmount, createdOrder.grandTotal);
    }

    // 3. Dispatch Live Notification
    const isQr = createdOrder.orderSource === 'QR_TABLE';
    NotificationModel.create({
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

    const now = getCurrentTimestamp();
    let kitchenAcceptedAt = currentOrder.kitchenAcceptedAt;
    let kitchenReadyAt = currentOrder.kitchenReadyAt;
    let completedAt = currentOrder.completedAt;
    let paymentStatus = currentOrder.paymentStatus;

    if (nextStatus === ORDER_STATUS.ACCEPTED && !kitchenAcceptedAt) {
      kitchenAcceptedAt = now;
    } else if (nextStatus === ORDER_STATUS.READY && !kitchenReadyAt) {
      kitchenReadyAt = now;
      NotificationModel.create({
        title: 'Order Ready to Serve',
        message: `Order #${currentOrder.orderNumber} ${currentOrder.tableNumber ? `for Table ${currentOrder.tableNumber}` : ''} is prepared and ready!`,
        type: 'success',
        link: '/orders'
      });
    } else if (nextStatus === ORDER_STATUS.COMPLETED) {
      completedAt = now;
      paymentStatus = 'Paid';

      // A. Automatic Recipe-Based Inventory Deduction
      if (Array.isArray(currentOrder.items)) {
        currentOrder.items.forEach((item) => {
          InventoryModel.deductIngredients(item.productId, item.quantity || 1);
        });
      }

      // B. Award Customer Loyalty Points and Spend
      if (currentOrder.customerId) {
        const pointsEarned = Math.floor(currentOrder.grandTotal / 100);
        CustomerModel.updateLoyalty(currentOrder.customerId, pointsEarned, currentOrder.grandTotal);
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
    if (currentOrder.tableId && (nextStatus === ORDER_STATUS.COMPLETED || nextStatus === ORDER_STATUS.CANCELLED)) {
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

    return updatedOrder;
  }
}
