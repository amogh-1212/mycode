import React, { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { WeightTrendChart } from "@/components/dashboard/weight-trend-chart";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { MedicationReminders } from "@/components/dashboard/medication-reminders";
import { NutritionTracking } from "@/components/dashboard/nutrition-tracking";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { HealthGoals } from "@/components/dashboard/health-goals";
import { LogHealthDialog } from "@/components/ui/dialog-log-health";
import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { parseJSONSafely } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [isHealthDialogOpen, setIsHealthDialogOpen] = useState(false);

  // Fetch health metrics
  const { data: healthMetrics, refetch: refetchHealthMetrics } = useQuery({
    queryKey: ["/api/health-metrics", user.id],
    queryFn: () => fetch(`/api/health-metrics/${user.id}`).then(res => res.json()),
  });

  // Fetch medications
  const { data: medications } = useQuery({
    queryKey: ["/api/medications", user.id],
    queryFn: () => fetch(`/api/medications/${user.id}?active=true`).then(res => res.json()),
  });

  // Fetch medication logs
  const { data: medicationLogs, refetch: refetchMedicationLogs } = useQuery({
    queryKey: ["/api/medication-logs", user.id],
    queryFn: () => fetch(`/api/medication-logs/${user.id}`).then(res => res.json()),
  });

  // Fetch meals
  const { data: meals } = useQuery({
    queryKey: ["/api/meals", user.id],
    queryFn: () => fetch(`/api/meals/${user.id}?date=${new Date().toISOString()}`).then(res => res.json()),
  });

  // Fetch appointments
  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments", user.id, "upcoming"],
    queryFn: () => fetch(`/api/appointments/${user.id}/upcoming`).then(res => res.json()),
  });

  // Fetch goals
  const { data: goals, refetch: refetchGoals } = useQuery({
    queryKey: ["/api/goals", user.id],
    queryFn: () => fetch(`/api/goals/${user.id}`).then(res => res.json()),
  });

  // Fetch exercise logs
  const { data: exerciseLogs } = useQuery({
    queryKey: ["/api/exercise-logs", user.id],
    queryFn: () => fetch(`/api/exercise-logs/${user.id}`).then(res => res.json()),
  });

  // Process health metrics data
  const getLatestMetric = (type: string) => {
    if (!healthMetrics) return null;
    return healthMetrics
      .filter((m: any) => m.type === type)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const getMetricsForChart = (type: string) => {
    if (!healthMetrics) return [];
    return healthMetrics
      .filter((m: any) => m.type === type)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m: any) => ({
        date: format(new Date(m.date), "MMM"),
        [type]: parseFloat(m.value)
      }));
  };

  const weightData = getMetricsForChart("weight");
  const latestWeight = getLatestMetric("weight");
  const latestBP = getLatestMetric("blood_pressure");
  const latestHR = getLatestMetric("heart_rate");
  const latestSleep = getLatestMetric("sleep");

  // Process exercise log data for activity chart
  const processExerciseData = () => {
    if (!exerciseLogs) return [];
    
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return exerciseLogs.slice(0, 7).map((log: any) => ({
      day: days[new Date(log.date).getDay()],
      steps: log.type === "walking" ? Math.floor(log.distance * 1250) : 0
    }));
  };

  const activityData = processExerciseData();

  // Process medication data
  const processMedications = () => {
    if (!medications || !medicationLogs) return [];
    
    return medications.map((med: any) => {
      const times = parseJSONSafely<string[]>(med.time, []);
      const time = times[0] || "00:00";
      
      // Find if there's a log for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const log = medicationLogs.find((l: any) => 
        l.medicationId === med.id && 
        new Date(l.scheduledTime) >= today
      );
      
      return {
        id: med.id,
        name: med.name,
        time: time,
        instructions: med.dosage + (med.instructions ? ` - ${med.instructions}` : ""),
        isUpcoming: !!log,
        taken: log ? log.taken : false
      };
    });
  };

  const medicationList = processMedications();

  // Process meals data
  const processMeals = () => {
    if (!meals) return [];
    
    const getIcon = (type: string) => {
      switch (type) {
        case "breakfast": return "breakfast_dining";
        case "lunch": return "lunch_dining";
        case "dinner": return "dinner_dining";
        default: return "restaurant";
      }
    };
    
    const getColor = (type: string) => {
      switch (type) {
        case "breakfast": return "text-amber-500";
        case "lunch": return "text-secondary-500";
        case "dinner": return "text-primary-500";
        default: return "text-gray-500";
      }
    };
    
    return meals.map((meal: any) => ({
      id: meal.id,
      type: meal.type.charAt(0).toUpperCase() + meal.type.slice(1),
      foods: meal.foods || [],
      calories: meal.calories,
      icon: getIcon(meal.type),
      color: getColor(meal.type)
    }));
  };

  const mealList = processMeals();

  // Process appointments data
  const processAppointments = () => {
    if (!appointments) return [];
    
    return appointments.slice(0, 2).map((apt: any) => ({
      id: apt.id,
      title: apt.title,
      doctor: apt.doctor,
      status: apt.status,
      date: new Date(apt.date),
      time: format(new Date(apt.date), "h:mm a") + " - " + 
            format(new Date(new Date(apt.date).getTime() + apt.duration * 60000), "h:mm a"),
      location: apt.location
    }));
  };

  const appointmentList = processAppointments();

  // Process goals data
  const processGoals = () => {
    if (!goals) return [];
    
    const getColor = (category: string) => {
      switch (category) {
        case "weight": return "primary";
        case "exercise": return "secondary";
        case "hydration": return "accent";
        default: return "gray";
      }
    };
    
    return goals.map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      category: goal.category,
      currentValue: goal.currentValue,
      targetValue: goal.target,
      progress: goal.progress,
      progressDescription: goal.progress >= 80 
        ? "Ahead of schedule" 
        : goal.progress >= 60 
          ? "On track" 
          : "Slightly behind",
      startDaysAgo: Math.floor((new Date().getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      icon: goal.icon || "flag",
      color: getColor(goal.category)
    }));
  };

  const goalList = processGoals();

  // Nutrition progress calculation
  const nutritionProgress = {
    calories: { current: 970, target: 2000, percentage: 48 },
    protein: { current: 30, target: 120, percentage: 25 },
    carbs: { current: 100, target: 250, percentage: 40 }
  };

  // Event handlers
  const handleLogHealthData = () => {
    setIsHealthDialogOpen(true);
  };

  const handleTakeMedication = async (id: number) => {
    // Find the medication log
    const log = medicationLogs?.find((l: any) => l.medicationId === id);
    if (log) {
      try {
        await fetch(`/api/medication-logs/${log.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taken: !log.taken, takenTime: new Date() })
        });
        refetchMedicationLogs();
      } catch (error) {
        console.error("Failed to update medication log:", error);
      }
    }
  };

  const handleAddGoal = () => {
    // Implementation for adding a new goal
    console.log("Add new goal");
  };

  const handleUpdateGoal = (id: number) => {
    // Implementation for updating a goal
    console.log("Update goal", id);
  };

  return (
    <Layout title="Dashboard" user={user}>
      {/* Welcome Card */}
      <WelcomeCard 
        user={user}
        onLogHealthData={handleLogHealthData}
      />

      {/* Health Metrics Row */}
      <h2 className="text-xl font-semibold mb-4">Health Metrics</h2>
      <MetricsGrid
        metrics={{
          weight: {
            title: "Weight",
            value: latestWeight ? parseFloat(latestWeight.value).toFixed(1) : "N/A",
            unit: "kg",
            trend: "down",
            trendValue: "2.5%",
            target: user.targetWeight ? `${user.targetWeight}kg` : "N/A",
            progress: 88,
            lastUpdated: latestWeight ? "Today" : "N/A",
            onAddClick: handleLogHealthData
          },
          bloodPressure: {
            title: "Blood Pressure",
            value: latestBP ? parseJSONSafely<{systolic: number, diastolic: number}>(latestBP.value, {systolic: 0, diastolic: 0}).systolic + "/" + parseJSONSafely<{systolic: number, diastolic: number}>(latestBP.value, {systolic: 0, diastolic: 0}).diastolic : "N/A",
            unit: "mmHg",
            trend: "flat",
            trendValue: "Stable",
            progress: 65,
            lastUpdated: latestBP ? "Yesterday" : "N/A",
            onAddClick: handleLogHealthData
          },
          heartRate: {
            title: "Heart Rate",
            value: latestHR ? latestHR.value : "N/A",
            unit: "bpm",
            trend: "up",
            trendValue: "5%",
            progress: 72,
            lastUpdated: latestHR ? "2h ago" : "N/A",
            onAddClick: handleLogHealthData
          },
          sleep: {
            title: "Sleep Quality",
            value: latestSleep ? latestSleep.value : "N/A",
            unit: "hrs",
            trend: "up",
            trendValue: "10%",
            progress: 85,
            lastUpdated: latestSleep ? "Today" : "N/A",
            onAddClick: handleLogHealthData
          }
        }}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 mt-6">
        <WeightTrendChart data={weightData.length ? weightData : [
          { date: "Jun", weight: 68.2 },
          { date: "Jul", weight: 67.5 },
          { date: "Aug", weight: 66.8 },
          { date: "Sep", weight: 66.2 },
          { date: "Oct", weight: 65.7 },
          { date: "Nov", weight: 65.4 },
          { date: "Dec", weight: 65.4 }
        ]} />
        
        <ActivityChart data={activityData.length ? activityData : [
          { day: "Mon", steps: 5200 },
          { day: "Tue", steps: 7500 },
          { day: "Wed", steps: 6800 },
          { day: "Thu", steps: 9200 },
          { day: "Fri", steps: 8400 },
          { day: "Sat", steps: 10500 },
          { day: "Sun", steps: 7800 }
        ]} />
      </div>

      {/* Health Reminders & Upcoming Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <MedicationReminders 
          medications={medicationList}
          onAddMedication={() => console.log("Add medication")}
          onTakeMedication={handleTakeMedication}
        />
        
        <NutritionTracking 
          progress={nutritionProgress}
          meals={mealList}
          onAddMeal={() => console.log("Add meal")}
        />
        
        <UpcomingAppointments 
          appointments={appointmentList}
          onAddAppointment={() => console.log("Add appointment")}
        />
      </div>

      {/* Health Goals Section */}
      <h2 className="text-xl font-semibold mb-4">Health Goals</h2>
      <HealthGoals 
        goals={goalList}
        onAddGoal={handleAddGoal}
        onUpdateGoal={handleUpdateGoal}
      />

      {/* Health Data Dialog */}
      <LogHealthDialog
        userId={user.id}
        isOpen={isHealthDialogOpen}
        onClose={() => setIsHealthDialogOpen(false)}
        onSuccess={() => {
          refetchHealthMetrics();
        }}
      />
    </Layout>
  );
}
