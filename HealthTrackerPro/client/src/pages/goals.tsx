import React, { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { User } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

interface GoalsProps {
  user: User;
}

const goalSchema = z.object({
  userId: z.number(),
  title: z.string().min(1, "Goal title is required"),
  category: z.string().min(1, "Category is required"),
  target: z.string().min(1, "Target value is required"),
  currentValue: z.string().min(1, "Current value is required"),
  startDate: z.date(),
  targetDate: z.date().optional().nullable(),
  completed: z.boolean().default(false),
  progress: z.number().min(0).max(100).default(0),
  icon: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export default function Goals({ user }: GoalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  
  // Fetch goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/goals", user.id],
    queryFn: () => fetch(`/api/goals/${user.id}`).then(res => res.json()),
  });

  const defaultValues: GoalFormValues = {
    userId: user.id,
    title: "",
    category: "weight",
    target: "",
    currentValue: "",
    startDate: new Date(),
    targetDate: null,
    completed: false,
    progress: 0,
    icon: "",
  };

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues,
  });

  const openAddDialog = () => {
    form.reset(defaultValues);
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const openEditDialog = (goal: any) => {
    setEditingGoal(goal);
    form.reset({
      ...goal,
      startDate: new Date(goal.startDate),
      targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: GoalFormValues) => {
    try {
      // Calculate progress based on current and target values
      let calculatedProgress = 0;
      const current = parseFloat(data.currentValue);
      const target = parseFloat(data.target);
      
      if (!isNaN(current) && !isNaN(target) && target !== 0) {
        if (data.category === "weight") {
          // For weight loss, progress is inverse
          const initialWeight = target < current ? current : data.target;
          const targetWeight = target < current ? target : current;
          const weightDiff = parseFloat(initialWeight) - parseFloat(targetWeight);
          const progressDiff = parseFloat(initialWeight) - current;
          
          calculatedProgress = weightDiff > 0 ? Math.min(100, (progressDiff / weightDiff) * 100) : 0;
        } else {
          // For other goals, progress is direct
          calculatedProgress = Math.min(100, (current / target) * 100);
        }
      }
      
      // Get icon based on category if not provided
      const icon = data.icon || getCategoryIcon(data.category);
      
      const finalData = {
        ...data,
        progress: Math.round(calculatedProgress),
        icon,
      };

      if (editingGoal) {
        await apiRequest("PUT", `/api/goals/${editingGoal.id}`, finalData);
        toast({
          title: "Success",
          description: "Goal updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/goals", finalData);
        toast({
          title: "Success",
          description: "Goal created successfully",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/goals", user.id] });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: editingGoal ? "Failed to update goal" : "Failed to create goal",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const deleteGoal = async (id: number) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      try {
        await apiRequest("DELETE", `/api/goals/${id}`, undefined);
        toast({
          title: "Success",
          description: "Goal deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/goals", user.id] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete goal",
          variant: "destructive",
        });
        console.error(error);
      }
    }
  };

  const completeGoal = async (goal: any) => {
    try {
      await apiRequest("PUT", `/api/goals/${goal.id}`, {
        ...goal,
        completed: !goal.completed,
        progress: goal.completed ? goal.progress : 100,
      });
      toast({
        title: "Success",
        description: goal.completed 
          ? "Goal marked as incomplete" 
          : "Congratulations! Goal marked as complete",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", user.id] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "weight": return "monitor_weight";
      case "exercise": return "directions_run";
      case "hydration": return "water_drop";
      case "steps": return "directions_walk";
      case "nutrition": return "restaurant";
      case "sleep": return "bedtime";
      default: return "flag";
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "weight": return "primary";
      case "exercise": return "secondary";
      case "hydration": return "cyan";
      case "steps": return "emerald";
      case "nutrition": return "amber";
      case "sleep": return "indigo";
      default: return "gray";
    }
  };

  // Group goals by completion status
  const groupedGoals = React.useMemo(() => {
    if (!goals) return { active: [], completed: [] };
    
    const active = goals.filter((goal: any) => !goal.completed);
    const completed = goals.filter((goal: any) => goal.completed);
    
    return { active, completed };
  }, [goals]);

  return (
    <Layout title="Goals" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Health Goals</h1>
        <Button onClick={openAddDialog}>
          <span className="material-icons mr-2 text-sm">add</span>
          Add New Goal
        </Button>
      </div>

      {/* Active Goals */}
      <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p>Loading goals...</p>
            </CardContent>
          </Card>
        ) : groupedGoals.active && groupedGoals.active.length > 0 ? (
          groupedGoals.active.map((goal: any) => (
            <Card key={goal.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full bg-${getCategoryColor(goal.category)}-100 flex items-center justify-center`}>
                      <span className={`material-icons text-${getCategoryColor(goal.category)}-600`}>{goal.icon || getCategoryIcon(goal.category)}</span>
                    </div>
                    <h3 className="ml-3 font-medium">{goal.title}</h3>
                  </div>
                  <div className="text-sm font-medium text-primary-600">{goal.progress}%</div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Current: {goal.currentValue}</span>
                    <span>Target: {goal.target}</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex items-center mb-1">
                    <span className="material-icons text-sm mr-1 text-gray-500">calendar_today</span>
                    <span>Started: {formatDistanceToNow(new Date(goal.startDate), { addSuffix: true })}</span>
                  </div>
                  {goal.targetDate && (
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1 text-gray-500">event</span>
                      <span>Target date: {format(new Date(goal.targetDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(goal)}>
                    <span className="material-icons text-sm mr-1">edit</span>
                    Edit
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => deleteGoal(goal.id)}>
                      <span className="material-icons text-sm mr-1">delete</span>
                      Delete
                    </Button>
                    <Button size="sm" onClick={() => completeGoal(goal)}>
                      <span className="material-icons text-sm mr-1">check_circle</span>
                      Complete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="mb-4">You don't have any active goals. Set some health goals to track your progress!</p>
              <Button onClick={openAddDialog}>Create Your First Goal</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Goals */}
      {groupedGoals.completed && groupedGoals.completed.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Completed Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {groupedGoals.completed.map((goal: any) => (
              <Card key={goal.id} className="overflow-hidden bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center`}>
                        <span className="material-icons text-gray-600">{goal.icon || getCategoryIcon(goal.category)}</span>
                      </div>
                      <h3 className="ml-3 font-medium text-gray-700">{goal.title}</h3>
                    </div>
                    <div className="text-sm font-medium text-success-600">100%</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1 text-gray-600">
                      <span>Achieved: {goal.target}</span>
                      <span>Completed: {formatDistanceToNow(new Date(goal.updated_at || goal.startDate), { addSuffix: true })}</span>
                    </div>
                    <Progress value={100} className="h-2 bg-gray-200" />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <Button variant="outline" size="sm" className="text-gray-500" onClick={() => deleteGoal(goal.id)}>
                      <span className="material-icons text-sm mr-1">delete</span>
                      Delete
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => completeGoal(goal)}>
                      <span className="material-icons text-sm mr-1">replay</span>
                      Reactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Goal Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? "Update your goal details and progress" 
                : "Set a new health goal to track your progress"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Lose Weight, Increase Steps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weight">Weight</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="hydration">Hydration</SelectItem>
                        <SelectItem value="steps">Steps</SelectItem>
                        <SelectItem value="nutrition">Nutrition</SelectItem>
                        <SelectItem value="sleep">Sleep</SelectItem>
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
                  name="currentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Value</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
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

                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""} 
                          onChange={(e) => e.target.value ? field.onChange(new Date(e.target.value)) : field.onChange(null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon or leave empty for default" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Default</SelectItem>
                        <SelectItem value="monitor_weight">Weight Scale</SelectItem>
                        <SelectItem value="directions_run">Running</SelectItem>
                        <SelectItem value="directions_walk">Walking</SelectItem>
                        <SelectItem value="fitness_center">Gym</SelectItem>
                        <SelectItem value="water_drop">Water</SelectItem>
                        <SelectItem value="restaurant">Food</SelectItem>
                        <SelectItem value="bedtime">Sleep</SelectItem>
                        <SelectItem value="favorite">Heart</SelectItem>
                        <SelectItem value="bolt">Energy</SelectItem>
                        <SelectItem value="local_fire_department">Calories</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGoal ? "Update Goal" : "Create Goal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
