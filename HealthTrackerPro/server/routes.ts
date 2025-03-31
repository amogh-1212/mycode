import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertHealthMetricSchema,
  insertMedicationSchema,
  insertMedicationLogSchema,
  insertMealSchema,
  insertAppointmentSchema,
  insertGoalSchema,
  insertExerciseLogSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  const apiRouter = app.route("/api");

  // User routes
  app.get("/api/user/:id", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't send the password back
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // In a real app, you would use sessions/JWT here
      // For simplicity, we just return the user ID
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(result.data);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.put("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Partial user update
      const userData = req.body;
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Health metrics routes
  app.get("/api/health-metrics/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const type = req.query.type as string | undefined;
      const metrics = await storage.getHealthMetrics(userId, type);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching health metrics" });
    }
  });

  app.get("/api/health-metrics/:userId/range", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const type = req.query.type as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      if (!type || !startDate || !endDate) {
        return res.status(400).json({ message: "Type, startDate, and endDate are required" });
      }

      const metrics = await storage.getHealthMetricsByDateRange(userId, type, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching health metrics by date range" });
    }
  });

  app.get("/api/health-metrics/:userId/latest/:type", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const type = req.params.type;
      const metric = await storage.getLatestHealthMetric(userId, type);
      
      if (!metric) {
        return res.status(404).json({ message: "No metric found for the given type" });
      }
      
      res.json(metric);
    } catch (error) {
      res.status(500).json({ message: "Error fetching latest health metric" });
    }
  });

  app.post("/api/health-metrics", async (req: Request, res: Response) => {
    try {
      const result = insertHealthMetricSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid health metric data", errors: result.error.errors });
      }

      const metric = await storage.createHealthMetric(result.data);
      res.status(201).json(metric);
    } catch (error) {
      res.status(500).json({ message: "Error creating health metric" });
    }
  });

  // Medication routes
  app.get("/api/medications/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const active = req.query.active ? req.query.active === 'true' : undefined;
      const medications = await storage.getMedications(userId, active);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medications" });
    }
  });

  app.get("/api/medications/detail/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }

      const medication = await storage.getMedication(id);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      res.json(medication);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medication" });
    }
  });

  app.post("/api/medications", async (req: Request, res: Response) => {
    try {
      const result = insertMedicationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid medication data", errors: result.error.errors });
      }

      const medication = await storage.createMedication(result.data);
      res.status(201).json(medication);
    } catch (error) {
      res.status(500).json({ message: "Error creating medication" });
    }
  });

  app.put("/api/medications/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }

      const medicationData = req.body;
      const updatedMedication = await storage.updateMedication(id, medicationData);
      
      if (!updatedMedication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      res.json(updatedMedication);
    } catch (error) {
      res.status(500).json({ message: "Error updating medication" });
    }
  });

  app.delete("/api/medications/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }

      const deleted = await storage.deleteMedication(id);
      if (!deleted) {
        return res.status(404).json({ message: "Medication not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting medication" });
    }
  });

  // Medication logs routes
  app.get("/api/medication-logs/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const medicationId = req.query.medicationId ? parseInt(req.query.medicationId as string) : undefined;
      const logs = await storage.getMedicationLogs(userId, medicationId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medication logs" });
    }
  });

  app.post("/api/medication-logs", async (req: Request, res: Response) => {
    try {
      const result = insertMedicationLogSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid medication log data", errors: result.error.errors });
      }

      const log = await storage.createMedicationLog(result.data);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Error creating medication log" });
    }
  });

  app.put("/api/medication-logs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }

      const { taken } = req.body;
      const takenTime = req.body.takenTime ? new Date(req.body.takenTime) : undefined;
      
      const updatedLog = await storage.updateMedicationLog(id, taken, takenTime);
      if (!updatedLog) {
        return res.status(404).json({ message: "Medication log not found" });
      }

      res.json(updatedLog);
    } catch (error) {
      res.status(500).json({ message: "Error updating medication log" });
    }
  });

  // Meal routes
  app.get("/api/meals/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const meals = await storage.getMeals(userId, date);
      res.json(meals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching meals" });
    }
  });

  app.get("/api/meals/detail/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const meal = await storage.getMeal(id);
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json(meal);
    } catch (error) {
      res.status(500).json({ message: "Error fetching meal" });
    }
  });

  app.post("/api/meals", async (req: Request, res: Response) => {
    try {
      const result = insertMealSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid meal data", errors: result.error.errors });
      }

      const meal = await storage.createMeal(result.data);
      res.status(201).json(meal);
    } catch (error) {
      res.status(500).json({ message: "Error creating meal" });
    }
  });

  app.put("/api/meals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const mealData = req.body;
      const updatedMeal = await storage.updateMeal(id, mealData);
      
      if (!updatedMeal) {
        return res.status(404).json({ message: "Meal not found" });
      }

      res.json(updatedMeal);
    } catch (error) {
      res.status(500).json({ message: "Error updating meal" });
    }
  });

  app.delete("/api/meals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const deleted = await storage.deleteMeal(id);
      if (!deleted) {
        return res.status(404).json({ message: "Meal not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting meal" });
    }
  });

  // Appointment routes
  app.get("/api/appointments/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const appointments = await storage.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments" });
    }
  });

  app.get("/api/appointments/:userId/upcoming", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const appointments = await storage.getUpcomingAppointments(userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching upcoming appointments" });
    }
  });

  app.get("/api/appointments/detail/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointment" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      const result = insertAppointmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid appointment data", errors: result.error.errors });
      }

      const appointment = await storage.createAppointment(result.data);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Error creating appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }

      const appointmentData = req.body;
      const updatedAppointment = await storage.updateAppointment(id, appointmentData);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Error updating appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }

      const deleted = await storage.deleteAppointment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting appointment" });
    }
  });

  // Goal routes
  app.get("/api/goals/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching goals" });
    }
  });

  app.get("/api/goals/detail/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }

      const goal = await storage.getGoal(id);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Error fetching goal" });
    }
  });

  app.post("/api/goals", async (req: Request, res: Response) => {
    try {
      const result = insertGoalSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid goal data", errors: result.error.errors });
      }

      const goal = await storage.createGoal(result.data);
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ message: "Error creating goal" });
    }
  });

  app.put("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }

      const goalData = req.body;
      const updatedGoal = await storage.updateGoal(id, goalData);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Error updating goal" });
    }
  });

  app.delete("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }

      const deleted = await storage.deleteGoal(id);
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting goal" });
    }
  });

  // Exercise log routes
  app.get("/api/exercise-logs/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const logs = await storage.getExerciseLogs(userId, startDate, endDate);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exercise logs" });
    }
  });

  app.get("/api/exercise-logs/detail/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid exercise log ID" });
      }

      const log = await storage.getExerciseLog(id);
      if (!log) {
        return res.status(404).json({ message: "Exercise log not found" });
      }
      
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exercise log" });
    }
  });

  app.post("/api/exercise-logs", async (req: Request, res: Response) => {
    try {
      const result = insertExerciseLogSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid exercise log data", errors: result.error.errors });
      }

      const log = await storage.createExerciseLog(result.data);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Error creating exercise log" });
    }
  });

  app.put("/api/exercise-logs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid exercise log ID" });
      }

      const logData = req.body;
      const updatedLog = await storage.updateExerciseLog(id, logData);
      
      if (!updatedLog) {
        return res.status(404).json({ message: "Exercise log not found" });
      }

      res.json(updatedLog);
    } catch (error) {
      res.status(500).json({ message: "Error updating exercise log" });
    }
  });

  app.delete("/api/exercise-logs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid exercise log ID" });
      }

      const deleted = await storage.deleteExerciseLog(id);
      if (!deleted) {
        return res.status(404).json({ message: "Exercise log not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting exercise log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
