import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GoalCreate from './pages/GoalCreate';
import GoalDetails from './pages/GoalDetails';
import { Loader2 } from 'lucide-react';
import './App.css';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// PrivateRoute Wrapper for Protecting Dashboard Pages
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-dark-accent animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Core Application Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/goals/new"
              element={
                <PrivateRoute>
                  <GoalCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/goals/:goalId"
              element={
                <PrivateRoute>
                  <GoalDetails />
                </PrivateRoute>
              }
            />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
