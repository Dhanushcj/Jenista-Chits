import { Request, Response, NextFunction } from 'express';
import { Customer } from './customer.model';
import { ApiError } from '../../common/ApiError';
import { AuthRequest } from '../../middleware/authenticate';

export class CustomerController {
  static async createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await Customer.findOne({ customerCode: req.body.customerCode });
      if (existing) {
        throw new ApiError(400, 'Customer code already exists', 'VALIDATION_ERROR');
      }

      const customer = await Customer.create({
        ...req.body,
        createdBy: req.user?.userId,
      });
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, assignedAgentId, search } = req.query;
      
      const filter: any = {};
      if (branchId) filter.branchId = branchId;
      if (assignedAgentId) filter.assignedAgentId = assignedAgentId;
      
      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { customerCode: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const customers = await Customer.find(filter)
        .populate('branchId', 'branchName branchCode')
        .populate('assignedAgentId', 'name phone');
        
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }
}
