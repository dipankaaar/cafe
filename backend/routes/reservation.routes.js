import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller.js';

const router = Router();

router.get('/', reservationController.getReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.patch('/:id/status', reservationController.updateReservationStatus);
router.post('/:id/cancel', reservationController.cancelReservation);
router.delete('/:id', reservationController.deleteReservation);

export default router;
