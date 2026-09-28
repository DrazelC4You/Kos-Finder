/**
 * Response Formatter Utility
 * Menstandarkan seluruh format respons API sesuai Requirement 27
 */

export const successResponse = (res, data = null, message = 'Berhasil', statusCode = 200, meta = null) => {
    const payload = {
        success: true,
        message,
        data
    };
    if (meta) {
        Object.assign(payload, meta);
    }
    return res.status(statusCode).json(payload);
};

export const errorResponse = (res, message = 'Terjadi kesalahan pada server', statusCode = 500, errors = null) => {
    const payload = {
        success: false,
        message
    };
    if (errors) {
        payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
};
