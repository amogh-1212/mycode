import React, { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";

interface HeaderProps {
  title: string;
  user: User;
  onToggleMobileMenu: () => void;
  className?: string;
}

export function Header({ title, user, onToggleMobileMenu, className }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className={cn("bg-white shadow-sm z-10", className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 mr-2 text-gray-600 rounded-md hover:bg-gray-100"
          >
            <span className="material-icons">menu</span>
          </button>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-600 rounded-full hover:bg-gray-100 relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
          <div className="relative">
            <button 
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <img 
                className="w-8 h-8 rounded-full" 
                src={user.profilePicture || "https://via.placeholder.com/40"} 
                alt="User profile" 
              />
              <span className="text-sm font-medium hidden md:block">{user.firstName} {user.lastName}</span>
              <span className="material-icons text-gray-500 hidden md:block">
                {userMenuOpen ? "arrow_drop_up" : "arrow_drop_down"}
              </span>
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-20">
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Your Profile
                </Link>
                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
