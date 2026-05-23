const prisma = require('../utils/prisma.util');
const { validationResult } = require('express-validator');

// Pagination helper
const getPagination = (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

// --- Workout Discovery (Paginated) ---
exports.getCategories = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req);
        const [categories, total] = await Promise.all([
            prisma.category.findMany({ skip, take: limit }),
            prisma.category.count()
        ]);
        res.json({
            success: true,
            data: categories,
            pagination: { page, limit, total }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMuscles = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        if (isNaN(categoryId)) return res.status(400).json({ success: false, message: 'Invalid category ID' });
        
        const { page, limit, skip } = getPagination(req);
        const [muscles, total] = await Promise.all([
            prisma.muscle.findMany({
                where: { categoryId },
                skip,
                take: limit
            }),
            prisma.muscle.count({ where: { categoryId } })
        ]);
        res.json({
            success: true,
            data: muscles,
            pagination: { page, limit, total }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSubMuscles = async (req, res) => {
    try {
        const muscleId = parseInt(req.params.muscleId);
        if (isNaN(muscleId)) return res.status(400).json({ success: false, message: 'Invalid muscle ID' });
        
        const { page, limit, skip } = getPagination(req);
        const [subMuscles, total] = await Promise.all([
            prisma.subMuscle.findMany({
                where: { muscleId },
                skip,
                take: limit
            }),
            prisma.subMuscle.count({ where: { muscleId } })
        ]);
        res.json({
            success: true,
            data: subMuscles,
            pagination: { page, limit, total }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getExercises = async (req, res) => {
    try {
        const subMuscleId = parseInt(req.params.subMuscleId);
        if (isNaN(subMuscleId)) return res.status(400).json({ success: false, message: 'Invalid subMuscle ID' });
        
        const { page, limit, skip } = getPagination(req);
        const [exercises, total] = await Promise.all([
            prisma.exercise.findMany({
                where: { subMuscleId },
                skip,
                take: limit
            }),
            prisma.exercise.count({ where: { subMuscleId } })
        ]);
        res.json({
            success: true,
            data: exercises,
            pagination: { page, limit, total }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Admin CRUD Categories ---
exports.createCategory = async (req, res) => {
    try {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name } = req.body;
        const category = await prisma.category.create({ data: { name } });
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name } = req.body;
        const category = await prisma.category.update({
            where: { id },
            data: { name }
        });
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Admin CRUD Muscles ---
exports.createMuscle = async (req, res) => {
    try {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name, categoryId } = req.body;
        const catId = parseInt(categoryId);
        if (isNaN(catId)) return res.status(400).json({ success: false, message: 'Invalid category ID' });
        
        const muscle = await prisma.muscle.create({ data: { name, categoryId: catId } });
        res.status(201).json({ success: true, data: muscle });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateMuscle = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name, categoryId } = req.body;
        const catId = parseInt(categoryId);
        if (isNaN(catId)) return res.status(400).json({ success: false, message: 'Invalid category ID' });
        
        const muscle = await prisma.muscle.update({
            where: { id },
            data: { name, categoryId: catId }
        });
        res.json({ success: true, data: muscle });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteMuscle = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.muscle.delete({ where: { id } });
        res.json({ success: true, message: 'Muscle deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Admin CRUD SubMuscles ---
exports.createSubMuscle = async (req, res) => {
    try {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name, muscleId } = req.body;
        const muscId = parseInt(muscleId);
        if (isNaN(muscId)) return res.status(400).json({ success: false, message: 'Invalid muscle ID' });
        
        const subMuscle = await prisma.subMuscle.create({ data: { name, muscleId: muscId } });
        res.status(201).json({ success: true, data: subMuscle });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateSubMuscle = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name, muscleId } = req.body;
        const muscId = parseInt(muscleId);
        if (isNaN(muscId)) return res.status(400).json({ success: false, message: 'Invalid muscle ID' });
        
        const subMuscle = await prisma.subMuscle.update({
            where: { id },
            data: { name, muscleId: muscId }
        });
        res.json({ success: true, data: subMuscle });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteSubMuscle = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.subMuscle.delete({ where: { id } });
        res.json({ success: true, message: 'SubMuscle deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Admin CRUD Exercises ---
exports.createExercise = async (req, res) => {
    try {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name, equipment, steps, subMuscleId, videoUrl } = req.body;
        const subId = parseInt(subMuscleId);
        if (isNaN(subId)) return res.status(400).json({ success: false, message: 'Invalid subMuscle ID' });
        
        const exercise = await prisma.exercise.create({
            data: {
                name,
                equipment,
                steps,
                subMuscleId: subId,
                videoUrl
            }
        });
        res.status(201).json({ success: true, data: exercise });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateExercise = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        const { name, equipment, steps, subMuscleId, videoUrl } = req.body;
        const subId = parseInt(subMuscleId);
        if (isNaN(subId)) return res.status(400).json({ success: false, message: 'Invalid subMuscle ID' });
        
        const exercise = await prisma.exercise.update({
            where: { id },
            data: {
                name,
                equipment,
                steps,
                subMuscleId: subId,
                videoUrl
            }
        });
        res.json({ success: true, data: exercise });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteExercise = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.exercise.delete({ where: { id } });
        res.json({ success: true, message: 'Exercise deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Favorites (Improved duplicate check) ---
exports.getFavorites = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req);
        const [favorites, total] = await Promise.all([
            prisma.favorite.findMany({
                where: { memberId: req.user.id },
                include: {
                    exercise: {
                        include: {
                            subMuscle: {
                                include: {
                                    muscle: true
                                }
                            }
                        }
                    }
                },
                skip,
                take: limit
            }),
            prisma.favorite.count({ where: { memberId: req.user.id } })
        ]);
        res.json({
            success: true,
            data: favorites,
            pagination: { page, limit, total }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addFavorite = async (req, res) => {
    try {
        const { exerciseId } = req.body;
        const exId = parseInt(exerciseId);
        if (isNaN(exId)) return res.status(400).json({ success: false, message: 'Invalid exercise ID' });
        
        const existing = await prisma.favorite.findFirst({
            where: {
                memberId: req.user.id,
                exerciseId: exId
            }
        });

        if (existing) {
            return res.status(409).json({ success: false, message: 'Already in favorites' });
        }

        const fav = await prisma.favorite.create({
            data: { memberId: req.user.id, exerciseId: exId },
            include: { exercise: true }
        });
        res.status(201).json({ success: true, data: fav });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.removeFavorite = async (req, res) => {
    try {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: result.array() });
        }

        await prisma.favorite.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: 'Removed from favorites' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Tracker ---
exports.logWorkout = async (req, res) => {
    try {
        const { exerciseId } = req.body;
        const exId = parseInt(exerciseId);
        if (isNaN(exId)) return res.status(400).json({ success: false, message: 'Invalid exercise ID' });
        
        const log = await prisma.workoutLog.create({
            data: { memberId: req.user.id, exerciseId: exId },
            include: { exercise: true }
        });
        res.status(201).json({ success: true, data: log });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTodayLogs = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const logs = await prisma.workoutLog.findMany({
            where: {
                memberId: req.user.id,
                date: { gte: start, lte: end }
            },
            include: { exercise: true }
        });
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
