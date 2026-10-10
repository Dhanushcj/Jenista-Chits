import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.post('/', authorize(['payments.create']), PaymentController.processPayment);
router.get('/', authorize(['payments.read']), PaymentController.getPayments);

export default router;
