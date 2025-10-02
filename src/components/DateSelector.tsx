import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  required?: boolean;
  minDate?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ 
  value, 
  onChange, 
  className = '',
  required = false,
  minDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the current value or use today as default
  const selectedDate = value ? new Date(value) : null;
  const today = new Date();
  const minDateObj = minDate ? new Date(minDate) : today;

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isDateDisabled = (date: Date) => {
    return date < minDateObj;
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && 
           date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-left flex items-center justify-between ${className}`}
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(selectedDate)}
        </span>
        <Calendar className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">{monthYear}</h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="h-10" />;
              }

              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const todayDate = isToday(date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={`h-10 w-10 rounded-lg text-sm font-medium transition-all ${
                    disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : selected
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold'
                      : todayDate
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleDateSelect(today)}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};