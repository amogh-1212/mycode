import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Goal {
  id: number;
  title: string;
  category: string;
  currentValue: string;
  targetValue: string;
  progress: number;
  progressDescription: string;
  startDaysAgo: number;
  icon: string;
  color: string;
}

interface HealthGoalCardProps {
  goal: Goal;
  onUpdate: (id: number) => void;
}

export function HealthGoalCard({ goal, onUpdate }: HealthGoalCardProps) {
  // Get progress status color
  const getStatusColor = () => {
    if (goal.progressDescription.includes("Ahead")) return "text-success-500";
    if (goal.progressDescription.includes("On track")) return "text-success-500";
    if (goal.progressDescription.includes("behind")) return "text-yellow-500";
    return "text-gray-500";
  };
  
  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full bg-${goal.color}-100 flex items-center justify-center`}>
              <span className={`material-icons text-${goal.color}-600`}>{goal.icon}</span>
            </div>
            <h3 className="ml-3 font-medium">{goal.title}</h3>
          </div>
          <div className={`text-sm font-medium text-${goal.color}-600`}>{goal.progress}%</div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Current: {goal.currentValue}</span>
            <span>Target: {goal.targetValue}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`bg-${goal.color}-500 h-full rounded-full`} 
              style={{ width: `${goal.progress}%` }}
            ></div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center">
            <span className={`material-icons text-sm mr-1 ${getStatusColor()}`}>
              schedule
            </span>
            <span>{goal.progressDescription}</span>
          </div>
        </div>
      </CardContent>
      <div className="bg-gray-50 p-3 flex justify-between items-center">
        <span className="text-xs text-gray-500">Started: {goal.startDaysAgo} days ago</span>
        <button 
          className={`text-${goal.color}-600 hover:text-${goal.color}-800 text-sm`}
          onClick={() => onUpdate(goal.id)}
        >
          Update
        </button>
      </div>
    </Card>
  );
}

interface HealthGoalsProps {
  goals: Goal[];
  onAddGoal: () => void;
  onUpdateGoal: (id: number) => void;
}

export function HealthGoals({ goals, onAddGoal, onUpdateGoal }: HealthGoalsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {goals.map((goal) => (
          <HealthGoalCard 
            key={goal.id}
            goal={goal} 
            onUpdate={onUpdateGoal}
          />
        ))}
      </div>

      <div className="flex items-center justify-center">
        <button 
          className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-all"
          onClick={onAddGoal}
        >
          <span className="material-icons mr-2">add_circle</span>
          Add New Health Goal
        </button>
      </div>
    </>
  );
}
