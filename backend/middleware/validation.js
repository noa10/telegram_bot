const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to validate request data
 * @param {Array} validations - Array of express-validator validations
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    // Format and return validation errors
    return res.status(400).json({
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

/**
 * Validation rules for creating an order
 */
const orderValidationRules = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string'),
  
  body('products')
    .notEmpty()
    .withMessage('Products are required')
    .isArray()
    .withMessage('Products must be an array'),
  
  body('products.*.id')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('products.*.quantity')
    .notEmpty()
    .withMessage('Product quantity is required')
    .isInt({ min: 1 })
    .withMessage('Product quantity must be a positive integer'),
  
  body('totalAmount')
    .notEmpty()
    .withMessage('Total amount is required')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required')
    .isString()
    .withMessage('Payment intent ID must be a string'),
  
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('Shipping address must be an object')
];

/**
 * Validation rules for creating a payment intent
 */
const paymentIntentValidationRules = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
  
  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code')
];

/**
 * Validation rules for getting user orders
 */
const userOrdersValidationRules = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
];

module.exports = {
  validate,
  orderValidationRules,
  paymentIntentValidationRules,
  userOrdersValidationRules
};
