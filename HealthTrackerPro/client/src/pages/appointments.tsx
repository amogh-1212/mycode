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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, isFuture, isPast, isToday } from "date-fns";

interface AppointmentsProps {
  user: User;
}

const appointmentSchema = z.object({
  userId: z.number(),
  title: z.string().min(1, "Appointment title is required"),
  doctor: z.string().min(1, "Doctor name is required"),
  location: z.string().min(1, "Location is required"),
  date: z.date(),
  duration: z.number().min(5, "Duration must be at least 5 minutes"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function Appointments({ user }: AppointmentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments", user.id],
    queryFn: () => fetch(`/api/appointments/${user.id}`).then(res => res.json()),
  });

  const defaultValues: AppointmentFormValues = {
    userId: user.id,
    title: "",
    doctor: "",
    location: "",
    date: new Date(),
    duration: 60,
    status: "scheduled",
    notes: "",
  };

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues,
  });

  const openAddDialog = () => {
    form.reset(defaultValues);
    setEditingAppointment(null);
    setDialogOpen(true);
  };

  const openEditDialog = (appointment: any) => {
    setEditingAppointment(appointment);
    form.reset({
      ...appointment,
      date: new Date(appointment.date),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      if (editingAppointment) {
        await apiRequest("PUT", `/api/appointments/${editingAppointment.id}`, data);
        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/appointments", data);
        toast({
          title: "Success",
          description: "Appointment created successfully",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", user.id] });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: editingAppointment ? "Failed to update appointment" : "Failed to create appointment",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const deleteAppointment = async (id: number) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      try {
        await apiRequest("DELETE", `/api/appointments/${id}`, undefined);
        toast({
          title: "Success",
          description: "Appointment deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/appointments", user.id] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete appointment",
          variant: "destructive",
        });
        console.error(error);
      }
    }
  };

  const updateAppointmentStatus = async (appointment: any, newStatus: string) => {
    try {
      await apiRequest("PUT", `/api/appointments/${appointment.id}`, {
        ...appointment,
        status: newStatus
      });
      toast({
        title: "Success",
        description: `Appointment marked as ${newStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", user.id] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Group appointments by status
  const groupedAppointments = React.useMemo(() => {
    if (!appointments) return { upcoming: [], past: [], today: [] };
    
    const now = new Date();
    
    // Sort appointments by date
    const sortedAppointments = [...appointments].sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return {
      upcoming: sortedAppointments.filter((apt: any) => 
        isFuture(new Date(apt.date)) && !isToday(new Date(apt.date))
      ),
      today: sortedAppointments.filter((apt: any) => 
        isToday(new Date(apt.date))
      ),
      past: sortedAppointments.filter((apt: any) => 
        isPast(new Date(apt.date)) && !isToday(new Date(apt.date))
      ),
    };
  }, [appointments]);

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary-100 text-primary-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderAppointmentCard = (appointment: any) => {
    const appointmentDate = new Date(appointment.date);
    const endTime = new Date(appointmentDate.getTime() + appointment.duration * 60000);
    
    return (
      <Card key={appointment.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{appointment.title}</h3>
              <p className="text-sm text-gray-500">{appointment.doctor}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.status)}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="material-icons text-sm mr-2">calendar_today</span>
              {format(appointmentDate, "EEEE, MMMM d, yyyy")}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="material-icons text-sm mr-2">schedule</span>
              {format(appointmentDate, "h:mm a")} - {format(endTime, "h:mm a")} ({appointment.duration} min)
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="material-icons text-sm mr-2">location_on</span>
              {appointment.location}
            </div>
            {appointment.notes && (
              <div className="flex items-start text-sm text-gray-600">
                <span className="material-icons text-sm mr-2 mt-0.5">notes</span>
                <p>{appointment.notes}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => openEditDialog(appointment)}>
              <span className="material-icons text-sm mr-1">edit</span>
              Edit
            </Button>
            <div className="space-x-2">
              {(isFuture(appointmentDate) || isToday(appointmentDate)) && appointment.status !== "cancelled" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => updateAppointmentStatus(appointment, "cancelled")}
                >
                  <span className="material-icons text-sm mr-1">cancel</span>
                  Cancel
                </Button>
              )}
              {isFuture(appointmentDate) && appointment.status === "scheduled" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-primary-600 hover:text-primary-700"
                  onClick={() => updateAppointmentStatus(appointment, "confirmed")}
                >
                  <span className="material-icons text-sm mr-1">check_circle</span>
                  Confirm
                </Button>
              )}
              {(isToday(appointmentDate) || isPast(appointmentDate)) && 
               appointment.status !== "completed" && 
               appointment.status !== "cancelled" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-green-600 hover:text-green-700"
                  onClick={() => updateAppointmentStatus(appointment, "completed")}
                >
                  <span className="material-icons text-sm mr-1">task_alt</span>
                  Complete
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-600 hover:text-gray-700"
                onClick={() => deleteAppointment(appointment.id)}
              >
                <span className="material-icons text-sm mr-1">delete</span>
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout title="Appointments" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Button onClick={openAddDialog}>
          <span className="material-icons mr-2 text-sm">add</span>
          Schedule Appointment
        </Button>
      </div>

      {/* Appointments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading appointments...</p>
              </CardContent>
            </Card>
          ) : groupedAppointments.upcoming.length > 0 ? (
            groupedAppointments.upcoming.map(renderAppointmentCard)
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="mb-4">You don't have any upcoming appointments.</p>
                <Button onClick={openAddDialog}>Schedule Your First Appointment</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="today">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading appointments...</p>
              </CardContent>
            </Card>
          ) : groupedAppointments.today.length > 0 ? (
            groupedAppointments.today.map(renderAppointmentCard)
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p>You don't have any appointments scheduled for today.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading appointments...</p>
              </CardContent>
            </Card>
          ) : groupedAppointments.past.length > 0 ? (
            groupedAppointments.past.map(renderAppointmentCard)
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p>You don't have any past appointments.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? "Edit Appointment" : "Schedule Appointment"}
            </DialogTitle>
            <DialogDescription>
              {editingAppointment 
                ? "Update your appointment details" 
                : "Fill in the details to schedule a new appointment"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Physical, Dental Checkup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor/Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dr. Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. City Medical Center" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this appointment" 
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
                <Button type="submit">
                  {editingAppointment ? "Update Appointment" : "Schedule Appointment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
