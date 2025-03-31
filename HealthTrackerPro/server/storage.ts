import { 
  User, InsertUser, 
  HealthMetric, InsertHealthMetric,
  Medication, InsertMedication,
  MedicationLog, InsertMedicationLog,
  Meal, InsertMeal,
  Appointment, InsertAppointment,
  Goal, InsertGoal,
  ExerciseLog, InsertExerciseLog
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Health metrics operations
  getHealthMetrics(userId: number, type?: string): Promise<HealthMetric[]>;
  getHealthMetricsByDateRange(userId: number, type: string, startDate: Date, endDate: Date): Promise<HealthMetric[]>;
  getLatestHealthMetric(userId: number, type: string): Promise<HealthMetric | undefined>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  
  // Medication operations
  getMedications(userId: number, active?: boolean): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medicationData: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<boolean>;
  
  // Medication logs operations
  getMedicationLogs(userId: number, medicationId?: number): Promise<MedicationLog[]>;
  createMedicationLog(log: InsertMedicationLog): Promise<MedicationLog>;
  updateMedicationLog(id: number, taken: boolean, takenTime?: Date): Promise<MedicationLog | undefined>;
  
  // Meal operations
  getMeals(userId: number, date?: Date): Promise<Meal[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, mealData: Partial<InsertMeal>): Promise<Meal | undefined>;
  deleteMeal(id: number): Promise<boolean>;
  
  // Appointment operations
  getAppointments(userId: number): Promise<Appointment[]>;
  getUpcomingAppointments(userId: number): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goalData: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Exercise logs operations
  getExerciseLogs(userId: number, startDate?: Date, endDate?: Date): Promise<ExerciseLog[]>;
  getExerciseLog(id: number): Promise<ExerciseLog | undefined>;
  createExerciseLog(log: InsertExerciseLog): Promise<ExerciseLog>;
  updateExerciseLog(id: number, logData: Partial<InsertExerciseLog>): Promise<ExerciseLog | undefined>;
  deleteExerciseLog(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private healthMetrics: Map<number, HealthMetric>;
  private medications: Map<number, Medication>;
  private medicationLogs: Map<number, MedicationLog>;
  private meals: Map<number, Meal>;
  private appointments: Map<number, Appointment>;
  private goals: Map<number, Goal>;
  private exerciseLogs: Map<number, ExerciseLog>;
  
  private userId: number;
  private healthMetricId: number;
  private medicationId: number;
  private medicationLogId: number;
  private mealId: number;
  private appointmentId: number;
  private goalId: number;
  private exerciseLogId: number;
  
  constructor() {
    this.users = new Map();
    this.healthMetrics = new Map();
    this.medications = new Map();
    this.medicationLogs = new Map();
    this.meals = new Map();
    this.appointments = new Map();
    this.goals = new Map();
    this.exerciseLogs = new Map();
    
    this.userId = 1;
    this.healthMetricId = 1;
    this.medicationId = 1;
    this.medicationLogId = 1;
    this.mealId = 1;
    this.appointmentId = 1;
    this.goalId = 1;
    this.exerciseLogId = 1;
    
    // Add sample data for development
    this.seedData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Health metrics operations
  async getHealthMetrics(userId: number, type?: string): Promise<HealthMetric[]> {
    const metrics = Array.from(this.healthMetrics.values())
      .filter(metric => metric.userId === userId);
    
    if (type) {
      return metrics.filter(metric => metric.type === type);
    }
    
    return metrics;
  }
  
  async getHealthMetricsByDateRange(userId: number, type: string, startDate: Date, endDate: Date): Promise<HealthMetric[]> {
    return Array.from(this.healthMetrics.values())
      .filter(metric => 
        metric.userId === userId &&
        metric.type === type &&
        new Date(metric.date) >= startDate &&
        new Date(metric.date) <= endDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getLatestHealthMetric(userId: number, type: string): Promise<HealthMetric | undefined> {
    const metrics = await this.getHealthMetrics(userId, type);
    if (metrics.length === 0) return undefined;
    
    return metrics.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
  }
  
  async createHealthMetric(metricData: InsertHealthMetric): Promise<HealthMetric> {
    const id = this.healthMetricId++;
    const metric: HealthMetric = { ...metricData, id };
    this.healthMetrics.set(id, metric);
    return metric;
  }
  
  // Medication operations
  async getMedications(userId: number, active?: boolean): Promise<Medication[]> {
    const medications = Array.from(this.medications.values())
      .filter(med => med.userId === userId);
    
    if (active !== undefined) {
      return medications.filter(med => med.active === active);
    }
    
    return medications;
  }
  
  async getMedication(id: number): Promise<Medication | undefined> {
    return this.medications.get(id);
  }
  
  async createMedication(medicationData: InsertMedication): Promise<Medication> {
    const id = this.medicationId++;
    const medication: Medication = { ...medicationData, id };
    this.medications.set(id, medication);
    return medication;
  }
  
  async updateMedication(id: number, medicationData: Partial<InsertMedication>): Promise<Medication | undefined> {
    const medication = await this.getMedication(id);
    if (!medication) return undefined;
    
    const updatedMedication = { ...medication, ...medicationData };
    this.medications.set(id, updatedMedication);
    return updatedMedication;
  }
  
  async deleteMedication(id: number): Promise<boolean> {
    return this.medications.delete(id);
  }
  
  // Medication logs operations
  async getMedicationLogs(userId: number, medicationId?: number): Promise<MedicationLog[]> {
    let logs = Array.from(this.medicationLogs.values())
      .filter(log => log.userId === userId);
    
    if (medicationId !== undefined) {
      logs = logs.filter(log => log.medicationId === medicationId);
    }
    
    return logs.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }
  
  async createMedicationLog(logData: InsertMedicationLog): Promise<MedicationLog> {
    const id = this.medicationLogId++;
    const log: MedicationLog = { ...logData, id };
    this.medicationLogs.set(id, log);
    return log;
  }
  
  async updateMedicationLog(id: number, taken: boolean, takenTime?: Date): Promise<MedicationLog | undefined> {
    const log = this.medicationLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog: MedicationLog = {
      ...log,
      taken,
      takenTime: takenTime || (taken ? new Date() : undefined)
    };
    
    this.medicationLogs.set(id, updatedLog);
    return updatedLog;
  }
  
  // Meal operations
  async getMeals(userId: number, date?: Date): Promise<Meal[]> {
    let meals = Array.from(this.meals.values())
      .filter(meal => meal.userId === userId);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      meals = meals.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= startOfDay && mealDate <= endOfDay;
      });
    }
    
    return meals;
  }
  
  async getMeal(id: number): Promise<Meal | undefined> {
    return this.meals.get(id);
  }
  
  async createMeal(mealData: InsertMeal): Promise<Meal> {
    const id = this.mealId++;
    const meal: Meal = { ...mealData, id };
    this.meals.set(id, meal);
    return meal;
  }
  
  async updateMeal(id: number, mealData: Partial<InsertMeal>): Promise<Meal | undefined> {
    const meal = await this.getMeal(id);
    if (!meal) return undefined;
    
    const updatedMeal = { ...meal, ...mealData };
    this.meals.set(id, updatedMeal);
    return updatedMeal;
  }
  
  async deleteMeal(id: number): Promise<boolean> {
    return this.meals.delete(id);
  }
  
  // Appointment operations
  async getAppointments(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(apt => apt.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getUpcomingAppointments(userId: number): Promise<Appointment[]> {
    const now = new Date();
    return Array.from(this.appointments.values())
      .filter(apt => apt.userId === userId && new Date(apt.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentId++;
    const appointment: Appointment = { ...appointmentData, id };
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = await this.getAppointment(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
  
  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId);
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async createGoal(goalData: InsertGoal): Promise<Goal> {
    const id = this.goalId++;
    const goal: Goal = { ...goalData, id };
    this.goals.set(id, goal);
    return goal;
  }
  
  async updateGoal(id: number, goalData: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goal = await this.getGoal(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...goalData };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }
  
  // Exercise logs operations
  async getExerciseLogs(userId: number, startDate?: Date, endDate?: Date): Promise<ExerciseLog[]> {
    let logs = Array.from(this.exerciseLogs.values())
      .filter(log => log.userId === userId);
    
    if (startDate && endDate) {
      logs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      });
    }
    
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getExerciseLog(id: number): Promise<ExerciseLog | undefined> {
    return this.exerciseLogs.get(id);
  }
  
  async createExerciseLog(logData: InsertExerciseLog): Promise<ExerciseLog> {
    const id = this.exerciseLogId++;
    const log: ExerciseLog = { ...logData, id };
    this.exerciseLogs.set(id, log);
    return log;
  }
  
  async updateExerciseLog(id: number, logData: Partial<InsertExerciseLog>): Promise<ExerciseLog | undefined> {
    const log = await this.getExerciseLog(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...logData };
    this.exerciseLogs.set(id, updatedLog);
    return updatedLog;
  }
  
  async deleteExerciseLog(id: number): Promise<boolean> {
    return this.exerciseLogs.delete(id);
  }
  
  // Seed initial data
  private seedData() {
    // Create a sample user
    const user: User = {
      id: this.userId++,
      username: "sarah",
      password: "password123",
      firstName: "Sarah",
      lastName: "Connor",
      email: "sarah@example.com",
      dateOfBirth: new Date(1985, 5, 15),
      gender: "female",
      height: 170,
      targetWeight: 60,
      targetSteps: 8000,
      targetWaterIntake: 2.5,
      targetSleep: 8,
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&q=80",
    };
    this.users.set(user.id, user);
    
    // Add health metrics
    const now = new Date();
    
    // Weight metrics (last 7 months)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      
      // Start with 68.2 kg and go down to 65.4
      const weight = 68.2 - (2.8 / 6) * (6 - i);
      
      this.healthMetrics.set(this.healthMetricId++, {
        id: this.healthMetricId,
        userId: user.id,
        type: "weight",
        value: weight.toFixed(1),
        date,
        notes: "Regular weigh-in"
      });
    }
    
    // Blood pressure (yesterday)
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    this.healthMetrics.set(this.healthMetricId++, {
      id: this.healthMetricId,
      userId: user.id,
      type: "blood_pressure",
      value: JSON.stringify({ systolic: 120, diastolic: 80 }),
      date: yesterday,
      notes: "Normal reading"
    });
    
    // Heart rate (2 hours ago)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(now.getHours() - 2);
    this.healthMetrics.set(this.healthMetricId++, {
      id: this.healthMetricId,
      userId: user.id,
      type: "heart_rate",
      value: "72",
      date: twoHoursAgo,
      notes: "Resting heart rate"
    });
    
    // Sleep (today)
    this.healthMetrics.set(this.healthMetricId++, {
      id: this.healthMetricId,
      userId: user.id,
      type: "sleep",
      value: "7.5",
      date: now,
      notes: "Good quality sleep"
    });
    
    // Add medications
    const vitamindD: Medication = {
      id: this.medicationId++,
      userId: user.id,
      name: "Vitamin D",
      dosage: "1 pill",
      frequency: "daily",
      time: JSON.stringify(["08:00"]),
      instructions: "Take with breakfast",
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      active: true,
    };
    this.medications.set(vitamindD.id, vitamindD);
    
    const omega3: Medication = {
      id: this.medicationId++,
      userId: user.id,
      name: "Omega-3",
      dosage: "2 capsules",
      frequency: "daily",
      time: JSON.stringify(["12:00"]),
      instructions: "Take with lunch",
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      active: true,
    };
    this.medications.set(omega3.id, omega3);
    
    const multivitamin: Medication = {
      id: this.medicationId++,
      userId: user.id,
      name: "Multivitamin",
      dosage: "1 tablet",
      frequency: "daily",
      time: JSON.stringify(["18:00"]),
      instructions: "Take with dinner",
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      active: true,
    };
    this.medications.set(multivitamin.id, multivitamin);
    
    // Add medication logs
    // Today's medication reminder for Vitamin D
    this.medicationLogs.set(this.medicationLogId++, {
      id: this.medicationLogId,
      medicationId: vitamindD.id,
      userId: user.id,
      taken: false,
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
      notes: ""
    });
    
    // Today's medication reminder for Omega-3
    this.medicationLogs.set(this.medicationLogId++, {
      id: this.medicationLogId,
      medicationId: omega3.id,
      userId: user.id,
      taken: false,
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
      notes: ""
    });
    
    // Today's medication reminder for Multivitamin
    this.medicationLogs.set(this.medicationLogId++, {
      id: this.medicationLogId,
      medicationId: multivitamin.id,
      userId: user.id,
      taken: false,
      scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
      notes: ""
    });
    
    // Add meals for today
    const breakfast: Meal = {
      id: this.mealId++,
      userId: user.id,
      name: "Breakfast",
      type: "breakfast",
      calories: 420,
      protein: 15,
      carbs: 60,
      fat: 12,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30),
      notes: "",
      foods: ["Oatmeal", "Banana", "Almond Milk"]
    };
    this.meals.set(breakfast.id, breakfast);
    
    const lunch: Meal = {
      id: this.mealId++,
      userId: user.id,
      name: "Lunch",
      type: "lunch",
      calories: 550,
      protein: 35,
      carbs: 30,
      fat: 25,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30),
      notes: "",
      foods: ["Grilled Chicken Salad"]
    };
    this.meals.set(lunch.id, lunch);
    
    // Add appointments
    const annualPhysical: Appointment = {
      id: this.appointmentId++,
      userId: user.id,
      title: "Annual Physical",
      doctor: "Dr. Jennifer Wilson",
      location: "HealthCare Medical Center",
      date: new Date(2023, 8, 15, 10, 0), // September 15, 2023 at 10:00 AM
      duration: 60, // 1 hour
      status: "confirmed",
      notes: ""
    };
    this.appointments.set(annualPhysical.id, annualPhysical);
    
    const dentalCheckup: Appointment = {
      id: this.appointmentId++,
      userId: user.id,
      title: "Dental Checkup",
      doctor: "Dr. Robert Smith",
      location: "Bright Smile Dental Clinic",
      date: new Date(2023, 9, 3, 14, 30), // October 3, 2023 at 2:30 PM
      duration: 60, // 1 hour
      status: "scheduled",
      notes: ""
    };
    this.appointments.set(dentalCheckup.id, dentalCheckup);
    
    // Add goals
    const weightLossGoal: Goal = {
      id: this.goalId++,
      userId: user.id,
      title: "Weight Loss",
      category: "weight",
      target: "60",
      currentValue: "65.4",
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      targetDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      completed: false,
      progress: 65,
      icon: "monitor_weight"
    };
    this.goals.set(weightLossGoal.id, weightLossGoal);
    
    const runningGoal: Goal = {
      id: this.goalId++,
      userId: user.id,
      title: "Running",
      category: "exercise",
      target: "5",
      currentValue: "4",
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      targetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      completed: false,
      progress: 80,
      icon: "directions_run"
    };
    this.goals.set(runningGoal.id, runningGoal);
    
    const waterGoal: Goal = {
      id: this.goalId++,
      userId: user.id,
      title: "Water Intake",
      category: "hydration",
      target: "2.5",
      currentValue: "1.5",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
      targetDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() - 15),
      completed: false,
      progress: 60,
      icon: "water_drop"
    };
    this.goals.set(waterGoal.id, waterGoal);
    
    // Add exercise logs for the week
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const stepData = [5200, 7500, 6800, 9200, 8400, 10500, 7800];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (date.getDay() - i - 1));
      
      this.exerciseLogs.set(this.exerciseLogId++, {
        id: this.exerciseLogId,
        userId: user.id,
        type: "walking",
        duration: 40 + Math.floor(Math.random() * 30), // 40-70 minutes
        distance: stepData[i] / 1250, // approximate km based on steps
        calories: Math.floor(stepData[i] / 20), // approximate calories
        date,
        notes: `Daily steps on ${days[i]}`
      });
    }
  }
}

export const storage = new MemStorage();
