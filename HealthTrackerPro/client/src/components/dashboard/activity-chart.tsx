import React, { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ActivityChartProps {
  data: Array<{
    day: string;
    steps: number;
  }>;
}

export function ActivityChart({ data }: ActivityChartProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    if (timeRange === "week") {
      return data.slice(-7);
    } else if (timeRange === "month") {
      return data;
    } else {
      // For year view, we would aggregate by month
      // This is a simplified version
      return data;
    }
  };
  
  const filteredData = getFilteredData();
  
  return (
    <Card className="bg-white rounded-xl shadow-sm p-4">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold">Activity Overview</CardTitle>
          <div className="flex items-center">
            <button 
              className={`p-1 text-xs rounded border border-gray-200 mr-2 ${timeRange === 'week' ? 'bg-primary-50 text-primary-600' : ''}`}
              onClick={() => setTimeRange("week")}
            >
              Week
            </button>
            <button 
              className={`p-1 text-xs rounded border border-gray-200 mr-2 ${timeRange === 'month' ? 'bg-primary-50 text-primary-600' : ''}`}
              onClick={() => setTimeRange("month")}
            >
              Month
            </button>
            <button 
              className={`p-1 text-xs rounded border border-gray-200 ${timeRange === 'year' ? 'bg-primary-50 text-primary-600' : ''}`}
              onClick={() => setTimeRange("year")}
            >
              Year
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [`${value.toLocaleString()} steps`, 'Steps']}
                contentStyle={{ borderRadius: '0.375rem', border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
              />
              <Bar 
                dataKey="steps" 
                fill="#14b8a6" 
                radius={[5, 5, 0, 0]} 
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
