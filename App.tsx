
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import axios from 'axios';
import Navigation from './components/Navigation';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import CitizenDashboard from './components/Citizen/Dashboard';
import LodgeComplaint from './components/Citizen/LodgeComplaint';
import ComplaintTracking from './components/Citizen/ComplaintTracking';
import ComplaintDetails from './components/Citizen/ComplaintDetails';
import Profile from './components/Citizen/Profile';
import AdminDashboard from './components/Admin/Dashboard';
import ComplaintManagement from './components/Admin/ComplaintManagement';
import AdminComplaintDetails from './components/Admin/ComplaintDetails';
import Analytics from './components/Admin/Analytics';
import DepartmentManagement from './components/Admin/DepartmentManagement';
import ManageOfficers from './components/Admin/ManageOfficers';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('sns_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sns_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sns_user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('sns_user', JSON.stringify(updatedUser));
  };

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isAuthPage && !isLandingPage && user && <Navigation user={user} onLogout={handleLogout} />}

      <main className={`flex-grow ${(!isAuthPage && !isLandingPage) ? 'container mx-auto px-4 py-8' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Root Redirect */}
          <Route path="/" element={<LandingPage user={user} />} />

          {/* Citizen Routes */}
          <Route path="/citizen/dashboard" element={user && user.role === UserRole.CITIZEN ? <CitizenDashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/citizen/lodge" element={user && user.role === UserRole.CITIZEN ? <LodgeComplaint user={user} /> : <Navigate to="/" />} />
          <Route path="/citizen/track" element={user && user.role === UserRole.CITIZEN ? <ComplaintTracking user={user} /> : <Navigate to="/" />} />
          <Route path="/citizen/complaint/:id" element={user && user.role === UserRole.CITIZEN ? <ComplaintDetails /> : <Navigate to="/" />} />
          <Route path="/citizen/profile" element={user && user.role === UserRole.CITIZEN ? <Profile user={user} onUpdate={handleUpdateUser} /> : <Navigate to="/" />} />

          {/* Admin / Dept Head / Officer Routes */}
          <Route path="/admin/dashboard" element={user && user.role === UserRole.ADMIN ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin/complaints" element={user && (user.role === UserRole.ADMIN || user.role === UserRole.DEPT_HEAD || user.role === UserRole.OFFICER) ? <ComplaintManagement user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin/complaint/:id" element={user && (user.role === UserRole.ADMIN || user.role === UserRole.DEPT_HEAD || user.role === UserRole.OFFICER) ? <AdminComplaintDetails /> : <Navigate to="/login" />} />
          <Route path="/admin/departments" element={user && user.role === UserRole.ADMIN ? <DepartmentManagement user={user} /> : <Navigate to="/admin/dashboard" />} />
          <Route path="/admin/officers" element={user && user.role === UserRole.DEPT_HEAD ? <ManageOfficers user={user} /> : <Navigate to="/admin/dashboard" />} />
          <Route path="/admin/analytics" element={user && user.role === UserRole.ADMIN ? <Analytics /> : <Navigate to="/login" />} />
          <Route path="/admin/profile" element={user ? <Profile user={user} onUpdate={handleUpdateUser} /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!isAuthPage && (
        <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">
          <p>&copy; 2025 Smart Nagrik Seva (SNS). All rights reserved.</p>
        </footer>
      )}
    </div>
  );
};

export default App;
