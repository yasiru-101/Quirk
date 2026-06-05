/**
 * Centralized global error handling middleware.
 * This middleware catches all unhandled errors thrown in the application,
 * categorizes them, maps appropriate HTTP status codes, and standardizes the
 * response format to match what the frontend's normalizeError expects:
 * 
 * {
 *   "message": "Error description message",
 *   "errors": {
 *     "fieldName": "detailed error description"
 *   }
 * }
 */
const errorHandler = (err, req, res, next) => {
  // Log the error stack to console for debugging purposes
  console.error(`[Global Error Handler] Error: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Initialize default error response properties
  let statusCode = err.status || err.statusCode || 500;
  let response = {
    message: err.message || 'Internal server error occurred',
  };

  // --- 1. Handle Mongoose Duplicate Key Errors (MongoDB error code 11000) ---
  // Typically occurs if a user tries to register with an email that already exists.
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    response.message = 'Validation failed';
    response.errors = {
      [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    };
  }

  // --- 2. Handle Mongoose Schema Validation Errors ---
  // Occurs if data fails model-level validation/constraints during a write/save operation.
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    response.message = 'Validation failed';
    response.errors = {};
    Object.values(err.errors).forEach((error) => {
      response.errors[error.path] = error.message;
    });
  }

  // --- 3. Handle Mongoose CastErrors (Invalid ObjectIds) ---
  // Occurs if a route receives a malformed MongoDB ObjectID.
  else if (err.name === 'CastError') {
    statusCode = 404;
    response.message = `Resource not found: Invalid ${err.path}`;
  }

  // --- 4. Handle Zod validation errors ---
  // Fallback handler if a Zod schema validation throws an error directly instead of using safeParse.
  else if (err.name === 'ZodError') {
    statusCode = 400;
    response.message = 'Validation failed';
    response.errors = {};
    err.issues.forEach((e) => {
      const field = e.path.join('.');
      response.errors[field] = e.message;
    });
  }

  // --- 5. Handle JsonWebTokenErrors and TokenExpiredErrors ---
  // Set appropriate status for authentication token issues.
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.message = 'Not authorized, token validation failed';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.message = 'Not authorized, token has expired';
  }

  // Send the standardized JSON error response
  res.status(statusCode).json(response);
};

module.exports = errorHandler;
