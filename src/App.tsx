import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-200">
      {user ? (
        <Dashboard />
      ) : (
        <Login />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;