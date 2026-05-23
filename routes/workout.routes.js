const express = require('express');
const router = express.Router();
const { authenticate, authorizeMember, authorizeAdmin } = require('../middleware/auth.middleware');
const { validateExercise, validateCategory, validateMuscle, validateSubMuscle, validateIdParam } = require('../middleware/validation.middleware');
const workoutCtrl = require('../controllers/workout.controller');

// Discovery (Public)
router.get('/categories', authenticate, workoutCtrl.getCategories);
router.get('/muscles/:categoryId', authenticate, workoutCtrl.getMuscles);
router.get('/submuscles/:muscleId', authenticate, workoutCtrl.getSubMuscles);
router.get('/exercises/:subMuscleId', authenticate, workoutCtrl.getExercises);

// Favorites
router.get('/favorites', authenticate, authorizeMember, workoutCtrl.getFavorites);
router.post('/favorites', authenticate, authorizeMember, workoutCtrl.addFavorite);
router.delete('/favorites/:id', authenticate, authorizeMember, validateIdParam, workoutCtrl.removeFavorite);

// Tracker
router.get('/workout-log/today', authenticate, authorizeMember, workoutCtrl.getTodayLogs);
router.post('/workout-log', authenticate, authorizeMember, workoutCtrl.logWorkout);

// Admin CRUD - Categories
router.post('/categories', authenticate, authorizeAdmin, validateCategory, workoutCtrl.createCategory);
router.put('/categories/:id', authenticate, authorizeAdmin, validateIdParam, validateCategory, workoutCtrl.updateCategory);
router.delete('/categories/:id', authenticate, authorizeAdmin, validateIdParam, workoutCtrl.deleteCategory);

// Admin CRUD - Muscles
router.post('/muscles', authenticate, authorizeAdmin, validateMuscle, workoutCtrl.createMuscle);
router.put('/muscles/:id', authenticate, authorizeAdmin, validateIdParam, validateMuscle, workoutCtrl.updateMuscle);
router.delete('/muscles/:id', authenticate, authorizeAdmin, validateIdParam, workoutCtrl.deleteMuscle);

// Admin CRUD - SubMuscles
router.post('/submuscles', authenticate, authorizeAdmin, validateSubMuscle, workoutCtrl.createSubMuscle);
router.put('/submuscles/:id', authenticate, authorizeAdmin, validateIdParam, validateSubMuscle, workoutCtrl.updateSubMuscle);
router.delete('/submuscles/:id', authenticate, authorizeAdmin, validateIdParam, workoutCtrl.deleteSubMuscle);

// Admin CRUD - Exercises
router.post('/exercises', authenticate, authorizeAdmin, validateExercise, workoutCtrl.createExercise);
router.put('/exercises/:id', authenticate, authorizeAdmin, validateIdParam, validateExercise, workoutCtrl.updateExercise);
router.delete('/exercises/:id', authenticate, authorizeAdmin, validateIdParam, workoutCtrl.deleteExercise);

module.exports = router;
