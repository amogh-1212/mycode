import React from "react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { User } from "@shared/schema";
import { HealthMetric, Goal } from "@shared/schema";

interface WelcomeCardProps {
  user: User;
  todayGoal?: Goal;
  waterIntake?: { current: number; target: number };
  nextMedication?: { name: string; timeRemaining: string };
  healthScore?: number;
  onLogHealthData: () => void;
}

export function WelcomeCard({
  user,
  todayGoal = { title: "Steps", currentValue: "0", target: "8000" },
  waterIntake = { current: 1.5, target: 2.5 },
  nextMedication = { name: "Vitamin D", timeRemaining: "1h" },
  healthScore = 75,
  onLogHealthData
}: WelcomeCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
      <div className="flex flex-wrap">
        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Hi, {user.firstName}</h1>
          <p className="text-gray-600 mt-1">Here's your health overview for today</p>

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="material-icons text-primary-600">check_circle</span>
              </div>
              <div className="ml-3">
                <span className="text-sm text-gray-500">Today's Goal</span>
                <p className="font-medium">{todayGoal.target} {todayGoal.title.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                <span className="material-icons text-secondary-600">water_drop</span>
              </div>
              <div className="ml-3">
                <span className="text-sm text-gray-500">Hydration</span>
                <p className="font-medium">{waterIntake.current}L / {waterIntake.target}L</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-icons text-amber-600">medication</span>
              </div>
              <div className="ml-3">
                <span className="text-sm text-gray-500">Next Medication</span>
                <p className="font-medium">{nextMedication.name} in {nextMedication.timeRemaining}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Button
              onClick={onLogHealthData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all inline-flex items-center"
            >
              <span className="material-icons mr-1 text-sm">add</span>
              Log Health Data
            </Button>
          </div>
        </div>
        <div className="hidden md:block p-4 w-64">
          <div className="relative h-full">
            <div className="flex items-center justify-center h-full">
              <ProgressRing 
                progress={healthScore} 
                foreground="hsl(199 89% 48%)"
                label={
                  <>
                    <span className="text-3xl font-bold text-gray-800">{healthScore}%</span>
                    <span className="text-sm text-gray-500">Overall Health</span>
                  </>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
