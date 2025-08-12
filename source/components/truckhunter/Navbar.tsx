'use client';

import React, { useState, useRef, useEffect } from 'react';

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = '' }: NavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    console.log('Logout clicked');
    setShowDropdown(false);
  };

  return (
    <nav className={`fixed top-0 z-50 w-full bg-[#152C5B] h-14 ${className}`}>
      <div className="container flex h-full max-w-screen-2xl items-center justify-between px-4">
        {/* Left side - Truck Hunter button */}
        <a href="#" className="bg-white rounded-full py-1 px-4 flex items-center space-x-2">
          {/* Truck icon */}
          <div className="w-6 h-6 rounded-full border border-[#152C5B] flex items-center justify-center">
            <img src="/TruckTrailer.svg" alt="Truck" className="w-4 h-4" />
          </div>
          <span className="text-[#152C5B] font-medium">Truck Hunter</span>
        </a>

        {/* Center - Logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
        </div>

        {/* Right side - User Profile button with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleProfileClick}
            className="bg-white rounded-full py-1 px-4 flex items-center space-x-2"
          >
            <span className="text-[#152C5B] font-medium">Fleet Manager</span>
            <div className="w-6 h-6 rounded-full border border-[#152C5B] flex items-center justify-center">
              <img src="/user.svg" alt="User" className="w-4 h-4" />
            </div>
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Fleet Manager</p>
              </div>
              <a 
                href="#" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setShowDropdown(false)}
              >
                <img src="/settings.svg" alt="Settings" className="h-4 w-4 mr-2 text-gray-500" />
                Profile settings
              </a>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <img src="/logout.svg" alt="Logout" className="h-4 w-4 mr-2 text-gray-500" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}