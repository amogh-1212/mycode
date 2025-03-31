import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";

interface Appointment {
  id: number;
  title: string;
  doctor: string;
  status: "confirmed" | "scheduled" | "cancelled" | "completed";
  date: Date;
  time: string;
  location: string;
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  onAddAppointment: () => void;
}

export function UpcomingAppointments({ appointments, onAddAppointment }: UpcomingAppointmentsProps) {
  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary-100 text-primary-800";
      case "scheduled":
        return "bg-gray-200 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };
  
  // Get appointment card bg color
  const getAppointmentCardClass = (status: string) => {
    return status === "confirmed" ? "bg-primary-50" : "bg-gray-50";
  };
  
  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-semibold">Upcoming Appointments</CardTitle>
          <button 
            className="text-primary-600 hover:text-primary-800"
            onClick={onAddAppointment}
          >
            <span className="material-icons text-sm">add_circle</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className={`p-3 rounded-lg ${getAppointmentCardClass(appointment.status)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{appointment.title}</h4>
                  <p className="text-xs text-gray-500">{appointment.doctor}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-600">
                <span className="material-icons text-sm mr-1">calendar_today</span>
                {format(appointment.date, "MMMM d, yyyy")}
              </div>
              <div className="flex items-center mt-1 text-xs text-gray-600">
                <span className="material-icons text-sm mr-1">schedule</span>
                {appointment.time}
              </div>
              <div className="flex items-center mt-1 text-xs text-gray-600">
                <span className="material-icons text-sm mr-1">location_on</span>
                {appointment.location}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-3 text-center">
        <Link href="/appointments" className="text-primary-600 text-sm font-medium hover:text-primary-800 w-full">
          View All Appointments
        </Link>
      </CardFooter>
    </Card>
  );
}
