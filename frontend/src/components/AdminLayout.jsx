import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  MessageSquare, 
  LogOut,
  Stethoscope
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const SidebarLink = ({ to, icon: Icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
      isActive 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    )}
  >
    <Icon className="h-5 w-5" />
    <span className="font-medium">{children}</span>
  </NavLink>
);

const AdminLayout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col hidden lg:flex">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">AI Clinic</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink to="/" icon={LayoutDashboard}>Dashboard</SidebarLink>
          <SidebarLink to="/patients" icon={Users}>Patients</SidebarLink>
          <SidebarLink to="/bot-settings" icon={MessageSquare}>WhatsApp Bot</SidebarLink>
          <SidebarLink to="/settings" icon={Settings}>Settings</SidebarLink>
        </nav>

        <div className="pt-6 mt-6 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
