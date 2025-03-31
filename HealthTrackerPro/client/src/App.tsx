import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import HealthMetrics from "@/pages/health-metrics";
import Medications from "@/pages/medications";
import Exercise from "@/pages/exercise";
import Nutrition from "@/pages/nutrition";
import Sleep from "@/pages/sleep";
import Goals from "@/pages/goals";
import Appointments from "@/pages/appointments";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import { useState, useEffect } from "react";
import { User } from "@shared/schema";

function Router() {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // For demo purposes, we'll auto-login as the sample user
    // In a real app, you would use a proper authentication flow
    (async () => {
      try {
        const response = await fetch("/api/user/1");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to auto-login:", error);
      }
    })();
  }, []);

  if (!user) {
    // Show loading or login page
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-primary-600">HealthSync</h1>
          <p className="mb-4 text-gray-600">Loading your health dashboard...</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full animate-pulse rounded-full bg-primary-500" style={{ width: "75%" }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard user={user} />} />
      <Route path="/metrics" component={() => <HealthMetrics user={user} />} />
      <Route path="/medications" component={() => <Medications user={user} />} />
      <Route path="/exercise" component={() => <Exercise user={user} />} />
      <Route path="/nutrition" component={() => <Nutrition user={user} />} />
      <Route path="/sleep" component={() => <Sleep user={user} />} />
      <Route path="/goals" component={() => <Goals user={user} />} />
      <Route path="/appointments" component={() => <Appointments user={user} />} />
      <Route path="/reports" component={() => <Reports user={user} />} />
      <Route path="/profile" component={() => <Profile user={user} />} />
      <Route path="/settings" component={() => <Settings user={user} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
