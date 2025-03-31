import React, { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { parseJSONSafely } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Label,
} from "recharts";

interface ReportsProps {
  user: User;
}

export default function Reports({ user }: ReportsProps) {
  const [reportType, setReportType] = useState("overview");
  const [timeRange, setTimeRange] = useState("month");
  
  // Date range calculations
  const calculateDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    
    switch (timeRange) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subDays(now, 30);
        break;
      case "3months":
        startDate = subDays(now, 90);
        break;
      case "6months":
        startDate = subMonths(now, 6);
        break;
      case "year":
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subDays(now, 30); // Default to month
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = calculateDateRange();
  
  // Fetch health metrics
  const { data: healthMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/health-metrics", user.id],
    queryFn: () => fetch(`/api/health-metrics/${user.id}`).then(res => res.json()),
  });
  
  // Fetch exercise logs
  const { data: exerciseLogs, isLoading: isLoadingExercise } = useQuery({
    queryKey: ["/api/exercise-logs", user.id],
    queryFn: () => fetch(`/api/exercise-logs/${user.id}`).then(res => res.json()),
  });
  
  // Fetch meals
  const { data: meals, isLoading: isLoadingMeals } = useQuery({
    queryKey: ["/api/meals", user.id],
    queryFn: () => fetch(`/api/meals/${user.id}`).then(res => res.json()),
  });

  // Process data for reports
  const processData = () => {
    if (!healthMetrics || !exerciseLogs || !meals) return null;
    
    // Filter data by date range
    const filterByDateRange = (items: any[], dateField: string) => {
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= startDate && itemDate <= endDate;
      });
    };
    
    const filteredMetrics = filterByDateRange(healthMetrics, "date");
    const filteredExercise = filterByDateRange(exerciseLogs, "date");
    const filteredMeals = filterByDateRange(meals, "date");
    
    // Weight progress over time
    const weightData = filteredMetrics
      .filter(metric => metric.type === "weight")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(metric => ({
        date: format(new Date(metric.date), "MMM dd"),
        weight: parseFloat(metric.value)
      }));
    
    // Blood pressure over time
    const bpData = filteredMetrics
      .filter(metric => metric.type === "blood_pressure")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(metric => {
        const bp = parseJSONSafely<{systolic: number, diastolic: number}>(
          metric.value, 
          {systolic: 0, diastolic: 0}
        );
        return {
          date: format(new Date(metric.date), "MMM dd"),
          systolic: bp.systolic,
          diastolic: bp.diastolic
        };
      });
    
    // Exercise statistics
    const exerciseByType = new Map<string, number>();
    filteredExercise.forEach(log => {
      const current = exerciseByType.get(log.type) || 0;
      exerciseByType.set(log.type, current + log.duration);
    });
    
    const exerciseTypeData = Array.from(exerciseByType.entries())
      .map(([type, minutes]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        minutes
      }));
    
    // Calories burned over time
    const caloriesBurnedData = filteredExercise
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc: any[], log) => {
        const date = format(new Date(log.date), "MMM dd");
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.calories += log.calories || 0;
        } else {
          acc.push({
            date,
            calories: log.calories || 0
          });
        }
        return acc;
      }, []);
    
    // Nutrition data
    const nutritionData = filteredMeals.reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, meal) => {
        acc.calories += meal.calories || 0;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fat += meal.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    const macrosDistribution = [
      { name: "Protein", value: nutritionData.protein },
      { name: "Carbs", value: nutritionData.carbs },
      { name: "Fat", value: nutritionData.fat },
    ];
    
    // Sleep statistics
    const sleepData = filteredMetrics
      .filter(metric => metric.type === "sleep")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(metric => ({
        date: format(new Date(metric.date), "MMM dd"),
        hours: parseFloat(metric.value)
      }));
    
    // Overall health index calculation (simplified example)
    const healthIndex = {
      weight: {
        value: weightData.length > 0 ? Math.min(100, 100 - Math.abs((weightData[weightData.length - 1]?.weight - user.targetWeight) / user.targetWeight * 100)) : 0,
        weight: 0.3
      },
      exercise: {
        value: filteredExercise.length > 0 ? Math.min(100, filteredExercise.reduce((sum, log) => sum + log.duration, 0) / (7 * 30) * 100) : 0,
        weight: 0.2
      },
      sleep: {
        value: sleepData.length > 0 ? Math.min(100, sleepData.reduce((sum, day) => sum + day.hours, 0) / (sleepData.length * user.targetSleep) * 100) : 0,
        weight: 0.2
      },
      nutrition: {
        value: nutritionData.protein > 0 ? Math.min(100, nutritionData.protein / (1.2 * user.targetWeight) * 100) : 0,
        weight: 0.3
      }
    };
    
    const overallHealthScore = Object.values(healthIndex).reduce(
      (score, category) => score + (category.value * category.weight), 
      0
    );
    
    return {
      weightData,
      bpData,
      exerciseTypeData,
      caloriesBurnedData,
      nutritionData,
      macrosDistribution,
      sleepData,
      healthIndex,
      overallHealthScore: Math.round(overallHealthScore)
    };
  };

  const reportData = processData();
  const isLoading = isLoadingMetrics || isLoadingExercise || isLoadingMeals;
  
  // Colors for charts
  const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <Layout title="Reports" user={user}>
      <div className="mb-6 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 items-start sm:items-center">
        <h1 className="text-2xl font-bold">Health Reports</h1>
        <div className="flex space-x-4 w-full sm:w-auto">
          <Select 
            value={reportType} 
            onValueChange={setReportType}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="exercise">Exercise</SelectItem>
              <SelectItem value="nutrition">Nutrition</SelectItem>
              <SelectItem value="sleep">Sleep</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Date Range */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing data from <span className="font-medium">{format(startDate, "MMMM d, yyyy")}</span> to <span className="font-medium">{format(endDate, "MMMM d, yyyy")}</span>
            </p>
            <Button variant="outline" size="sm">
              <span className="material-icons text-sm mr-2">file_download</span>
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="h-96 flex items-center justify-center">
            <p>Loading report data...</p>
          </CardContent>
        </Card>
      ) : !reportData ? (
        <Card>
          <CardContent className="h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="mb-4">No data available for the selected time period.</p>
              <p className="text-sm text-gray-500">Try selecting a different time range or add more health data.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Report */}
          {reportType === "overview" && (
            <>
              {/* Health Score */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle>Overall Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="relative inline-flex">
                        <svg className="w-32 h-32 md:w-40 md:h-40">
                          <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="58" cx="80" cy="80"/>
                          <circle 
                            className="text-primary-500" 
                            strokeWidth="10" 
                            stroke="currentColor" 
                            fill="transparent" 
                            r="58" 
                            cx="80" 
                            cy="80"
                            strokeDasharray="364.4" 
                            strokeDashoffset={364.4 - (364.4 * (reportData.overallHealthScore / 100))}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl md:text-4xl font-bold">{reportData.overallHealthScore}</span>
                          <span className="text-sm text-gray-500">out of 100</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 md:ml-8 max-w-lg">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Weight Management</span>
                            <span>{Math.round(reportData.healthIndex.weight.value)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary-500 h-full rounded-full" 
                              style={{ width: `${reportData.healthIndex.weight.value}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Physical Activity</span>
                            <span>{Math.round(reportData.healthIndex.exercise.value)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="bg-secondary-500 h-full rounded-full" 
                              style={{ width: `${reportData.healthIndex.exercise.value}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Sleep Quality</span>
                            <span>{Math.round(reportData.healthIndex.sleep.value)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full" 
                              style={{ width: `${reportData.healthIndex.sleep.value}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Nutrition</span>
                            <span>{Math.round(reportData.healthIndex.nutrition.value)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="bg-red-500 h-full rounded-full" 
                              style={{ width: `${reportData.healthIndex.nutrition.value}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Overview Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Weight Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {reportData.weightData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.weightData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} kg`, 'Weight']} />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#0ea5e9" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No weight data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Exercise Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {reportData.exerciseTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.exerciseTypeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} minutes`, 'Duration']} />
                          <Bar dataKey="minutes" fill="#14b8a6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No exercise data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Sleep Hours</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {reportData.sleepData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.sleepData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} hours`, 'Sleep']} />
                          <Line 
                            type="monotone" 
                            dataKey="hours" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No sleep data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Macro Nutrients</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {reportData.macrosDistribution.some(item => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.macrosDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {reportData.macrosDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}g`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No nutrition data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          {/* Weight Report */}
          {reportType === "weight" && reportData.weightData.length > 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weight Progress</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={reportData.weightData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[
                        Math.floor(Math.min(...reportData.weightData.map(d => d.weight)) - 2),
                        Math.ceil(Math.max(...reportData.weightData.map(d => d.weight)) + 2)
                      ]} />
                      <Tooltip formatter={(value) => [`${value} kg`, 'Weight']} />
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="weight" stroke="#0ea5e9" fill="url(#colorWeight)" />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#0ea5e9" 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                      />
                      {user.targetWeight && (
                        <Line 
                          type="monotone" 
                          dataKey={() => user.targetWeight} 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        >
                          <Label value="Target" position="right" />
                        </Line>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-primary-500 mb-2">straighten</span>
                      <h3 className="text-lg font-medium mb-1">Current Weight</h3>
                      <p className="text-3xl font-bold">
                        {reportData.weightData[reportData.weightData.length - 1]?.weight.toFixed(1)} kg
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-secondary-500 mb-2">trending_up</span>
                      <h3 className="text-lg font-medium mb-1">Weight Change</h3>
                      {reportData.weightData.length > 1 && (
                        <p className="text-3xl font-bold">
                          {(reportData.weightData[reportData.weightData.length - 1]?.weight - 
                            reportData.weightData[0]?.weight).toFixed(1)} kg
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-amber-500 mb-2">flag</span>
                      <h3 className="text-lg font-medium mb-1">Target Weight</h3>
                      <p className="text-3xl font-bold">
                        {user.targetWeight ? `${user.targetWeight} kg` : "Not set"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Exercise Report */}
          {reportType === "exercise" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Exercise Activity</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {reportData.caloriesBurnedData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.caloriesBurnedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} calories`, 'Burned']} />
                        <Bar dataKey="calories" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No exercise data available for the selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Exercise Types</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {reportData.exerciseTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.exerciseTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="minutes"
                            nameKey="type"
                            label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {reportData.exerciseTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} minutes`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No exercise data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Exercise Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="material-icons text-2xl text-primary-500 mr-3">timer</span>
                          <div>
                            <h4 className="font-medium">Total Duration</h4>
                            <p className="text-sm text-gray-500">All exercises combined</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold">
                          {reportData.exerciseTypeData.reduce((sum, item) => sum + item.minutes, 0)} min
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="material-icons text-2xl text-secondary-500 mr-3">local_fire_department</span>
                          <div>
                            <h4 className="font-medium">Calories Burned</h4>
                            <p className="text-sm text-gray-500">Total estimation</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold">
                          {reportData.caloriesBurnedData.reduce((sum, item) => sum + item.calories, 0)}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="material-icons text-2xl text-amber-500 mr-3">calendar_today</span>
                          <div>
                            <h4 className="font-medium">Active Days</h4>
                            <p className="text-sm text-gray-500">Days with exercise</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold">
                          {new Set(reportData.caloriesBurnedData.map(item => item.date)).size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Nutrition Report */}
          {reportType === "nutrition" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Macronutrient Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {reportData.macrosDistribution.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.macrosDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value, percent }) => `${name}: ${value.toFixed(1)}g (${(percent * 100).toFixed(0)}%)`}
                        >
                          {reportData.macrosDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value.toFixed(1)}g`, '']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No nutrition data available for the selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-primary-500 mb-2">local_fire_department</span>
                      <h3 className="text-lg font-medium mb-1">Total Calories</h3>
                      <p className="text-3xl font-bold">
                        {reportData.nutritionData.calories.toFixed(0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-blue-500 mb-2">fitness_center</span>
                      <h3 className="text-lg font-medium mb-1">Protein</h3>
                      <p className="text-3xl font-bold">
                        {reportData.nutritionData.protein.toFixed(1)}g
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-teal-500 mb-2">grain</span>
                      <h3 className="text-lg font-medium mb-1">Carbs</h3>
                      <p className="text-3xl font-bold">
                        {reportData.nutritionData.carbs.toFixed(1)}g
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-amber-500 mb-2">water_drop</span>
                      <h3 className="text-lg font-medium mb-1">Fat</h3>
                      <p className="text-3xl font-bold">
                        {reportData.nutritionData.fat.toFixed(1)}g
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Sleep Report */}
          {reportType === "sleep" && reportData.sleepData.length > 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sleep Duration</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={reportData.sleepData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, Math.max(Math.ceil(Math.max(...reportData.sleepData.map(d => d.hours))), 10)]} />
                      <Tooltip formatter={(value) => [`${value} hours`, 'Sleep']} />
                      <defs>
                        <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fill="url(#colorSleep)" />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#8b5cf6" 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                      />
                      {user.targetSleep && (
                        <Line 
                          type="monotone" 
                          dataKey={() => user.targetSleep} 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        >
                          <Label value="Target" position="right" />
                        </Line>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-indigo-500 mb-2">bedtime</span>
                      <h3 className="text-lg font-medium mb-1">Average Sleep</h3>
                      <p className="text-3xl font-bold">
                        {(reportData.sleepData.reduce((sum, day) => sum + day.hours, 0) / reportData.sleepData.length).toFixed(1)} hrs
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-green-500 mb-2">thumb_up</span>
                      <h3 className="text-lg font-medium mb-1">Best Sleep</h3>
                      <p className="text-3xl font-bold">
                        {Math.max(...reportData.sleepData.map(d => d.hours)).toFixed(1)} hrs
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="material-icons text-4xl text-amber-500 mb-2">flag</span>
                      <h3 className="text-lg font-medium mb-1">Sleep Goal</h3>
                      <p className="text-3xl font-bold">
                        {user.targetSleep ? `${user.targetSleep} hrs` : "Not set"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
