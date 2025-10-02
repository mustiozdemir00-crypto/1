import React from 'react';
import { Clock } from 'lucide-react';

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
  required?: boolean;
}

// Function to get the nearest 15-minute interval
const getNearestFifteenMinuteInterval = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();
  
  // Round to nearest 15-minute interval
  const roundedMinutes = Math.round(minutes / 15) * 15;
  
  // Handle minute overflow (e.g., 60 minutes becomes next hour)
  if (roundedMinutes === 60) {
    return `${(hours + 1).toString().padStart(2, '0')}:00`;
  }
  
  return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
};
export const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  value, 
  onChange, 
  className = '',
  required = false 
}) => {
  // Auto-set to nearest 15-minute interval if no value is provided
  React.useEffect(() => {
    if (!value) {
      const nearestTime = getNearestFifteenMinuteInterval();
      onChange(nearestTime);
    }
  }, [value, onChange]);

  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors appearance-none pr-10 ${className}`}
        required={required}
      >
        <option value="">Select time</option>
        {timeOptions.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
    </div>
  );
};