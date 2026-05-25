const prisma = require('../utils/prisma.util');

exports.getAllWorkouts = async (req, res, next) => {
    try {
        const workouts = await prisma.workout.findMany({
            orderBy: { id: 'desc' }
        });
        res.status(200).json({ data: workouts });
    } catch (error) {
        next(error);
    }
};

exports.createWorkout = async (req, res, next) => {
    try {
        let thumbnailUrl = req.body.thumbnailUrl;
        if (req.file) {
            thumbnailUrl = `/uploads/${req.file.filename}`;
        }

        const workout = await prisma.workout.create({
            data: {
                name: req.body.name,
                category: req.body.category,
                description: req.body.description,
                sets: req.body.sets,
                reps: req.body.reps,
                restTime: req.body.restTime,
                difficulty: req.body.difficulty,
                videoUrl: req.body.videoUrl,
                thumbnailUrl: thumbnailUrl
            }
        });
        res.status(201).json({ data: workout });
    } catch (error) {
        next(error);
    }
};

exports.updateWorkout = async (req, res, next) => {
    try {
        const { id } = req.params;
        let updateData = {
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            sets: req.body.sets,
            reps: req.body.reps,
            restTime: req.body.restTime,
            difficulty: req.body.difficulty,
            videoUrl: req.body.videoUrl,
        };

        if (req.file) {
            updateData.thumbnailUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.thumbnailUrl !== undefined) {
            updateData.thumbnailUrl = req.body.thumbnailUrl;
        }

        const workout = await prisma.workout.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        res.status(200).json({ data: workout });
    } catch (error) {
        next(error);
    }
};

exports.deleteWorkout = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.workout.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).json({ message: 'Workout deleted successfully' });
    } catch (error) {
        next(error);
    }
};