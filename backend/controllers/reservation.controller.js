import { TableModel, ReservationModel } from '../models/Table.model.js';
import { NotificationModel } from '../models/System.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getReservations = asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  const reservations = ReservationModel.findAll({ date, status });
  return ApiResponse.success(res, reservations);
});

export const createReservation = asyncHandler(async (req, res) => {
  const { customerName, phone, date, time, guests, tableId, tableNumber, specialRequest, email } = req.body;
  if (!customerName || !phone || !date || !time) {
    throw new ApiError(400, 'Customer name, phone, date, and time are required');
  }

  // Auto-assign table if not specified
  let assignedTableId = tableId;
  let assignedTableNumber = tableNumber;

  if (!assignedTableId) {
    const allTables = TableModel.findAll();
    const freeTable = allTables.find(t => t.status === 'Available' && t.capacity >= Number(guests || 2));
    if (freeTable) {
      assignedTableId = freeTable.id;
      assignedTableNumber = freeTable.tableNumber;
    } else {
      assignedTableId = 'tbl-1';
      assignedTableNumber = 'T-01';
    }
  }

  const created = ReservationModel.create({
    customerName,
    phone,
    email,
    date,
    time,
    guests,
    tableId: assignedTableId,
    tableNumber: assignedTableNumber,
    specialRequest
  });

  if (assignedTableId) {
    TableModel.updateStatus(assignedTableId, 'Reserved', customerName);
  }

  NotificationModel.create({
    title: 'New Table Booking',
    message: `${customerName} booked table for ${guests} on ${date} at ${time}`,
    type: 'reservation',
    link: '/reservations'
  });

  eventHub.broadcast('NEW_RESERVATION', created);

  return ApiResponse.created(res, created);
});

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) throw new ApiError(400, 'Status is required');

  const current = ReservationModel.findById(id);
  if (!current) throw new ApiError(404, 'Reservation not found');

  if (status === 'Seated' && current.tableId) {
    TableModel.updateStatus(current.tableId, 'Occupied', current.customerName);
  } else if (['Completed', 'Cancelled', 'No-show'].includes(status) && current.tableId) {
    TableModel.updateStatus(current.tableId, 'Available', null);
  }

  const updated = ReservationModel.updateStatus(id, status);
  return ApiResponse.success(res, updated, 'Reservation status updated');
});
