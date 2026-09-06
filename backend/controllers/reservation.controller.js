import { TableModel, ReservationModel } from '../models/Table.model.js';
import { NotificationModel, AuditLogModel } from '../models/System.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidIndianPhone, normalizeIndianPhone, isValidEmail, isValidDateString, isPastDateString, isValidTimeString } from '../utils/helpers.js';

const RES_STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'];

function validateReservationPayload({ customerName, phone, email, date, time, guests }, { requireAll = true } = {}) {
  if (requireAll || customerName !== undefined) {
    if (!customerName || String(customerName).trim().length < 2) {
      throw new ApiError(400, 'Guest name must be at least 2 characters');
    }
  }
  if (requireAll || phone !== undefined) {
    if (!phone || !isValidIndianPhone(phone)) {
      throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number (starts with 6-9)');
    }
  }
  if (email !== undefined && email !== '' && email !== null && !isValidEmail(email)) {
    throw new ApiError(400, 'Enter a valid email address');
  }
  if (requireAll || date !== undefined) {
    if (!date || !isValidDateString(date)) throw new ApiError(400, 'Reservation date must be YYYY-MM-DD');
    if (isPastDateString(date)) throw new ApiError(400, 'Reservation date cannot be in the past');
  }
  if (requireAll || time !== undefined) {
    if (!time || !isValidTimeString(time)) throw new ApiError(400, 'Reservation time must be HH:MM (24h)');
  }
  if (guests !== undefined) {
    const g = Number(guests);
    if (!Number.isInteger(g) || g < 1 || g > 30) throw new ApiError(400, 'Party size must be 1-30 guests');
  }
}

function autoAssignTable(guests, date, time, excludeId = null) {
  const allTables = TableModel.findAll();
  // Prefer smallest fitting table with no conflict
  const candidates = allTables
    .filter((t) => t.capacity >= Number(guests || 2))
    .sort((a, b) => a.capacity - b.capacity);
  for (const t of candidates) {
    const conflict = ReservationModel.hasConflict({ tableId: t.id, date, time, excludeId });
    if (!conflict) return t;
  }
  return null;
}

export const getReservations = asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  if (date && !isValidDateString(date)) throw new ApiError(400, 'date filter must be YYYY-MM-DD');
  const reservations = ReservationModel.findAll({ date, status });
  return ApiResponse.success(res, reservations);
});

export const getReservationById = asyncHandler(async (req, res) => {
  const r = ReservationModel.findById(req.params.id);
  if (!r) throw new ApiError(404, 'Reservation not found');
  return ApiResponse.success(res, r);
});

export const createReservation = asyncHandler(async (req, res) => {
  const { customerName, phone, date, time, guests, tableId, tableNumber, specialRequest, email } = req.body;
  if (!customerName || !phone || !date || !time) {
    throw new ApiError(400, 'Customer name, phone, date, and time are required');
  }
  validateReservationPayload({ customerName, phone, email, date, time, guests });
  const normalizedPhone = normalizeIndianPhone(phone);

  // Auto-assign table if not specified; validate capacity + conflict otherwise
  let assignedTableId = tableId || null;
  let assignedTableNumber = tableNumber || null;

  if (!assignedTableId) {
    const free = autoAssignTable(guests, date, time);
    if (!free) {
      throw new ApiError(409, `No table fits ${guests || 2} guest(s) at ${date} ${time}. Try another slot.`);
    }
    assignedTableId = free.id;
    assignedTableNumber = free.tableNumber;
  } else {
    const table = TableModel.findById(assignedTableId);
    if (!table) throw new ApiError(404, 'Selected table not found');
    if (Number(guests || 2) > Number(table.capacity)) {
      throw new ApiError(400, `Table ${table.tableNumber} seats only ${table.capacity} (party: ${guests})`);
    }
    const conflict = ReservationModel.hasConflict({ tableId: assignedTableId, date, time });
    if (conflict) {
      throw new ApiError(409, `Table ${table.tableNumber} already booked on ${date} at ${conflict.time} (${conflict.customerName}). Pick another table/time.`);
    }
    assignedTableNumber = assignedTableNumber || table.tableNumber;
  }

  const created = ReservationModel.create({
    customerName: String(customerName).trim(),
    phone: normalizedPhone,
    email: email ? String(email).trim() : '',
    date,
    time,
    guests,
    tableId: assignedTableId,
    tableNumber: assignedTableNumber,
    specialRequest
  });

  if (assignedTableId) {
    try { TableModel.updateStatus(assignedTableId, 'Reserved', String(customerName).trim()); } catch (e) {}
  }

  NotificationModel.create({
    title: 'New Table Booking',
    message: `${customerName} booked table for ${guests} on ${date} at ${time}`,
    type: 'reservation',
    link: '/reservations'
  });

  AuditLogModel.log({
    user: 'Staff', action: 'CREATE_RESERVATION', category: 'Reservations',
    details: `Booked Table ${assignedTableNumber} for ${customerName} (${normalizedPhone}) on ${date} ${time}`,
    ip: req.ip || '127.0.0.1'
  });

  eventHub.broadcast('NEW_RESERVATION', created);

  return ApiResponse.created(res, created);
});

