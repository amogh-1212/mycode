import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";

interface NutritionProgress {
  calories: { current: number; target: number; percentage: number };
  protein: { current: number; target: number; percentage: number };
  carbs: { current: number; target: number; percentage: number };
}

interface Meal {
  id: number;
  type: string;
  foods: string[];
  calories: number;
  icon: string;
  color: string;
}

interface NutritionTrackingProps {
  progress: NutritionProgress;
  meals: Meal[];
  onAddMeal: () => void;
}

export function NutritionTracking({ progress, meals, onAddMeal }: NutritionTrackingProps) {
  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-semibold">Today's Nutrition</CardTitle>
          <button 
            className="text-primary-600 hover:text-primary-800"
            onClick={onAddMeal}
          >
            <span className="material-icons text-sm">add_circle</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <div className="relative inline-flex">
              <svg className="w-16 h-16">
                <circle className="text-gray-200" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="32" cy="32"/>
                <circle 
                  className="text-primary-500" 
                  strokeWidth="5" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="30" 
                  cx="32" 
                  cy="32"
                  strokeDasharray="188.5" 
                  strokeDashoffset={188.5 - (188.5 * progress.calories.percentage / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                {progress.calories.percentage}%
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-500">Calories</p>
            <p className="text-sm font-medium">{progress.calories.current}/{progress.calories.target}</p>
          </div>
          
          <div className="text-center">
            <div className="relative inline-flex">
              <svg className="w-16 h-16">
                <circle className="text-gray-200" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="32" cy="32"/>
                <circle 
                  className="text-secondary-500" 
                  strokeWidth="5" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="30" 
                  cx="32" 
                  cy="32"
                  strokeDasharray="188.5" 
                  strokeDashoffset={188.5 - (188.5 * progress.protein.percentage / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                {progress.protein.percentage}%
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-500">Protein</p>
            <p className="text-sm font-medium">{progress.protein.current}/{progress.protein.target}g</p>
          </div>
          
          <div className="text-center">
            <div className="relative inline-flex">
              <svg className="w-16 h-16">
                <circle className="text-gray-200" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="32" cy="32"/>
                <circle 
                  className="text-amber-500" 
                  strokeWidth="5" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="30" 
                  cx="32" 
                  cy="32"
                  strokeDasharray="188.5" 
                  strokeDashoffset={188.5 - (188.5 * progress.carbs.percentage / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                {progress.carbs.percentage}%
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-500">Carbs</p>
            <p className="text-sm font-medium">{progress.carbs.current}/{progress.carbs.target}g</p>
          </div>
        </div>
        
        <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Meals</h4>
        <div className="space-y-2">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center p-2 rounded-lg border border-gray-100">
              <span className={`material-icons ${meal.color} mr-3`}>{meal.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{meal.type}</p>
                <p className="text-xs text-gray-500">{meal.foods.join(", ")}</p>
              </div>
              <span className="text-sm text-gray-500">{meal.calories} kcal</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-3 text-center">
        <Link href="/nutrition" className="text-primary-600 text-sm font-medium hover:text-primary-800 w-full">
          View Meal Plan
        </Link>
      </CardFooter>
    </Card>
  );
}
