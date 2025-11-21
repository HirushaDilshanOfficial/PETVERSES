import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  CubeIcon,
  ChartBarIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

function Sidebar() {
  console.log("Sidebar - Rendering");
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Navigation menu items
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: HomeIcon
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: UserGroupIcon
    },
    {
      name: 'KYC Review',
      path: '/admin/kyc',
      icon: DocumentCheckIcon
    },
    {
      name: 'Inventory',
      path: '/admin/inventory',
      icon: CubeIcon
    },
    {
      name: 'Payments',
      path: '/admin/payments',
      icon: ChartBarIcon
    },
    {
      name: 'Analytics',
      path: '/admin/analytics',
      icon: ChartBarIcon
    },
    {
      name: 'Advertisements',
      path: '/admin/advertisements',
      icon: QuestionMarkCircleIcon
    },
    {
      name: 'Announcements',
      path: '/admin/announcements',
      icon: MegaphoneIcon
    },
    {
      name: 'FAQ Management',
      path: '/admin/faqs',
      icon: QuestionMarkCircleIcon
    },
    {
      name: 'Profile',
      path: '/admin/profile',
      icon: UserCircleIcon
    }
  ];

  // Check if current path matches menu item (also check for sub-routes)
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.sidebar-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-900 text-white rounded-lg shadow-lg hover:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        sidebar-container
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        bg-gradient-to-b from-blue-900 to-blue-800 
        text-white 
        w-64 
        min-h-screen 
        fixed 
        left-0 
        top-0 
        z-50 
        lg:z-40
        transition-all 
        duration-300 
        ease-in-out
        shadow-xl
        lg:shadow-none
      `}>
        
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block absolute -right-3 top-8 bg-orange-500 text-white rounded-full p-1 shadow-lg hover:bg-orange-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Logo Section */}
        <div className="p-6 border-b border-blue-700/50">
          <div className={`transition-all duration-300 ${isCollapsed ? 'lg:text-center' : ''}`}>
            <h1 className={`font-bold text-white transition-all duration-300 ${
              isCollapsed ? 'lg:text-lg' : 'text-2xl'
            }`}>
              {isCollapsed ? (
                <span className="hidden lg:block">PV</span>
              ) : (
                'PETVERSE'
              )}
              <span className="lg:hidden">PETVERSE</span>
            </h1>
            {!isCollapsed && (
              <p className="text-blue-200 text-sm mt-1 lg:block hidden">Admin Panel</p>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 pb-28 px-2">
          <ul className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      group
                      flex 
                      items-center 
                      mx-2
                      px-4 
                      py-4 
                      rounded-2xl 
                      transition-all 
                      duration-300 
                      relative
                      transform
                      hover:shadow-lg
                      ${active
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl scale-105 border border-orange-400/30' 
                        : 'text-blue-100 hover:bg-gradient-to-r hover:from-orange-500/90 hover:to-orange-600/90 hover:text-white hover:scale-105 hover:shadow-lg'
                      }
                      ${isCollapsed ? 'lg:justify-center lg:px-3 lg:mx-1' : ''}
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={`h-6 w-6 transition-all duration-200 ${
                      isCollapsed ? 'lg:mr-0' : 'mr-4'
                    }`} />
                    
                    <span className={`
                      font-medium 
                      text-sm
                      transition-all 
                      duration-300 
                      ${isCollapsed ? 'lg:hidden' : 'block'}
                    `}>
                      {item.name}
                    </span>

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="
                        hidden 
                        lg:block 
                        absolute 
                        left-full 
                        ml-2 
                        px-3 
                        py-2 
                        bg-gray-900 
                        text-white 
                        text-sm 
                        rounded-lg 
                        shadow-lg 
                        opacity-0 
                        group-hover:opacity-100 
                        transition-opacity 
                        duration-200 
                        pointer-events-none
                        whitespace-nowrap
                        z-50
                      ">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                      </div>
                    )}

                    {/* Active indicator */}
                    {active && (
                      <div className="absolute right-4 w-2.5 h-2.5 bg-white rounded-full opacity-90 shadow-sm" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-700/50 bg-gradient-to-t from-blue-800/30 to-transparent">
          <div className={`text-center text-blue-200 transition-all duration-300 ${
            isCollapsed ? 'lg:hidden' : ''
          }`}>
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-blue-100">PETVERSE Admin v1.0</p>
              <p className="text-xs opacity-75">© 2025 All rights reserved</p>
            </div>
          </div>
          
          {/* Collapsed state indicator */}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                PV
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Spacer for Desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`} />
    </>
  );
}

export default Sidebar;