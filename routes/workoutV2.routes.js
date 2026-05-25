const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutV2.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

// Modern Scalable Flat-API Architecture
router.get('/all', authenticate, workoutController.getAllWorkouts);
router.post('/', authenticate, authorizeAdmin, uploadMiddleware, workoutController.createWorkout);
router.put('/:id', authenticate, authorizeAdmin, uploadMiddleware, workoutController.updateWorkout);
router.delete('/:id', authenticate, authorizeAdmin, workoutController.deleteWorkout);

module.exports = router;