import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Public route for customer registration
router.post('/', CustomerController.createCustomer);

// Protected routes
router.use(authenticate);
router.get('/', authorize(['customers.read']), CustomerController.getCustomers);

export default router;
