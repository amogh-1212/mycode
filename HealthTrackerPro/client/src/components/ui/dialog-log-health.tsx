import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertHealthMetricSchema } from "@shared/schema";

interface LogHealthDialogProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const extendedSchema = insertHealthMetricSchema.extend({
  value: z.string().min(1, "Value is required"),
});

type FormValues = z.infer<typeof extendedSchema>;

export function LogHealthDialog({ userId, isOpen, onClose, onSuccess }: LogHealthDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("weight");

  const defaultValues: Partial<FormValues> = {
    userId: userId,
    type: activeTab,
    value: "",
    date: new Date(),
    notes: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (activeTab) {
      form.setValue("type", activeTab);
    }
  }, [activeTab, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      await apiRequest("POST", "/api/health-metrics", data);
      toast({
        title: "Success",
        description: "Health data logged successfully",
      });
      form.reset(defaultValues);
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log health data",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Health Data</DialogTitle>
          <DialogDescription>
            Enter your health measurements to track your progress.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="blood_pressure">BP</TabsTrigger>
                <TabsTrigger value="heart_rate">Heart</TabsTrigger>
                <TabsTrigger value="sleep">Sleep</TabsTrigger>
              </TabsList>

              <TabsContent value="weight">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Enter your weight" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="blood_pressure">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Pressure (systolic/diastolic)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 120/80" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="heart_rate">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heart Rate (bpm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter your heart rate" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="sleep">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sleep (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Enter sleep duration" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
