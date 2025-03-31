import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTimeRemaining(targetTime: string): string {
  const now = new Date();
  const target = new Date();
  const [hours, minutes] = targetTime.split(':').map(Number);
  
  target.setHours(hours, minutes, 0, 0);
  
  if (target < now) {
    // If target time is in the past, set it to tomorrow
    target.setDate(target.getDate() + 1);
  }
  
  const diffMs = target.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHrs > 0) {
    return `${diffHrs}h ${diffMins}m`;
  } else {
    return `${diffMins}m`;
  }
}

export function calculateProgress(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

export function parseJSONSafely<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return fallback;
  }
}
