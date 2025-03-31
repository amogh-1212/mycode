import React, { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { User } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, isToday } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from "recharts";

interface NutritionProps {
  user: User;
}

const mealSchema = z.object({
  userId: z.number(),
  name: z.string().min(1, "Meal name is required"),
  type: z.string().min(1, "Meal type is required"),
  calories: z.number().min(0, "Calories must be a positive number"),
  protein: z.number().min(0, "Protein must be a positive number"),
  carbs: z.number().min(0, "Carbs must be a positive number"),
  fat: z.number().min(0, "Fat must be a positive number"),
  date: z.date(),
  notes: z.string().optional(),
  foods: z.array(z.string()).min(1, "At least one food item is required"),
});

type MealFormValues = z.infer<typeof mealSchema>;

export default function Nutrition({ user }: NutritionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [foodItems, setFoodItems] = useState<string[]>([]);
  const [newFoodItem, setNewFoodItem] = useState("");
  
  // Fetch meals
  const { data: meals, isLoading } = useQuery({
    queryKey: ["/api/meals", user.id],
    queryFn: () => fetch(`/api/meals/${user.id}`).then(res => res.json()),
  });

  const defaultValues: MealFormValues = {
    userId: user.id,
    name: "",
    type: "breakfast",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    date: new Date(),
    notes: "",
    foods: [],
  };

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues,
  });

  const openAddDialog = () => {
    form.reset(defaultValues);
    setFoodItems([]);
    setDialogOpen(true);
  };

  const addFoodItem = () => {
    if (newFoodItem.trim()) {
      setFoodItems([...foodItems, newFoodItem.trim()]);
      setNewFoodItem("");
    }
  };

  const removeFoodItem = (index: number) => {
    const updatedItems = [...foodItems];
    updatedItems.splice(index, 1);
    setFoodItems(updatedItems);
  };

  const onSubmit = async (data: MealFormValues) => {
    try {
      const mealData = {
        ...data,
        foods: foodItems,
      };
      
      await apiRequest("POST", "/api/meals", mealData);
      toast({
        title: "Success",
        description: "Meal logged successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meals", user.id] });
      setDialogOpen(false);
      form.reset(defaultValues);
      setFoodItems([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log meal",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Process meal data for visualizations
  const processMealData = () => {
    if (!meals) return { todayNutrition: null, macrosDistribution: [], caloriesByMealType: [] };
    
    // Today's nutrition summary
    const todayMeals = meals.filter((meal: any) => isToday(new Date(meal.date)));
    const todayNutrition = todayMeals.reduce(
      (acc: any, meal: any) => {
        acc.calories += meal.calories || 0;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fat += meal.fat || 0;
        return acc;
      }, 
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    // Macros distribution for pie chart
    const macrosDistribution = [
      { name: "Protein", value: todayNutrition.protein || 0 },
      { name: "Carbs", value: todayNutrition.carbs || 0 },
      { name: "Fat", value: todayNutrition.fat || 0 },
    ];
    
    // Calories by meal type
    const mealTypeMap = new Map<string, number>();
    todayMeals.forEach((meal: any) => {
      const currentCalories = mealTypeMap.get(meal.type) || 0;
      mealTypeMap.set(meal.type, currentCalories + (meal.calories || 0));
    });
    
    const caloriesByMealType = Array.from(mealTypeMap.entries()).map(([type, calories]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      calories
    }));
    
    return { 
      todayNutrition: todayNutrition,
      macrosDistribution,
      caloriesByMealType
    };
  };

  const { todayNutrition, macrosDistribution, caloriesByMealType } = processMealData();
  
  // Constants for nutrition targets
  const CALORIE_TARGET = 2000;
  const PROTEIN_TARGET = 120;
  const CARBS_TARGET = 250;
  const FAT_TARGET = 65;
  
  // Colors for charts
  const MACROS_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b'];
  const MEAL_TYPE_COLORS = {
    Breakfast: '#f59e0b',
    Lunch: '#14b8a6',
    Dinner: '#0ea5e9',
    Snack: '#8b5cf6'
  };
  
  return (
    <Layout title="Nutrition" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Nutrition Tracking</h1>
        <Button onClick={openAddDialog}>
          <span className="material-icons mr-2 text-sm">add</span>
          Log Meal
        </Button>
      </div>

      {/* Today's Nutrition Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today's Nutrition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="relative inline-flex w-24 h-24">
                <svg className="w-24 h-24">
                  <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="44" cx="48" cy="48"/>
                  <circle 
                    className="text-primary-500" 
                    strokeWidth="8" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="44" 
                    cx="48" 
                    cy="48"
                    strokeDasharray="276.5" 
                    strokeDashoffset={276.5 - (276.5 * ((todayNutrition?.calories || 0) / CALORIE_TARGET))}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold">{Math.round((todayNutrition?.calories || 0) / CALORIE_TARGET * 100)}%</span>
                </div>
              </div>
              <h3 className="text-lg font-medium mt-2">Calories</h3>
              <p className="text-sm text-gray-500">{todayNutrition?.calories || 0} / {CALORIE_TARGET}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative inline-flex w-24 h-24">
                <svg className="w-24 h-24">
                  <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="44" cx="48" cy="48"/>
                  <circle 
                    className="text-blue-500" 
                    strokeWidth="8" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="44" 
                    cx="48" 
                    cy="48"
                    strokeDasharray="276.5" 
                    strokeDashoffset={276.5 - (276.5 * ((todayNutrition?.protein || 0) / PROTEIN_TARGET))}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold">{Math.round((todayNutrition?.protein || 0) / PROTEIN_TARGET * 100)}%</span>
                </div>
              </div>
              <h3 className="text-lg font-medium mt-2">Protein</h3>
              <p className="text-sm text-gray-500">{todayNutrition?.protein || 0}g / {PROTEIN_TARGET}g</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative inline-flex w-24 h-24">
                <svg className="w-24 h-24">
                  <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="44" cx="48" cy="48"/>
                  <circle 
                    className="text-teal-500" 
                    strokeWidth="8" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="44" 
                    cx="48" 
                    cy="48"
                    strokeDasharray="276.5" 
                    strokeDashoffset={276.5 - (276.5 * ((todayNutrition?.carbs || 0) / CARBS_TARGET))}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold">{Math.round((todayNutrition?.carbs || 0) / CARBS_TARGET * 100)}%</span>
                </div>
              </div>
              <h3 className="text-lg font-medium mt-2">Carbs</h3>
              <p className="text-sm text-gray-500">{todayNutrition?.carbs || 0}g / {CARBS_TARGET}g</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative inline-flex w-24 h-24">
                <svg className="w-24 h-24">
                  <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="44" cx="48" cy="48"/>
                  <circle 
                    className="text-amber-500" 
                    strokeWidth="8" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="44" 
                    cx="48" 
                    cy="48"
                    strokeDasharray="276.5" 
                    strokeDashoffset={276.5 - (276.5 * ((todayNutrition?.fat || 0) / FAT_TARGET))}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold">{Math.round((todayNutrition?.fat || 0) / FAT_TARGET * 100)}%</span>
                </div>
              </div>
              <h3 className="text-lg font-medium mt-2">Fat</h3>
              <p className="text-sm text-gray-500">{todayNutrition?.fat || 0}g / {FAT_TARGET}g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Macros Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macrosDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {macrosDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MACROS_COLORS[index % MACROS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}g`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Calories by Meal Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Calories by Meal Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caloriesByMealType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} calories`, '']} />
                  <Bar dataKey="calories" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                    {caloriesByMealType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MEAL_TYPE_COLORS[entry.type as keyof typeof MEAL_TYPE_COLORS] || '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium">Date</th>
                  <th className="py-3 px-4 text-left font-medium">Meal</th>
                  <th className="py-3 px-4 text-left font-medium">Type</th>
                  <th className="py-3 px-4 text-left font-medium">Foods</th>
                  <th className="py-3 px-4 text-left font-medium">Calories</th>
                  <th className="py-3 px-4 text-left font-medium">Protein</th>
                  <th className="py-3 px-4 text-left font-medium">Carbs</th>
                  <th className="py-3 px-4 text-left font-medium">Fat</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      Loading meals...
                    </td>
                  </tr>
                ) : meals && meals.length > 0 ? (
                  meals
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((meal: any) => (
                      <tr key={meal.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{format(new Date(meal.date), "MMM dd, yyyy")} {format(new Date(meal.date), "HH:mm")}</td>
                        <td className="py-3 px-4">{meal.name}</td>
                        <td className="py-3 px-4 capitalize">{meal.type}</td>
                        <td className="py-3 px-4">{Array.isArray(meal.foods) ? meal.foods.join(", ") : "-"}</td>
                        <td className="py-3 px-4">{meal.calories || 0}</td>
                        <td className="py-3 px-4">{meal.protein || 0}g</td>
                        <td className="py-3 px-4">{meal.carbs || 0}g</td>
                        <td className="py-3 px-4">{meal.fat || 0}g</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      No meals logged yet. Start tracking your nutrition by logging your meals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Meal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Meal</DialogTitle>
            <DialogDescription>
              Record what you've eaten to track your nutrition
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Breakfast Oatmeal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Food Items</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add food item" 
                    value={newFoodItem} 
                    onChange={(e) => setNewFoodItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFoodItem();
                      }
                    }}
                  />
                  <Button type="button" onClick={addFoodItem}>Add</Button>
                </div>
                
                {foodItems.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {foodItems.map((item, index) => (
                      <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                        <span>{item}</span>
                        <button 
                          type="button" 
                          className="ml-2 text-gray-500 hover:text-gray-700"
                          onClick={() => removeFoodItem(index)}
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No food items added yet</p>
                )}
                
                {form.formState.errors.foods && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.foods.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""} 
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this meal" 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={foodItems.length === 0}
                  onClick={() => {
                    form.setValue('foods', foodItems);
                  }}
                >
                  Log Meal
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
