import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['customers.create']), CustomerController.createCustomer);
router.get('/', authorize(['customers.read']), CustomerController.getCustomers);

export default router;
