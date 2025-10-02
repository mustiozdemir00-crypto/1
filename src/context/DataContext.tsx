import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Reservation {
  id: string;
  reservationNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
  totalPrice: number;
  depositPaid: number;
  isPaid: boolean;
  depositPaidStatus: boolean;
  restPaidStatus: boolean;
  designImages?: string[];
  notes?: string;
  artistId?: string;
  createdAt?: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface DataContextType {
  reservations: Reservation[];
  staff: Staff[];
  loading: boolean;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => Promise<void>;
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  getArtists: () => Staff[];
  refreshReservations: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchReservations(), fetchStaff()]);
      setLoading(false);
    };

    initializeData();
  }, []);

  const addReservation = async (reservation: Omit<Reservation, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert([reservation])
        .select()
        .single();

      if (error) throw error;

      setReservations(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding reservation:', error);
      throw error;
    }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setReservations(prev =>
        prev.map(res => (res.id === id ? { ...res, ...updates } : res))
      );
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReservations(prev => prev.filter(res => res.id !== id));
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  };

  const getArtists = () => {
    return staff.filter(member => member.role === 'artist');
  };

  const refreshReservations = async () => {
    await fetchReservations();
  };

  return (
    <DataContext.Provider
      value={{
        reservations,
        staff,
        loading,
        addReservation,
        updateReservation,
        deleteReservation,
        getArtists,
        refreshReservations,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
