import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import agreementController from '../controllers/agreementController.js';

const router = Router();

// Semua rute agreements memerlukan autentikasi
router.use(authenticate);

// 1. Digital Rental Agreement (SPK) Details & Signing
router.get('/:bookingId', agreementController.getAgreement);
router.post('/:bookingId/sign', agreementController.signAgreement);

// 2. Official Payment Invoice & Kwitansi Resmi
router.get('/:bookingId/invoice', agreementController.getInvoice);

export default router;
