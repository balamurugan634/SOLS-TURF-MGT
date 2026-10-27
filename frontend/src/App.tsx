import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MandatoryPasswordChangeModal } from './components/MandatoryPasswordChangeModal';

import { HomePage } from './pages/HomePage';
import { TurfsListingPage } from './pages/TurfsListingPage';
import { TurfDetailPage } from './pages/TurfDetailPage';
import { CustomerBookingsPage } from './pages/CustomerBookingsPage';
import { LoginPage } from './pages/LoginPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
          <Navbar />
          <MandatoryPasswordChangeModal />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/turfs" element={<TurfsListingPage />} />
              <Route path="/turfs/:id" element={<TurfDetailPage />} />
              <Route path="/my-bookings" element={<CustomerBookingsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/owner" element={<OwnerDashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
