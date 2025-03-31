import React, { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogHealthDialog } from "@/components/ui/dialog-log-health";
import { parseJSONSafely } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area
} from "recharts";
import { format } from "date-fns";

interface HealthMetricsProps {
  user: User;
}

export default function HealthMetrics({ user }: HealthMetricsProps) {
  const [isHealthDialogOpen, setIsHealthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("weight");

  // Fetch health metrics
  const { data: healthMetrics, refetch: refetchHealthMetrics } = useQuery({
    queryKey: ["/api/health-metrics", user.id],
    queryFn: () => fetch(`/api/health-metrics/${user.id}`).then(res => res.json()),
  });

  // Process health metrics data
  const getLatestMetric = (type: string) => {
    if (!healthMetrics) return null;
    return healthMetrics
      .filter((m: any) => m.type === type)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const getMetricsForType = (type: string) => {
    if (!healthMetrics) return [];
    return healthMetrics
      .filter((m: any) => m.type === type)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m: any) => {
        if (type === "blood_pressure") {
          const bpValues = parseJSONSafely<{systolic: number, diastolic: number}>(
            m.value, 
            {systolic: 0, diastolic: 0}
          );
          return {
            date: format(new Date(m.date), "MMM dd"),
            systolic: bpValues.systolic,
            diastolic: bpValues.diastolic
          };
        }
        
        return {
          date: format(new Date(m.date), "MMM dd"),
          value: parseFloat(m.value)
        };
      });
  };

  const metrics = {
    weight: getMetricsForType("weight"),
    blood_pressure: getMetricsForType("blood_pressure"),
    heart_rate: getMetricsForType("heart_rate"),
    sleep: getMetricsForType("sleep"),
  };

  const latestMetrics = {
    weight: getLatestMetric("weight"),
    blood_pressure: getLatestMetric("blood_pressure"),
    heart_rate: getLatestMetric("heart_rate"),
    sleep: getLatestMetric("sleep"),
  };

  // Handle log health data
  const handleLogHealthData = () => {
    setIsHealthDialogOpen(true);
  };

  return (
    <Layout title="Health Metrics" user={user}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Health Metrics</h1>
        <Button onClick={handleLogHealthData}>
          <span className="material-icons mr-2 text-sm">add</span>
          Log New Measurement
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Weight Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">Weight</p>
                <div className="text-3xl font-bold mt-1">
                  {latestMetrics.weight 
                    ? `${parseFloat(latestMetrics.weight.value).toFixed(1)} kg` 
                    : "N/A"}
                </div>
              </div>
              <div className="flex items-center text-success-600 text-sm">
                <span className="material-icons text-sm mr-1">trending_down</span>
                2.5%
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Target: {user.targetWeight} kg
            </p>
          </CardContent>
        </Card>

        {/* Blood Pressure Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">Blood Pressure</p>
                <div className="text-3xl font-bold mt-1">
                  {latestMetrics.blood_pressure 
                    ? (() => {
                        const bp = parseJSONSafely<{systolic: number, diastolic: number}>(
                          latestMetrics.blood_pressure.value, 
                          {systolic: 0, diastolic: 0}
                        );
                        return `${bp.systolic}/${bp.diastolic}`;
                      })()
                    : "N/A"}
                </div>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <span className="material-icons text-sm mr-1">trending_flat</span>
                Stable
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Normal range: 90-120/60-80 mmHg
            </p>
          </CardContent>
        </Card>

        {/* Heart Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">Heart Rate</p>
                <div className="text-3xl font-bold mt-1">
                  {latestMetrics.heart_rate 
                    ? `${latestMetrics.heart_rate.value} bpm` 
                    : "N/A"}
                </div>
              </div>
              <div className="flex items-center text-danger-600 text-sm">
                <span className="material-icons text-sm mr-1">trending_up</span>
                5%
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Normal range: 60-100 bpm
            </p>
          </CardContent>
        </Card>

        {/* Sleep Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">Sleep</p>
                <div className="text-3xl font-bold mt-1">
                  {latestMetrics.sleep 
                    ? `${latestMetrics.sleep.value} hrs` 
                    : "N/A"}
                </div>
              </div>
              <div className="flex items-center text-success-600 text-sm">
                <span className="material-icons text-sm mr-1">trending_up</span>
                10%
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Target: {user.targetSleep} hrs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Metric History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="blood_pressure">Blood Pressure</TabsTrigger>
              <TabsTrigger value="heart_rate">Heart Rate</TabsTrigger>
              <TabsTrigger value="sleep">Sleep</TabsTrigger>
            </TabsList>
            
            <TabsContent value="weight">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.weight}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(14, 165, 233, 0.2)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="rgba(14, 165, 233, 0.05)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`${value} kg`, 'Weight']}
                      contentStyle={{ borderRadius: '0.375rem', border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0ea5e9" 
                      strokeWidth={3}
                      fill="url(#weightGradient)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="blood_pressure">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.blood_pressure}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[40, 160]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0.375rem', border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="#14b8a6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="heart_rate">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.heart_rate}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(239, 68, 68, 0.2)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="rgba(239, 68, 68, 0.05)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[40, 120]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`${value} bpm`, 'Heart Rate']}
                      contentStyle={{ borderRadius: '0.375rem', border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      fill="url(#hrGradient)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="sleep">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.sleep}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(20, 184, 166, 0.2)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="rgba(20, 184, 166, 0.05)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 12]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`${value} hrs`, 'Sleep']}
                      contentStyle={{ borderRadius: '0.375rem', border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#14b8a6" 
                      strokeWidth={3}
                      fill="url(#sleepGradient)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Health metrics table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium">Date</th>
                  <th className="py-3 px-4 text-left font-medium">Type</th>
                  <th className="py-3 px-4 text-left font-medium">Value</th>
                  <th className="py-3 px-4 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {healthMetrics ? (
                  healthMetrics
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((metric: any) => (
                      <tr key={metric.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{format(new Date(metric.date), "MMM dd, yyyy")}</td>
                        <td className="py-3 px-4 capitalize">{metric.type.replace('_', ' ')}</td>
                        <td className="py-3 px-4">
                          {metric.type === "blood_pressure" 
                            ? (() => {
                                const bp = parseJSONSafely<{systolic: number, diastolic: number}>(
                                  metric.value, 
                                  {systolic: 0, diastolic: 0}
                                );
                                return `${bp.systolic}/${bp.diastolic} mmHg`;
                              })()
                            : metric.type === "weight" 
                              ? `${parseFloat(metric.value).toFixed(1)} kg`
                              : metric.type === "heart_rate"
                                ? `${metric.value} bpm`
                                : metric.type === "sleep"
                                  ? `${metric.value} hrs`
                                  : metric.value
                          }
                        </td>
                        <td className="py-3 px-4">{metric.notes || "-"}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      Loading measurements...
                    </td>
                  </tr>
                )}
                {healthMetrics && healthMetrics.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No health measurements recorded yet. Start tracking your health by logging new measurements.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Health Data Dialog */}
      <LogHealthDialog
        userId={user.id}
        isOpen={isHealthDialogOpen}
        onClose={() => setIsHealthDialogOpen(false)}
        onSuccess={() => {
          refetchHealthMetrics();
        }}
      />
    </Layout>
  );
}
