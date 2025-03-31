import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/profile", label: "Profile", icon: "account_circle" },
    { href: "/metrics", label: "Health Metrics", icon: "monitor_heart" },
    { href: "/medications", label: "Medications", icon: "medication" },
    { href: "/exercise", label: "Exercise", icon: "fitness_center" },
    { href: "/nutrition", label: "Nutrition", icon: "restaurant" },
    { href: "/sleep", label: "Sleep", icon: "bedtime" },
    { href: "/goals", label: "Goals", icon: "flag" },
    { href: "/appointments", label: "Appointments", icon: "calendar_today" },
    { href: "/reports", label: "Reports", icon: "insights" },
  ];

  return (
    <aside className={cn("hidden md:flex md:flex-col md:w-64 bg-white shadow-md z-10", className)}>
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-primary-600 flex items-center">
          <span className="material-icons mr-2">favorite</span>
          HealthSync
        </h1>
      </div>

      <div className="flex flex-col flex-grow p-4 overflow-auto">
        <div className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg transition-all",
                location === item.href 
                  ? "text-primary-700 bg-primary-50" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span className="material-icons mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="px-4 py-3 bg-secondary-50 rounded-lg">
            <div className="flex items-center">
              <span className="material-icons text-secondary-600 mr-3">health_and_safety</span>
              <div>
                <h3 className="text-sm font-medium text-secondary-700">Premium Health</h3>
                <p className="text-xs text-secondary-600">Active until Dec 2023</p>
              </div>
            </div>
          </div>
          <Link href="/settings" className="flex items-center px-4 py-3 mt-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <span className="material-icons mr-3">settings</span>
            Settings
          </Link>
          <a href="#" className="flex items-center px-4 py-3 mt-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <span className="material-icons mr-3">help</span>
            Help & Support
          </a>
        </div>
      </div>
    </aside>
  );
}
