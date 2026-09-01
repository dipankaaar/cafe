import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller.js';

const router = Router();

router.get('/', reservationController.getReservations);
router.post('/', reservationController.createReservation);
router.patch('/:id/status', reservationController.updateReservationStatus);

export default router;