// Full edit (date/time/table/guests/contact) with conflict re-check
export const updateReservation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = ReservationModel.findById(id);
  if (!existing) throw new ApiError(404, 'Reservation not found');
  if (['completed', 'cancelled'].includes(String(existing.status).toLowerCase())) {
    throw new ApiError(409, `Cannot edit a ${existing.status} reservation`);
  }
  validateReservationPayload(req.body, { requireAll: false });

  const next = {
    customerName: req.body.customerName !== undefined ? String(req.body.customerName).trim() : existing.customerName,
    phone: req.body.phone !== undefined ? normalizeIndianPhone(req.body.phone) : existing.phone,
    email: req.body.email !== undefined ? String(req.body.email || '').trim() : existing.email,
    date: req.body.date !== undefined ? req.body.date : existing.date,
    time: req.body.time !== undefined ? req.body.time : existing.time,
    guests: req.body.guests !== undefined ? Number(req.body.guests) : existing.guests,
    tableId: req.body.tableId !== undefined ? (req.body.tableId || null) : existing.tableId,
    tableNumber: req.body.tableNumber !== undefined ? (req.body.tableNumber || null) : existing.tableNumber,
    specialRequest: req.body.specialRequest !== undefined ? String(req.body.specialRequest || '') : existing.specialRequest
  };

  // Auto-assign if table cleared
  if (!next.tableId) {
    const free = autoAssignTable(next.guests, next.date, next.time, id);
    if (!free) throw new ApiError(409, `No table fits ${next.guests} guest(s) at ${next.date} ${next.time}.`);
    next.tableId = free.id;
    next.tableNumber = free.tableNumber;
  } else {
    const table = TableModel.findById(next.tableId);
    if (!table) throw new ApiError(404, 'Selected table not found');
    if (Number(next.guests) > Number(table.capacity)) {
      throw new ApiError(400, `Table ${table.tableNumber} seats only ${table.capacity} (party: ${next.guests})`);
    }
    const conflict = ReservationModel.hasConflict({ tableId: next.tableId, date: next.date, time: next.time, excludeId: id });
    if (conflict) {
      throw new ApiError(409, `Table ${table.tableNumber} already booked on ${next.date} at ${conflict.time} (${conflict.customerName}).`);
    }
    next.tableNumber = next.tableNumber || table.tableNumber;
  }

  const updated = ReservationModel.update(id, next);
  eventHub.broadcast('RESERVATION_UPDATED', updated);
  return ApiResponse.success(res, updated, 'Reservation updated');
});

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) throw new ApiError(400, 'Status is required');
  if (!RES_STATUSES.includes(String(status).toLowerCase())) {
    throw new ApiError(400, `Invalid status. Allowed: ${RES_STATUSES.join(', ')}`);
  }
  // Normalize to Title-case canonical
  const canon = status.toLowerCase() === 'no-show'
    ? 'No-show'
    : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  const current = ReservationModel.findById(id);
  if (!current) throw new ApiError(404, 'Reservation not found');

  // Conflict re-check when confirming/pending a booking
  if (['Pending', 'Confirmed'].includes(canon) && current.tableId) {
    const conflict = ReservationModel.hasConflict({
      tableId: current.tableId, date: current.date, time: current.time, excludeId: id
    });
    if (conflict) {
      throw new ApiError(409, `Table ${current.tableNumber} conflicts with "${conflict.customerName}" at ${conflict.time}.`);
    }
  }

  if (canon === 'Seated' && current.tableId) {
    try { TableModel.updateStatus(current.tableId, 'Occupied', current.customerName); } catch (e) {}
  } else if (['Completed', 'Cancelled', 'No-show'].includes(canon) && current.tableId) {
    try { TableModel.updateStatus(current.tableId, 'Available', null); } catch (e) {}
  } else if (canon === 'Confirmed' && current.tableId) {
    try { TableModel.updateStatus(current.tableId, 'Reserved', current.customerName); } catch (e) {}
  }

  const updated = ReservationModel.updateStatus(id, canon);
  eventHub.broadcast('RESERVATION_UPDATED', updated);
  return ApiResponse.success(res, updated, 'Reservation status updated');
});

export const cancelReservation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const current = ReservationModel.findById(id);
  if (!current) throw new ApiError(404, 'Reservation not found');
  if (current.tableId) {
    try { TableModel.updateStatus(current.tableId, 'Available', null); } catch (e) {}
  }
  const updated = ReservationModel.updateStatus(id, 'Cancelled');
  AuditLogModel.log({
    user: 'Staff', action: 'CANCEL_RESERVATION', category: 'Reservations',
    details: `Cancelled reservation for ${current.customerName} on ${current.date} ${current.time}`,
    ip: req.ip || '127.0.0.1'
  });
  eventHub.broadcast('RESERVATION_UPDATED', updated);
  return ApiResponse.success(res, updated, 'Reservation cancelled');
});

export const deleteReservation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const current = ReservationModel.findById(id);
  if (!current) throw new ApiError(404, 'Reservation not found');
  if (current.tableId && !['Completed', 'Cancelled', 'No-show'].includes(current.status)) {
    try { TableModel.updateStatus(current.tableId, 'Available', null); } catch (e) {}
  }
  ReservationModel.delete(id);
  return ApiResponse.success(res, { id }, 'Reservation deleted');
});
