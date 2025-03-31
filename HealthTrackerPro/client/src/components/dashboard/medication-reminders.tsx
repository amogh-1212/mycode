import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";

interface Medication {
  id: number;
  name: string;
  time: string;
  instructions: string;
  isUpcoming: boolean;
  taken: boolean;
}

interface MedicationRemindersProps {
  medications: Medication[];
  onAddMedication: () => void;
  onTakeMedication: (id: number) => void;
}

export function MedicationReminders({ medications, onAddMedication, onTakeMedication }: MedicationRemindersProps) {
  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-semibold">Medication Reminders</CardTitle>
          <button 
            className="text-primary-600 hover:text-primary-800"
            onClick={onAddMedication}
          >
            <span className="material-icons text-sm">add_circle</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {medications.map((med) => (
            <div 
              key={med.id}
              className={`flex items-center p-3 rounded-lg ${
                med.isUpcoming ? "bg-primary-50" : "bg-gray-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                med.isUpcoming ? "bg-primary-100" : "bg-gray-200"
              }`}>
                <span className={`material-icons ${
                  med.isUpcoming ? "text-primary-600" : "text-gray-500"
                }`}>medication</span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{med.name}</span>
                  <span className={`text-sm ${
                    med.isUpcoming ? "text-primary-700" : "text-gray-500"
                  }`}>{med.time}</span>
                </div>
                <p className="text-xs text-gray-500">{med.instructions}</p>
              </div>
              <button 
                className={`ml-2 p-1 ${
                  med.taken 
                    ? "text-primary-600 hover:text-primary-800" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => onTakeMedication(med.id)}
              >
                <span className="material-icons text-sm">
                  {med.taken ? "check_circle" : "check_circle_outline"}
                </span>
              </button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-3 text-center mt-auto">
        <Link href="/medications" className="text-primary-600 text-sm font-medium hover:text-primary-800 w-full">
          View All Medications
        </Link>
      </CardFooter>
    </Card>
  );
}
