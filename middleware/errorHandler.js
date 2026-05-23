const { Prisma } = require('@prisma/client');

// Prisma error codes
const PRISMA_ERROR_CODES = {
    P2002: 'Unique constraint violation',
    P2003: 'Foreign key constraint violation',
    P2025: 'Record not found'
};

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Validation errors (already handled by controllers, but catch any)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors || []
        });
    }

    // Prisma errors
    if (err.code && PRISMA_ERROR_CODES[err.code]) {
        return res.status(409).json({
            success: false,
            message: PRISMA_ERROR_CODES[err.code]
        });
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        switch (err.code) {
            case 'P2025':
                return res.status(404).json({ success: false, message: 'Record not found' });
            default:
                return res.status(400).json({ success: false, message: err.message });
        }
    }

    // Auth errors
    if (err.name === 'AuthError') {
        return res.status(err.status || 401).json({ success: false, message: err.message });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
};

module.exports = errorHandler;
