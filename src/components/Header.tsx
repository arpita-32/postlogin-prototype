import React, { useState } from "react";
import { Menu, Bell, User, LogOut, ChevronDown } from "lucide-react";

interface HeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
  // Legacy backward-compatibility props
  onToggleSidebar?: () => void;
  unreadNotifications?: number;
}

export function Header({
  isCollapsed = false,
  onToggleCollapse,
  onLogout = () => {},
  onToggleSidebar,
  unreadNotifications = 0,
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse();
    else if (onToggleSidebar) onToggleSidebar();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[73px] bg-white z-50 shadow-xs border-b border-gray-100">
      
      {/* Orange Bottom Border */}
      <div 
        className={`absolute bottom-0 right-0 h-[3px] bg-[#fc8036] transition-all duration-300 ease-in-out ${
          isCollapsed ? 'left-[132px]' : 'left-[325px]'
        }`} 
      />

      <div className="flex h-full">

        {/* Left Orange Section with transition matching sidebar */}
        <div 
          className={`relative h-full bg-[#fc8036] flex items-center px-6 transition-all duration-300 ease-in-out select-none ${
            isCollapsed ? 'w-[149px]' : 'w-[340px]'
          }`}
          id="header-brand-section"
        >
          {/* Inner content wrapper, excluding the 85px white curve on the right */}
          <div className="flex-1 h-full flex items-center justify-between pr-[85px] overflow-visible">
            {!isCollapsed ? (
              <>
                {/* BoB Logo */}
                <div className="flex items-center space-x-2">
                  <img
                    src="/bbps_logo (1).png"
                    alt="Bank of Baroda"
                    className="h-[95px] w-auto object-contain flex-shrink-0 z-10"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden text-white font-extrabold tracking-tight text-sm">
                    Bank of Baroda
                  </div>
                </div>
                
                {/* Hamburger */}
                <button
                  onClick={handleToggle}
                  className="p-1.5 hover:bg-orange-600 rounded transition-colors text-black focus:outline-none cursor-pointer"
                  title="Collapse menu"
                >
                  <Menu className="w-8 h-8 text-black" />
                </button>
              </>
            ) : (
              <div className="w-full flex justify-center">
                {/* Hamburger centered when collapsed */}
                <button
                  onClick={handleToggle}
                  className="p-1.5 hover:bg-orange-600 rounded transition-colors text-black focus:outline-none cursor-pointer"
                  title="Expand menu"
                >
                  <Menu className="w-8 h-8 text-black" />
                </button>
              </div>
            )}
          </div>

          {/* White Curve */}
          <div className="absolute right-0 top-0 h-full w-[55px] bg-white rounded-tl-[25px] rounded-bl-[35px]" />
        </div>

        {/* Right White Section */}
        <div className="flex-1 flex justify-end items-center px-10">

          {/* Bharat Connect Logo */}
          <div className="flex items-center mr-10">
            <img
              src="/bharat_connect.png"
              alt="Bharat Connect"
              className="h-[42px] object-contain"
              onError={(e) => {
                // Render elegant SVG/styled logo fallback if image asset is not available
                (e.currentTarget as HTMLElement).style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
              <div className="flex flex-col items-center justify-center font-black text-blue-900 leading-none text-xs">
                <div className="flex items-center">
                  <span className="text-[#004B87] font-extrabold text-sm">Bharat</span>
                  <span className="w-1.5 h-1.5 bg-[#fc8036] rounded-full ml-0.5"></span>
                </div>
                <span className="text-[#fc8036] font-bold text-[10px] tracking-wider uppercase">Connect</span>
              </div>
              <div className="w-5 h-5 bg-[#004B87] text-white font-black text-[10px] flex items-center justify-center rounded-xs ml-1">
                B
              </div>
            </div>
          </div>

          {/* Notification */}
          <div className="relative mr-8">
            <Bell className="w-7 h-7 text-[#fc8036] cursor-pointer hover:opacity-80 transition-opacity" />

            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center border-2 border-white">
              {unreadNotifications}
            </span>
          </div>

          {/* Profile */}
          <div className="relative flex items-center">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1 p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer focus:outline-none"
              id="user-profile-menu-button"
            >
              <User className="w-8 h-8 text-[#fc8036]" />
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown on click outside */}
                <div 
                  className="fixed inset-0 z-10 cursor-default" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div 
                  className="absolute right-0 top-12 bg-white border border-gray-200 rounded shadow-lg py-2 w-48 z-20 animate-in fade-in slide-in-from-top-2 duration-150"
                  id="user-dropdown-menu"
                >
                  <div className="px-4 py-2 border-b border-gray-100 select-none">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Logged in as</p>
                    <p className="text-xs font-bold text-gray-700 truncate">Arpita Sundaray</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors font-semibold focus:outline-none cursor-pointer"
                    id="dropdown-logout-button"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}

            <div className="h-8 border-r border-gray-300 ml-5" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
