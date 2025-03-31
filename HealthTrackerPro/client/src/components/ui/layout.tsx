import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { User } from "@shared/schema";

interface LayoutProps {
  title: string;
  user: User;
  children: React.ReactNode;
}

export function Layout({ title, user, children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
          <div className="relative flex h-full w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={title} 
          user={user} 
          onToggleMobileMenu={toggleMobileMenu}
        />

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
