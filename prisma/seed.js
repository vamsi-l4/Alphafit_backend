const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.workoutLog.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.subMuscle.deleteMany();
  await prisma.muscle.deleteMany();
  await prisma.category.deleteMany();

  // Categories
  const cardio = await prisma.category.create({
    data: { name: 'Cardio' }
  });

  const strength = await prisma.category.create({
    data: { name: 'Strength' }
  });

  // Muscles
  const chest = await prisma.muscle.create({
    data: { name: 'Chest', categoryId: strength.id }
  });

  const back = await prisma.muscle.create({
    data: { name: 'Back', categoryId: strength.id }
  });

  const treadmill = await prisma.muscle.create({
    data: { name: 'Treadmill', categoryId: cardio.id }
  });

  // SubMuscles
  const upperChest = await prisma.subMuscle.create({
    data: { name: 'Upper Chest', muscleId: chest.id }
  });

  const lowerBack = await prisma.subMuscle.create({
    data: { name: 'Lower Back', muscleId: back.id }
  });

  const steadyState = await prisma.subMuscle.create({
    data: { name: 'Steady State', muscleId: treadmill.id }
  });

  // Exercises
  await prisma.exercise.create({
    data: {
      name: 'Bench Press',
      equipment: 'Barbell, Bench',
      steps: '1. Lie on bench\n2. Grip bar\n3. Lower to chest\n4. Press up',
      videoUrl: 'https://example.com/bench.mp4',
      subMuscleId: upperChest.id
    }
  });

  await prisma.exercise.create({
    data: {
      name: 'Deadlift',
      equipment: 'Barbell',
      steps: '1. Feet hip width\n2. Grip bar\n3. Lift with back straight\n4. Lower controlled',
      videoUrl: 'https://example.com/deadlift.mp4',
      subMuscleId: lowerBack.id
    }
  });

  await prisma.exercise.create({
    data: {
      name: 'Treadmill Run',
      equipment: 'Treadmill',
      steps: '1. Set speed\n2. Maintain posture\n3. Steady pace',
      videoUrl: 'https://example.com/treadmill.mp4',
      subMuscleId: steadyState.id
    }
  });

  console.log('✅ Seed data created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
