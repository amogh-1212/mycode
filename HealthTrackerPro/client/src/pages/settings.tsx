import React from "react";
import { Layout } from "@/components/ui/layout";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps) {
  return (
    <Layout title="Settings" user={user}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your application preferences</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="medication-reminders" className="font-medium">Medication Reminders</Label>
              <p className="text-sm text-gray-500">Receive reminders for your medications</p>
            </div>
            <Switch id="medication-reminders" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="appointment-reminders" className="font-medium">Appointment Reminders</Label>
              <p className="text-sm text-gray-500">Receive reminders for upcoming appointments</p>
            </div>
            <Switch id="appointment-reminders" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
              <p className="text-sm text-gray-500">Use dark mode for the application interface</p>
            </div>
            <Switch id="dark-mode" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-view" className="font-medium">Compact View</Label>
              <p className="text-sm text-gray-500">Show more content with a compact layout</p>
            </div>
            <Switch id="compact-view" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="data-sharing" className="font-medium">Data Sharing</Label>
              <p className="text-sm text-gray-500">Share anonymous health data for research</p>
            </div>
            <Switch id="data-sharing" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="activity-tracking" className="font-medium">Activity Tracking</Label>
              <p className="text-sm text-gray-500">Track your usage of the application</p>
            </div>
            <Switch id="activity-tracking" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}