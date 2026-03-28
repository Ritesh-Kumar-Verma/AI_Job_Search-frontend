import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import JobFeed from './pages/JobFeed';
import Applications from './pages/Applications';
import ResumeUpload from './pages/ResumeUpload';
import Navigation from './components/Navigation';
import ChatBot from './components/ChatBot';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return token ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { token } = useAuth();
  const [externalFilters, setExternalFilters] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});

  
  const handleFiltersSuggested = useCallback((filters) => {
    console.log('[App] AI suggested filters:', filters);
    setExternalFilters(filters);
  }, []);

  
  const handleFiltersChange = useCallback((filters) => {
    setCurrentFilters(filters);
  }, []);

  return (
    <>
      {token && <Navigation />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <PrivateRoute>
              <JobFeed
                externalFilters={externalFilters}
                onFiltersChange={handleFiltersChange}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <PrivateRoute>
              <Applications />
            </PrivateRoute>
          }
        />
        <Route
          path="/resume"
          element={
            <PrivateRoute>
              <ResumeUpload />
            </PrivateRoute>
          }
        />
      </Routes>
      {token && (
        <ChatBot
          onFiltersSuggested={handleFiltersSuggested}
          currentFilters={currentFilters}
        />
      )}
    </>
  );
}

function App() {
  return (
    


    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>




  );
}

export default App;
