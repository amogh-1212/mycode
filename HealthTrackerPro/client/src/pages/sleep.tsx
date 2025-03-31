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
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SleepProps {
  user: User;
}

const sleepSchema = z.object({
  userId: z.number(),
  type: z.literal("sleep"),
  value: z.string().min(1, "Sleep duration is required"),
  date: z.date(),
  notes: z.string().optional(),
});

type SleepFormValues = z.infer<typeof sleepSchema>;

export default function Sleep({ user }: SleepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch sleep metrics
  const { data: sleepMetrics, isLoading } = useQuery({
    queryKey: ["/api/health-metrics", user.id, "sleep"],
    queryFn: () => fetch(`/api/health-metrics/${user.id}?type=sleep`).then(res => res.json()),
  });

  const defaultValues: SleepFormValues = {
    userId: user.id,
    type: "sleep",
    value: "",
    date: new Date(),
    notes: "",
  };

  const form = useForm<SleepFormValues>({
    resolver: zodResolver(sleepSchema),
    defaultValues,
  });

  const onSubmit = async (data: SleepFormValues) => {
    try {
      await apiRequest("POST", "/api/health-metrics", data);
      toast({
        title: "Success",
        description: "Sleep data logged successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics", user.id, "sleep"] });
      setDialogOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log sleep data",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Process sleep data for visualizations
  const processSleepData = () => {
    if (!sleepMetrics) return { lastWeekSleep: [], monthlyAverage: [], qualityDistribution: [] };
    
    // Sort metrics by date
    const sortedMetrics = [...sleepMetrics].sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Last week's sleep data
    const lastWeekDate = subDays(new Date(), 7);
    const lastWeekSleep = sortedMetrics
      .filter((metric: any) => new Date(metric.date) >= lastWeekDate)
      .map((metric: any) => ({
        date: format(new Date(metric.date), "MMM dd"),
        hours: parseFloat(metric.value),
        target: user.targetSleep || 8,
      }));
    
    // Monthly average calculation
    const monthlyData = new Map<string, { total: number; count: number }>();
    sortedMetrics.forEach((metric: any) => {
      const monthYear = format(new Date(metric.date), "MMM yyyy");
      const current = monthlyData.get(monthYear) || { total: 0, count: 0 };
      monthlyData.set(monthYear, {
        total: current.total + parseFloat(metric.value),
        count: current.count + 1,
      });
    });
    
    const monthlyAverage = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        average: data.total / data.count,
      }))
      .slice(-6); // Last 6 months
    
    // Sleep quality distribution (example categories based on hours)
    const qualityMap = new Map<string, number>();
    sortedMetrics.forEach((metric: any) => {
      const hours = parseFloat(metric.value);
      let quality;
      if (hours < 6) quality = "Poor (<6h)";
      else if (hours < 7) quality = "Fair (6-7h)";
      else if (hours < 8) quality = "Good (7-8h)";
      else quality = "Excellent (>8h)";
      
      qualityMap.set(quality, (qualityMap.get(quality) || 0) + 1);
    });
    
    const qualityDistribution = Array.from(qualityMap.entries())
      .map(([quality, count]) => ({ quality, count }));
    
    return { lastWeekSleep, monthlyAverage, qualityDistribution };
  };

  const { lastWeekSleep, monthlyAverage, qualityDistribution } = processSleepData();
  
  return (
    <Layout title="Sleep" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sleep Tracking</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <span className="material-icons mr-2 text-sm">add</span>
          Log Sleep
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="material-icons text-4xl text-primary-500 mb-2">bedtime</span>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Last Night</h3>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : sleepMetrics && sleepMetrics.length > 0
                  ? `${parseFloat(sleepMetrics[0].value).toFixed(1)}h`
                  : "No data"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {sleepMetrics && sleepMetrics.length > 0 && parseFloat(sleepMetrics[0].value) >= (user.targetSleep || 8)
                  ? "Achieved target"
                  : "Below target"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="material-icons text-4xl text-secondary-500 mb-2">query_stats</span>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Weekly Average</h3>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : lastWeekSleep && lastWeekSleep.length > 0
                  ? `${(lastWeekSleep.reduce((sum, day) => sum + day.hours, 0) / lastWeekSleep.length).toFixed(1)}h`
                  : "No data"}
              </p>
              <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="material-icons text-4xl text-amber-500 mb-2">emoji_events</span>
              <h3 className="text-lg font-medium text-gray-800 mb-1">Sleep Goal</h3>
              <p className="text-3xl font-bold">{user.targetSleep || 8}h</p>
              <p className="text-sm text-gray-500 mt-1">Your target sleep duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Duration Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sleep Duration - Last Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lastWeekSleep} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 12]} />
                <Tooltip formatter={(value) => [`${value} hours`, 'Sleep']} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorSleep)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly Average Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sleep Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyAverage} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 12]} />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)} hours`, 'Average Sleep']} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#14b8a6"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sleep Quality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quality" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} nights`, 'Count']} />
                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                    {qualityDistribution.map((entry, index) => {
                      const colors = ["#ef4444", "#f59e0b", "#10b981", "#0ea5e9"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Log History */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium">Date</th>
                  <th className="py-3 px-4 text-left font-medium">Duration</th>
                  <th className="py-3 px-4 text-left font-medium">Quality</th>
                  <th className="py-3 px-4 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      Loading sleep data...
                    </td>
                  </tr>
                ) : sleepMetrics && sleepMetrics.length > 0 ? (
                  sleepMetrics.map((metric: any) => {
                    const hours = parseFloat(metric.value);
                    let quality;
                    if (hours < 6) quality = "Poor";
                    else if (hours < 7) quality = "Fair";
                    else if (hours < 8) quality = "Good";
                    else quality = "Excellent";
                    
                    return (
                      <tr key={metric.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{format(new Date(metric.date), "MMM dd, yyyy")}</td>
                        <td className="py-3 px-4">{hours.toFixed(1)} hours</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            quality === "Poor" ? "bg-red-100 text-red-800" :
                            quality === "Fair" ? "bg-amber-100 text-amber-800" :
                            quality === "Good" ? "bg-green-100 text-green-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {quality}
                          </span>
                        </td>
                        <td className="py-3 px-4">{metric.notes || "-"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No sleep data logged yet. Start tracking your sleep by logging your sleep duration.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Sleep Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Sleep</DialogTitle>
            <DialogDescription>
              Record your sleep duration to track your sleep patterns
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sleep Duration (hours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="e.g. 7.5" 
                        {...field} 
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about your sleep" 
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
                <Button type="submit">Log Sleep</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
