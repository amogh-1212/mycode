import React, { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { User, Medication } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { parseJSONSafely } from "@/lib/utils";
import { format } from "date-fns";

interface MedicationsProps {
  user: User;
}

const medicationSchema = z.object({
  userId: z.number(),
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  time: z.string().min(1, "Time is required"),
  instructions: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  active: z.boolean().default(true),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

export default function Medications({ user }: MedicationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  
  // Fetch medications
  const { data: medications, isLoading } = useQuery({
    queryKey: ["/api/medications", user.id],
    queryFn: () => fetch(`/api/medications/${user.id}`).then(res => res.json()),
  });

  // Fetch medication logs
  const { data: medicationLogs, refetch: refetchMedicationLogs } = useQuery({
    queryKey: ["/api/medication-logs", user.id],
    queryFn: () => fetch(`/api/medication-logs/${user.id}`).then(res => res.json()),
  });

  const defaultValues: MedicationFormValues = {
    userId: user.id,
    name: "",
    dosage: "",
    frequency: "daily",
    time: "08:00",
    instructions: "",
    startDate: new Date(),
    endDate: null,
    active: true,
  };

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues,
  });

  const openAddDialog = () => {
    form.reset(defaultValues);
    setEditingMedication(null);
    setDialogOpen(true);
  };

  const openEditDialog = (medication: Medication) => {
    setEditingMedication(medication);
    const times = parseJSONSafely<string[]>(medication.time, []);
    form.reset({
      ...medication,
      time: times[0] || "08:00",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: MedicationFormValues) => {
    try {
      // Format the time as JSON string array
      const formattedData = {
        ...data,
        time: JSON.stringify([data.time]),
      };

      if (editingMedication) {
        await apiRequest("PUT", `/api/medications/${editingMedication.id}`, formattedData);
        toast({
          title: "Success",
          description: "Medication updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/medications", formattedData);
        toast({
          title: "Success",
          description: "Medication added successfully",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/medications", user.id] });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: editingMedication 
          ? "Failed to update medication" 
          : "Failed to add medication",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const handleTakeMedication = async (medication: any) => {
    // Find today's log for this medication
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const log = medicationLogs?.find((l: any) => 
      l.medicationId === medication.id && 
      new Date(l.scheduledTime) >= today
    );

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
    } else {
      // Create a log for today
      try {
        const times = parseJSONSafely<string[]>(medication.time, ["08:00"]);
        const [hours, minutes] = times[0].split(':').map(Number);
        
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        await apiRequest("POST", "/api/medication-logs", {
          medicationId: medication.id,
          userId: user.id,
          taken: true,
          scheduledTime,
          takenTime: new Date(),
          notes: "",
        });
        
        refetchMedicationLogs();
        toast({
          title: "Success",
          description: "Medication marked as taken",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to log medication",
          variant: "destructive",
        });
        console.error(error);
      }
    }
  };

  const deleteMedication = async (id: number) => {
    if (confirm("Are you sure you want to delete this medication?")) {
      try {
        await apiRequest("DELETE", `/api/medications/${id}`, undefined);
        toast({
          title: "Success",
          description: "Medication deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/medications", user.id] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete medication",
          variant: "destructive",
        });
        console.error(error);
      }
    }
  };

  const toggleMedicationActive = async (medication: Medication) => {
    try {
      await apiRequest("PUT", `/api/medications/${medication.id}`, {
        ...medication,
        active: !medication.active,
      });
      toast({
        title: "Success",
        description: medication.active 
          ? "Medication deactivated" 
          : "Medication activated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medications", user.id] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update medication status",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const isMedicationTakenToday = (medicationId: number) => {
    if (!medicationLogs) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const log = medicationLogs.find((l: any) => 
      l.medicationId === medicationId && 
      new Date(l.scheduledTime) >= today
    );
    
    return log && log.taken;
  };

  return (
    <Layout title="Medications" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medications</h1>
        <Button onClick={openAddDialog}>
          <span className="material-icons mr-2 text-sm">add</span>
          Add Medication
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p>Loading medications...</p>
            </CardContent>
          </Card>
        ) : medications && medications.length > 0 ? (
          medications.map((medication: any) => {
            const times = parseJSONSafely<string[]>(medication.time, []);
            const isTaken = isMedicationTakenToday(medication.id);
            
            return (
              <Card key={medication.id} className={`overflow-hidden ${medication.active ? '' : 'opacity-60'}`}>
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-semibold">{medication.name}</CardTitle>
                      <CardDescription>{medication.frequency}</CardDescription>
                    </div>
                    <div className="flex items-center">
                      <span className={`material-icons text-xl mr-2 ${medication.active ? 'text-primary-600' : 'text-gray-400'}`}>
                        medication
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-2 text-gray-500">medication</span>
                      <span className="text-sm">{medication.dosage}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-2 text-gray-500">schedule</span>
                      <span className="text-sm">{times[0] || "No time set"}</span>
                    </div>
                    {medication.instructions && (
                      <div className="flex items-start">
                        <span className="material-icons text-sm mr-2 text-gray-500 mt-0.5">info</span>
                        <span className="text-sm">{medication.instructions}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-2 text-gray-500">event</span>
                      <span className="text-sm">Started: {format(new Date(medication.startDate), "MMM d, yyyy")}</span>
                    </div>
                    {medication.endDate && (
                      <div className="flex items-center">
                        <span className="material-icons text-sm mr-2 text-gray-500">event_busy</span>
                        <span className="text-sm">Ends: {format(new Date(medication.endDate), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(medication)}>
                      <span className="material-icons text-sm mr-1">edit</span>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteMedication(medication.id)}>
                      <span className="material-icons text-sm mr-1">delete</span>
                      Delete
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant={isTaken ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleTakeMedication(medication)}
                      className={isTaken ? "bg-primary-600" : ""}
                    >
                      <span className="material-icons text-sm mr-1">
                        {isTaken ? "check_circle" : "circle"}
                      </span>
                      {isTaken ? "Taken" : "Take"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="mb-4">You don't have any medications set up yet.</p>
              <Button onClick={openAddDialog}>Add Your First Medication</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Medication Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMedication ? "Edit Medication" : "Add New Medication"}
            </DialogTitle>
            <DialogDescription>
              {editingMedication 
                ? "Update your medication details" 
                : "Enter the details of your medication"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Vitamin D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1 pill, 10mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="twice_daily">Twice daily</SelectItem>
                          <SelectItem value="every_other_day">Every other day</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="as_needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
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
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g. Take with food" 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Inactive medications won't show up in reminders
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMedication ? "Update" : "Add"} Medication
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
