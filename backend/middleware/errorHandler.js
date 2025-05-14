/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', err);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Default error status and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = process.env.NODE_ENV === 'production' ? undefined : err.stack;
  
  // Handle specific error types
  if (err.name === 'StripeError') {
    // Handle Stripe errors
    statusCode = err.statusCode || 400;
    message = err.message;
    details = {
      type: err.type,
      code: err.code
    };
  } else if (err.name === 'PostgrestError') {
    // Handle Supabase errors
    statusCode = err.code === 'PGRST116' ? 404 : 400;
    message = err.message;
    details = {
      code: err.code,
      details: err.details
    };
  } else if (err.name === 'ValidationError') {
    // Handle validation errors
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors;
  } else if (err.statusCode) {
    // Handle errors with statusCode property
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      details: process.env.NODE_ENV === 'production' ? undefined : details
    }
  });
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
  
  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }
  
  static unauthorized(message = 'Unauthorized', details = null) {
    return new ApiError(401, message, details);
  }
  
  static forbidden(message = 'Forbidden', details = null) {
    return new ApiError(403, message, details);
  }
  
  static notFound(message = 'Resource not found', details = null) {
    return new ApiError(404, message, details);
  }
  
  static internal(message = 'Internal Server Error', details = null) {
    return new ApiError(500, message, details);
  }
}

/**
 * Middleware to handle 404 errors for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  ApiError,
  notFoundHandler
};
