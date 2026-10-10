"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const document_model_1 = require("./document.model");
const ApiError_1 = require("../../common/ApiError");
class DocumentController {
    static async uploadDocumentMetadata(req, res, next) {
        try {
            // In a real flow, you'd upload to S3 here or accept an S3 key from a pre-signed URL upload
            const { entityType, entityId, documentType, documentName, s3Key, originalFilename, mimeType, size } = req.body;
            const doc = await document_model_1.AppDocument.create({
                entityType,
                entityId,
                documentType,
                documentName,
                s3Key,
                originalFilename,
                mimeType,
                size,
                uploadedBy: req.user.userId,
            });
            res.status(201).json({ success: true, data: doc });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDocumentsByEntity(req, res, next) {
        try {
            const { entityType, entityId } = req.params;
            const filter = { entityType, entityId: entityId };
            const docs = await document_model_1.AppDocument.find(filter);
            res.status(200).json({ success: true, data: docs });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyDocument(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body; // VERIFIED or REJECTED
            if (!['VERIFIED', 'REJECTED'].includes(status)) {
                throw new ApiError_1.ApiError(400, 'Invalid status', 'VALIDATION_ERROR');
            }
            const doc = await document_model_1.AppDocument.findByIdAndUpdate(id, {
                status,
                verifiedBy: req.user.userId,
                verifiedAt: new Date()
            }, { new: true });
            if (!doc)
                throw new ApiError_1.ApiError(404, 'Document not found', 'NOT_FOUND');
            res.status(200).json({ success: true, data: doc });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DocumentController = DocumentController;
