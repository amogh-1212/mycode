import React, { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { User } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ProfileProps {
  user: User;
}

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  dateOfBirth: z.date().optional().nullable(),
  gender: z.string().optional(),
  height: z.number().positive("Height must be a positive number").optional().nullable(),
  targetWeight: z.number().positive("Target weight must be a positive number").optional().nullable(),
  targetSteps: z.number().positive("Target steps must be a positive number").optional().nullable(),
  targetWaterIntake: z.number().positive("Target water intake must be a positive number").optional().nullable(),
  targetSleep: z.number().positive("Target sleep must be a positive number").optional().nullable(),
  profilePicture: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Profile({ user }: ProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  const defaultValues: ProfileFormValues = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
    gender: user.gender || undefined,
    height: user.height || null,
    targetWeight: user.targetWeight || null,
    targetSteps: user.targetSteps || null,
    targetWaterIntake: user.targetWaterIntake || null,
    targetSleep: user.targetSleep || null,
    profilePicture: user.profilePicture,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await apiRequest("PUT", `/api/user/${user.id}`, data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user", user.id] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      // In a real app, you would validate the current password and update the password
      // For this demo, we'll just show a success message
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Fetch health metrics for profile statistics
  const { data: healthMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/health-metrics", user.id],
    queryFn: () => fetch(`/api/health-metrics/${user.id}`).then(res => res.json()),
  });

  // Get latest metrics for each type
  const getLatestMetric = (type: string) => {
    if (!healthMetrics) return null;
    return healthMetrics
      .filter((m: any) => m.type === type)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const latestWeight = getLatestMetric("weight");
  const latestSleep = getLatestMetric("sleep");

  return (
    <Layout title="Profile" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
          <span className="material-icons mr-2 text-sm">lock</span>
          Change Password
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                <img 
                  src={user.profilePicture || "https://via.placeholder.com/128"} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-500 mb-4">{user.email}</p>
              
              <div className="w-full mt-4 space-y-3">
                <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Height</span>
                  <span className="font-medium">{user.height ? `${user.height} cm` : "Not set"}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Current Weight</span>
                  <span className="font-medium">{latestWeight ? `${parseFloat(latestWeight.value).toFixed(1)} kg` : "Not set"}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Target Weight</span>
                  <span className="font-medium">{user.targetWeight ? `${user.targetWeight} kg` : "Not set"}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Daily Step Goal</span>
                  <span className="font-medium">{user.targetSteps ? `${user.targetSteps}` : "Not set"}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Sleep Goal</span>
                  <span className="font-medium">{user.targetSleep ? `${user.targetSleep} hrs` : "Not set"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information and health goals</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="goals">Health Goals</TabsTrigger>
              </TabsList>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""} 
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="profilePicture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture URL</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Enter the URL of your profile picture
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="goals" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="targetWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Set your weight goal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetSteps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Step Target</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Set your daily step goal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetWaterIntake"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Water Intake Target (L)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Set your daily water intake goal in liters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetSleep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sleep Target (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.5"
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Set your daily sleep goal in hours
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Change Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
