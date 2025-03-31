import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  target?: string;
  progress?: number;
  lastUpdated: string;
  onAddClick: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  trend = "flat",
  trendValue,
  target,
  progress = 0,
  lastUpdated,
  onAddClick,
  className
}: MetricCardProps) {
  const getTrendColor = () => {
    if (title === "Weight") {
      return trend === "down" ? "text-success-600" : "text-danger-600";
    }
    return trend === "up" ? "text-success-600" : trend === "down" ? "text-danger-600" : "text-gray-600";
  };

  const getTrendIcon = () => {
    if (trend === "up") return "trending_up";
    if (trend === "down") return "trending_down";
    return "trending_flat";
  };

  const getProgressColor = () => {
    if (progress >= 80) return "bg-success-500";
    if (progress >= 50) return "bg-primary-500";
    return "bg-amber-500";
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm overflow-hidden", className)}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {trend && trendValue && (
            <div className={cn("flex items-center text-sm", getTrendColor())}>
              <span className="material-icons text-sm mr-1">{getTrendIcon()}</span>
              {trendValue}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm text-gray-500 ml-1">{unit}</span>
          </div>
          {target && (
            <div className="text-xs text-gray-500">Target: {target}</div>
          )}
        </div>
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", getProgressColor())} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="bg-gray-50 p-3 flex justify-between items-center">
        <span className="text-xs text-gray-500">Last updated: {lastUpdated}</span>
        <button 
          className="text-primary-600 hover:text-primary-800"
          onClick={onAddClick}
        >
          <span className="material-icons text-sm">add_circle</span>
        </button>
      </div>
    </div>
  );
}

interface MetricsGridProps {
  metrics: {
    weight: MetricCardProps;
    bloodPressure: MetricCardProps;
    heartRate: MetricCardProps;
    sleep: MetricCardProps;
  };
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard {...metrics.weight} />
      <MetricCard {...metrics.bloodPressure} />
      <MetricCard {...metrics.heartRate} />
      <MetricCard {...metrics.sleep} />
    </div>
  );
}
