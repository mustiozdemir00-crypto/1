import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Users, Settings, LogOut, Plus, Scissors, DollarSign, TrendingUp, Mail } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

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
    },
    {
      id: 'emails',
      label: 'Company Mail',
      icon: Mail,
      permission: 'emails'
    }
  ];

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) || user?.role === 'admin';
  };

  useEffect(() => {
    if (hasPermission('emails')) {
      fetchUnreadCount();

      const emailsSubscription = supabase
        .channel('unread-emails')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'emails'
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        emailsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('is_archived', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl border-r border-gray-300">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-center">
          <img 
            src="/mustimus.png"
            alt="Krampus Tattoo Logo" 
            className="w-32 h-32"
          />
        </div>
      </div>

      <nav className="p-4 bg-gray-50 h-full">
        <div className="space-y-2">
          {navItems.map((item) => {
            if (!hasPermission(item.permission)) return null;
            
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all relative ${
                  activeTab === item.id
                    ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-red-600 hover:shadow-sm'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.id === 'emails' && unreadCount > 0 && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-300 bg-white">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-red-600 capitalize font-medium">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium hover:shadow-sm"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};