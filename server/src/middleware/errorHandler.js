import { errorResponse } from '../utils/response.js';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
    return errorResponse(res, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`, 404);
};

/**
 * Global Error Handler Middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
    console.error('🔥 [ERROR]:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan internal pada server';

    return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};
