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
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ExerciseProps {
  user: User;
}

const exerciseSchema = z.object({
  userId: z.number(),
  type: z.string().min(1, "Exercise type is required"),
  duration: z.number().min(1, "Duration is required"),
  distance: z.number().optional(),
  calories: z.number().optional(),
  date: z.date(),
  notes: z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export default function Exercise({ user }: ExerciseProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch exercise logs
  const { data: exerciseLogs, isLoading } = useQuery({
    queryKey: ["/api/exercise-logs", user.id],
    queryFn: () => fetch(`/api/exercise-logs/${user.id}`).then(res => res.json()),
  });

  const defaultValues: ExerciseFormValues = {
    userId: user.id,
    type: "walking",
    duration: 30,
    distance: 0,
    calories: 0,
    date: new Date(),
    notes: "",
  };

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues,
  });

  const onSubmit = async (data: ExerciseFormValues) => {
    try {
      await apiRequest("POST", "/api/exercise-logs", data);
      toast({
        title: "Success",
        description: "Exercise logged successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs", user.id] });
      setDialogOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log exercise",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Process exercise log data for visualizations
  const processExerciseData = () => {
    if (!exerciseLogs) return { weeklyActivity: [], typeDistribution: [], caloriesTrend: [] };
    
    // Weekly activity chart data
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyActivity = Array(7).fill(null).map((_, i) => ({
      day: days[i],
      minutes: 0,
      calories: 0
    }));
    
    // Type distribution data
    const typeMap = new Map<string, number>();
    
    // Calories trend data
    const caloriesTrend: { date: string; calories: number }[] = [];
    const dateMap = new Map<string, number>();
    
    exerciseLogs.forEach((log: any) => {
      const date = new Date(log.date);
      const dayIndex = date.getDay();
      
      // Update weekly activity
      weeklyActivity[dayIndex].minutes += log.duration;
      weeklyActivity[dayIndex].calories += log.calories || 0;
      
      // Update type distribution
      const currentTypeCount = typeMap.get(log.type) || 0;
      typeMap.set(log.type, currentTypeCount + 1);
      
      // Update calories trend
      const dateStr = format(date, "MMM dd");
      const currentCalories = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, currentCalories + (log.calories || 0));
    });
    
    // Convert type map to array
    const typeDistribution = Array.from(typeMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
    
    // Convert date map to array and sort by date
    Array.from(dateMap.entries()).forEach(([date, calories]) => {
      caloriesTrend.push({ date, calories });
    });
    caloriesTrend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return { weeklyActivity, typeDistribution, caloriesTrend: caloriesTrend.slice(-10) };
  };

  const { weeklyActivity, typeDistribution, caloriesTrend } = processExerciseData();

  // Colors for pie chart
  const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <Layout title="Exercise" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exercise Tracking</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <span className="material-icons mr-2 text-sm">add</span>
          Log Exercise
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="material-icons text-4xl text-primary-500 mb-2">directions_run</span>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Total Exercise</h3>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : exerciseLogs 
                  ? exerciseLogs.reduce((sum: number, log: any) => sum + log.duration, 0) 
                  : 0} min
              </p>
              <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="material-icons text-4xl text-secondary-500 mb-2">local_fire_department</span>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Calories Burned</h3>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : exerciseLogs 
                  ? exerciseLogs.reduce((sum: number, log: any) => sum + (log.calories || 0), 0) 
                  : 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="material-icons text-4xl text-amber-500 mb-2">map</span>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Distance</h3>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : exerciseLogs 
                  ? exerciseLogs.reduce((sum: number, log: any) => sum + (log.distance || 0), 0).toFixed(1) 
                  : 0} km
              </p>
              <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {/* Weekly Activity Chart */}
        <Card className="col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="minutes" name="Duration (min)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="calories" name="Calories" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Exercise Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} sessions`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Calories Trend */}
        <Card className="col-span-1 xl:col-span-3">
          <CardHeader>
            <CardTitle>Calories Burned Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={caloriesTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} calories`, 'Calories Burned']} />
                  <Line type="monotone" dataKey="calories" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise History */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium">Date</th>
                  <th className="py-3 px-4 text-left font-medium">Exercise</th>
                  <th className="py-3 px-4 text-left font-medium">Duration</th>
                  <th className="py-3 px-4 text-left font-medium">Distance</th>
                  <th className="py-3 px-4 text-left font-medium">Calories</th>
                  <th className="py-3 px-4 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      Loading exercise data...
                    </td>
                  </tr>
                ) : exerciseLogs && exerciseLogs.length > 0 ? (
                  exerciseLogs.slice(0, 10).map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{format(new Date(log.date), "MMM dd, yyyy")}</td>
                      <td className="py-3 px-4 capitalize">{log.type}</td>
                      <td className="py-3 px-4">{log.duration} min</td>
                      <td className="py-3 px-4">{log.distance ? `${log.distance.toFixed(1)} km` : "-"}</td>
                      <td className="py-3 px-4">{log.calories || "-"}</td>
                      <td className="py-3 px-4">{log.notes || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No exercise logs found. Start tracking your exercise by logging your activities.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Exercise Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Exercise</DialogTitle>
            <DialogDescription>
              Record your workout details to track your progress
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exercise type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="walking">Walking</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="cycling">Cycling</SelectItem>
                        <SelectItem value="swimming">Swimming</SelectItem>
                        <SelectItem value="yoga">Yoga</SelectItem>
                        <SelectItem value="strength">Strength Training</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""} 
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories Burned</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          value={field.value || ""}
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
                        placeholder="Any additional notes about your exercise" 
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
                <Button type="submit">Log Exercise</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
