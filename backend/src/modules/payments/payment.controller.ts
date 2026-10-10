import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { Payment } from './payment.model';
import { AuthRequest } from '../../middleware/authenticate';

export class PaymentController {
  static async processPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.processPayment(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await Payment.find()
        .populate('customerId', 'fullName customerCode')
        .populate('chitGroupId', 'groupName');
      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }
}
