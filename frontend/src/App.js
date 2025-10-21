import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ToastProvider from './components/common/ToastProvider';
import Loading from './components/common/Loading';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerDashboard from './components/dashboard/CustomerDashboard';
import ArchitectDashboard from './components/dashboard/ArchitectDashboard';
import ScrollToTop from './components/ScrollToTop';
import './styles/App.css';

// Home Page Component with auto-logout
function HomePage() {
  const { user, clearSession } = useAuth();

  useEffect(() => {
    // If user is logged in and visits the home page, clear the session
    if (user) {
      clearSession();
    }
  }, [user, clearSession]);

  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Contact />
    </>
  );
}

// Layout component that conditionally renders header and footer
function Layout({ children }) {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard/');

  return (
    <div className="App">
      <ScrollToTop />
      {!isDashboardRoute && <Header />}
      <main className={isDashboardRoute ? "dashboard-main" : "main-content"}>
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}

// Main App Content Component
function AppContent() {
  const { loading } = useAuth();

  // Show professional loading screen during auth initialization
  if (loading) {
    return (
      <Loading 
        fullScreen={true}
        type="buildbuddy"
        message="Initializing BuildBuddy..."
        size="large"
      />
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/dashboard/customer" 
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/architect" 
          element={
            <ProtectedRoute requiredRole="architect">
              <ArchitectDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;