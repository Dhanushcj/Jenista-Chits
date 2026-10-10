import { Request, Response, NextFunction } from 'express';
import { Customer } from './customer.model';
import { ApiError } from '../../common/ApiError';
import { AuthRequest } from '../../middleware/authenticate';
import bcrypt from 'bcryptjs';

export class CustomerController {
  static async createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, mobile, address, password } = req.body;
      
      const phone = mobile || req.body.phone;
      const fullName = name || req.body.fullName;
      
      if (!phone || !fullName) {
        throw new ApiError(400, 'Name and Mobile are required', 'VALIDATION_ERROR');
      }

      const existing = await Customer.findOne({ phone });
      if (existing) {
        throw new ApiError(400, 'Customer with this mobile already exists', 'VALIDATION_ERROR');
      }

      let passwordHash;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      const customerCode = req.body.customerCode || `TC-${Math.floor(Math.random() * 90000) + 10000}`;

      const customer = await Customer.create({
        ...req.body,
        customerCode,
        fullName,
        phone,
        address: address || req.body.address,
        passwordHash,
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
