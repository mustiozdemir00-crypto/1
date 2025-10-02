import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, Settings, LogOut, Plus, Scissors, DollarSign, TrendingUp } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'reservations',
      label: 'Reservations',
      icon: Calendar,
      permission: 'reservations'
    },
    {
      id: 'new-reservation',
      label: 'New Reservation',
      icon: Plus,
      permission: 'reservations'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      permission: 'reservations'
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: Users,
      permission: 'staff'
    },
    {
      id: 'economics',
      label: 'Economics',
      icon: DollarSign,
      permission: 'economics'
    }
  ];

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) || user?.role === 'admin';
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 shadow-lg border-r border-orange-900">
      <div className="p-6 border-b border-orange-900">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <img 
              src="/mustimus.png"
              alt="Krampus Tattoo Logo" 
              className="w-12 h-12"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Krampus Tattoo</h2>
            <p className="text-sm text-white">Management Portal</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            if (!hasPermission(item.permission)) return null;
            
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
                    : 'text-white hover:bg-gray-700 hover:text-yellow-300'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-orange-900">
        <div className="mb-4">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-yellow-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-orange-400 hover:bg-orange-900/20 rounded-lg transition-colors"
          className="w-full flex items-center space-x-3 px-4 py-3 text-yellow-400 hover:bg-yellow-600/20 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};