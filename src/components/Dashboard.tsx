import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigation } from './Navigation';
import { NewReservation } from './NewReservation';
import { ViewReservations } from './ViewReservations';
import { StaffManagement } from './StaffManagement';
import { Economics } from './Economics';
import { ReservationAnalytics } from './ReservationAnalytics';
import { EmailViewer } from './EmailViewer';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reservations');
  const { user } = useAuth();

  // Test function for daily summary (for development/testing)
  const testDailySummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-reservation-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Daily summary sent successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing daily summary:', error);
      alert('Error sending daily summary');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'new-reservation':
        return <NewReservation onReservationCreated={() => setActiveTab('reservations')} />;
      case 'reservations':
        return <ViewReservations />;
      case 'analytics':
        return <ReservationAnalytics />;
      case 'staff':
        return <StaffManagement />;
      case 'economics':
        return <Economics />;
      case 'emails':
        return <EmailViewer />;
      default:
        return <ViewReservations />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 ml-64 bg-gray-100">
        <div className="p-8 min-h-screen">
          {/* Test button for daily summary - only show for admin users */}
          {user?.role === 'admin' && (
            <div className="mb-4">
              <button
                onClick={testDailySummary}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold text-sm flex items-center space-x-2 shadow-md"
              >
                <span>📊 Send Daily Reservations</span>
              </button>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};