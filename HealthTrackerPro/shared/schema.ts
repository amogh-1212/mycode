import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  height: real("height"),
  targetWeight: real("target_weight"),
  targetSteps: integer("target_steps"),
  targetWaterIntake: real("target_water_intake"),
  targetSleep: real("target_sleep"),
  profilePicture: text("profile_picture"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Health metrics model
export const healthMetrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // weight, blood_pressure, heart_rate, sleep, steps, etc.
  value: text("value").notNull(), // Can store JSON strings for complex data like BP (systolic/diastolic)
  date: timestamp("date").notNull(),
  notes: text("notes"),
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({
  id: true,
});

// Medications model
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(), // daily, twice a day, etc.
  time: text("time").notNull(), // JSON string for multiple times
  instructions: text("instructions"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  active: boolean("active").notNull().default(true),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
});

// Medication logs model
export const medicationLogs = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull(),
  userId: integer("user_id").notNull(),
  taken: boolean("taken").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  takenTime: timestamp("taken_time"),
  notes: text("notes"),
});

export const insertMedicationLogSchema = createInsertSchema(medicationLogs).omit({
  id: true,
});

// Meals model
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // breakfast, lunch, dinner, snack
  calories: integer("calories"),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  foods: json("foods"), // Array of food items
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
});

// Appointments model
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  doctor: text("doctor"),
  location: text("location"),
  date: timestamp("date").notNull(),
  duration: integer("duration"), // in minutes
  status: text("status").notNull(), // scheduled, confirmed, completed, cancelled
  notes: text("notes"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
});

// Goals model
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(), // weight, exercise, water, etc.
  target: text("target").notNull(),
  currentValue: text("current_value").notNull(),
  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date"),
  completed: boolean("completed").notNull().default(false),
  progress: real("progress"), // percentage
  icon: text("icon"),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
});

// Exercise logs model
export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // running, cycling, swimming, etc.
  duration: integer("duration").notNull(), // in minutes
  distance: real("distance"), // in km
  calories: integer("calories"),
  date: timestamp("date").notNull(),
  notes: text("notes"),
});

export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type MedicationLog = typeof medicationLogs.$inferSelect;
export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
