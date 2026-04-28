/**
 * Seed script — populates the database with sample test data.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Workout = require('./models/Workout');
const Diet = require('./models/Diet');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Workout.deleteMany({});
    await Diet.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create sample user
    const user = await User.create({
      name: 'Alex Johnson',
      email: 'alex@fitlife.com',
      password: 'password123',
      goals: {
        dailyCalories: 2200,
        dailyProtein: 160,
        weeklyWorkouts: 5,
        targetWeight: 80,
      },
      streak: {
        current: 7,
        longest: 14,
        lastActivityDate: new Date(),
      },
      analyticsScore: 78,
    });
    console.log('👤 Created sample user: alex@fitlife.com / password123');

    // Create sample workouts (last 14 days)
    const exercises = [
      { exercise: 'Bench Press', sets: 4, reps: 8, weight: 80 },
      { exercise: 'Squat', sets: 4, reps: 6, weight: 120 },
      { exercise: 'Deadlift', sets: 3, reps: 5, weight: 140 },
      { exercise: 'Overhead Press', sets: 4, reps: 8, weight: 50 },
      { exercise: 'Barbell Row', sets: 4, reps: 8, weight: 70 },
      { exercise: 'Pull-ups', sets: 3, reps: 10, weight: 0 },
      { exercise: 'Lunges', sets: 3, reps: 12, weight: 40 },
      { exercise: 'Dumbbell Curl', sets: 3, reps: 12, weight: 15 },
      { exercise: 'Tricep Dips', sets: 3, reps: 12, weight: 0 },
      { exercise: 'Leg Press', sets: 4, reps: 10, weight: 180 },
    ];

    const workouts = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // 1-2 exercises per day
      const numExercises = Math.random() > 0.3 ? 2 : 1;
      for (let j = 0; j < numExercises; j++) {
        const ex = exercises[Math.floor(Math.random() * exercises.length)];
        workouts.push({
          user: user._id,
          exercise: ex.exercise,
          sets: ex.sets,
          reps: ex.reps,
          weight: Math.max(0, ex.weight + Math.floor(Math.random() * 10) - 5), // slight variation, never negative
          date,
          notes: i === 0 ? 'Felt strong today!' : undefined,
        });
      }
    }
    await Workout.insertMany(workouts);
    console.log(`🏋️  Created ${workouts.length} sample workouts`);

    // Create sample diet entries (last 7 days)
    const meals = [
      { meal: 'Oatmeal with Berries', calories: 380, protein: 12, carbs: 60, fats: 8 },
      { meal: 'Grilled Chicken Salad', calories: 450, protein: 40, carbs: 20, fats: 18 },
      { meal: 'Protein Shake', calories: 250, protein: 30, carbs: 15, fats: 5 },
      { meal: 'Salmon with Rice', calories: 620, protein: 45, carbs: 50, fats: 22 },
      { meal: 'Greek Yogurt with Nuts', calories: 320, protein: 22, carbs: 25, fats: 14 },
      { meal: 'Turkey Sandwich', calories: 480, protein: 35, carbs: 45, fats: 12 },
      { meal: 'Steak and Vegetables', calories: 550, protein: 48, carbs: 15, fats: 28 },
      { meal: 'Pasta with Meat Sauce', calories: 680, protein: 32, carbs: 75, fats: 20 },
      { meal: 'Egg Whites & Toast', calories: 300, protein: 28, carbs: 30, fats: 6 },
      { meal: 'Banana & Peanut Butter', calories: 350, protein: 10, carbs: 40, fats: 18 },
    ];

    const dietEntries = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // 3-4 meals per day
      const numMeals = 3 + Math.floor(Math.random() * 2);
      for (let j = 0; j < numMeals; j++) {
        const m = meals[Math.floor(Math.random() * meals.length)];
        dietEntries.push({
          user: user._id,
          meal: m.meal,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fats: m.fats,
          date,
        });
      }
    }
    await Diet.insertMany(dietEntries);
    console.log(`🍽️  Created ${dietEntries.length} sample diet entries`);

    console.log('\n✅ Seed completed successfully!');
    console.log('📋 Login credentials: alex@fitlife.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();
