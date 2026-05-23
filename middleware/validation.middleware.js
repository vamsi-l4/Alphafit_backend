const { body, validationResult, param } = require('express-validator');

exports.validateExercise = [
    body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
    body('equipment').notEmpty().withMessage('Equipment is required'),
    body('steps').notEmpty().withMessage('Steps are required'),
    body('subMuscleId').isInt().withMessage('subMuscleId must be a valid number'),
    body('videoUrl').optional().isURL().withMessage('videoUrl must be a valid URL'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

exports.validateCategory = [
    body('name').notEmpty().withMessage('Name is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

exports.validateMuscle = [
    body('name').notEmpty().withMessage('Name is required'),
    body('categoryId').isInt().withMessage('categoryId must be a valid number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

exports.validateSubMuscle = [
    body('name').notEmpty().withMessage('Name is required'),
    body('muscleId').isInt().withMessage('muscleId must be a valid number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

exports.validateIdParam = [
    param('id').isInt().withMessage('ID must be a valid number')
];

