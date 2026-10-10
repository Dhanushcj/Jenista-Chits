"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const express_1 = require("express");
const ApiError_1 = require("../common/ApiError");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error(err);
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errorCode: err.errorCode,
            errors: err.errors || [],
        });
    }
    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errorCode: 'VALIDATION_ERROR',
            errors: err.errors,
        });
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        errorCode: 'INTERNAL_SERVER_ERROR',
        errors: [],
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map