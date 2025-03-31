import React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  background?: string;
  foreground?: string;
  label?: React.ReactNode;
  strokeLinecap?: "round" | "butt" | "square";
}

export function ProgressRing({
  progress,
  size = 150,
  strokeWidth = 10,
  className,
  background = "#e2e8f0", // Default light gray
  foreground = "#0ea5e9", // Default primary blue
  label,
  strokeLinecap = "round"
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress * circumference) / 100;
  const offset = circumference - dash;

  return (
    <div className={cn("relative", className)}>
      <svg
        className="progress-ring -rotate-90 transform"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          stroke={background}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={foreground}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap={strokeLinecap}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label}
        </div>
      )}
    </div>
  );
}
