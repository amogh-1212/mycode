import React, { useState } from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface WeightTrendChartProps {
  data: Array<{
    date: string;
    weight: number;
  }>;
}

export function WeightTrendChart({ data }: WeightTrendChartProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    if (timeRange === "week") {
      return data.slice(-7);
    } else if (timeRange === "month") {
      return data.slice(-30);
    } else {
      return data;
    }
  };
  
  const filteredData = getFilteredData();
  
  return (
    <Card className="bg-white rounded-xl shadow-sm p-4">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold">Weight Trend</CardTitle>
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
            <LineChart
              data={filteredData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
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
                dataKey="weight" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                fill="url(#weightGradient)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
