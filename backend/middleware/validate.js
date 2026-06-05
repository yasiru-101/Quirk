/**
 * Middleware runner to validate request bodies using Zod schemas.
 * Formats validation errors to match what the frontend's normalizeError expects:
 * {
 *   "message": "Validation failed",
 *   "errors": {
 *     "fieldName": "error message"
 *   }
 * }
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  
  if (!result.success) {
    const fieldErrors = {};
    result.error.issues.forEach((err) => {
      // Map issues to key-value pairs
      const path = err.path.join('.');
      fieldErrors[path] = err.message;
    });

    return res.status(400).json({
      message: 'Validation failed',
      errors: fieldErrors,
    });
  }

  // Assign parsed and cleaned data back to req.body
  req.body = result.data;
  next();
};

module.exports = validate;
