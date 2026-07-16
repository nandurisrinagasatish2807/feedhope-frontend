import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './index.css';

function AppContent() {
  const [campaigns, setCampaigns] = useState([]);
  const [donorProfile, setDonorProfile] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load persistent user data context out of browser cache memory on app boot
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
  });

  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // 1. Navigation Proxy: Map old single-page state triggers directly to browser history paths
  const setViewProxy = (targetView) => {
    if (targetView === 'dashboard') navigate('/dashboard');
    else if (targetView === 'login') navigate('/login');
    else if (targetView === 'register') navigate('/register');
    else navigate('/');
  };

  // 2. Stripe Checkout Parameter Listener: Parses address bar tokens on return landing
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      alert('🏆 Thank you for your contribution! Your donation was processed successfully.');
      searchParams.delete('payment');
      setSearchParams(searchParams);
    } else if (paymentStatus === 'cancel') {
      alert('❌ Transaction canceled. Your payment method was not charged.');
      searchParams.delete('payment');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // 3. Automated REST API Pipeline Integration: Triggers seamlessly when auth token validates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const fetchCampaigns = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/v1/campaigns');
        setCampaigns(response.data.data.content);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      }
    };

    const fetchProfile = async () => {
      if (!user.id) return;
      try {
        const response = await axios.get('http://localhost:8080/api/v1/donors/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDonorProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchCampaigns();
    fetchProfile();
  }, [user]);

  const handleDonate = async (campaignId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please log in again.");
      setViewProxy('login');
      return;
    }

    const inputAmount = prompt("Enter your donation amount ($):", "25");
    if (!inputAmount) return;

    const amountInCents = Math.round(parseFloat(inputAmount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    const selectedCampaign = campaigns.find(c => c.id === campaignId);
    const campaignTitle = selectedCampaign ? selectedCampaign.title : "Community Support Drive";

    try {
      const response = await axios.post('http://localhost:8080/api/v1/payments/create-checkout-session', {
        campaignId: campaignId,
        amount: amountInCents,
        campaignTitle: campaignTitle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.sessionUrl) {
        window.location.href = response.data.sessionUrl;
      } else {
        alert("Failed to initialize secure transaction pipeline with payment handler.");
      }
    } catch (error) {
      console.error("Donation initialization failed:", error);
      alert("Payment processing failed: " + (error.response?.data?.error || error.message));
    }
  };

  const handleRegisterClick = (selectedRole) => {
    setRole(selectedRole);
    setFormData({ name: '', email: '', password: '' });
    setViewProxy('register');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    const cleanName = formData.name.trim();
    const spaceIndex = cleanName.indexOf(' ');
    let firstName = cleanName;
    let lastName = 'User';

    if (spaceIndex !== -1) {
      firstName = cleanName.substring(0, spaceIndex);
      lastName = cleanName.substring(spaceIndex + 1).trim() || 'User';
    }

    try {
      await axios.post('http://localhost:8080/api/v1/auth/register', {
        firstName,
        lastName,
        email: formData.email.trim(),
        password: formData.password,
        phone: "",
        role: role
      });
      alert('Registration Successful! Please log in.');
      setFormData({ name: '', email: '', password: '' });
      setViewProxy('login');
    } catch (error) {
      alert(`Registration failed: ${error.response?.data?.message || 'Error occurred.'}`);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      });

      localStorage.setItem('token', response.data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      setUser(response.data.data.user);
      alert('Login Successful!');
      setViewProxy('dashboard');
    } catch (error) {
      alert('Login failed: Invalid credentials.');
    }
  };

  return (
    <Routes>
      {/* 🏠 Account Selection Landing Path Route */}
      <Route
        path="/"
        element={
          !user ? (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
              <div className="text-center mb-10">
                <h1 className="text-6xl font-black mb-2 tracking-tight">
                  Feed<span className="text-blue-600">Hope</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium">Choose your account type to get started</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-blue-500 transition-all group flex flex-col items-center text-center">
                  <div className="bg-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6">
                    <span className="text-4xl">🎁</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Individual Donor</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">Donate items and earn rewards from local partners.</p>
                  <button onClick={() => handleRegisterClick('DONOR')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-100">
                    Register as Donor
                  </button>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-green-500 transition-all group flex flex-col items-center text-center">
                  <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mb-6">
                    <span className="text-4xl">🏢</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Organization</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">Manage donations and verify impact in your community.</p>
                  <button onClick={() => handleRegisterClick('ORGANIZATION')} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-100">
                    Register as NGO
                  </button>
                </div>
              </div>

              <p className="mt-10 text-slate-500 font-medium">
                Returning user? <button onClick={() => setViewProxy('login')} className="text-blue-600 font-bold hover:underline">Sign in to your account</button>
              </p>
            </div>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* 🔐 Login Routing Map */}
      <Route
        path="/login"
        element={
          !user ? (
            <Login
              formData={formData}
              setFormData={setFormData}
              handleLoginSubmit={handleLoginSubmit}
              setView={setViewProxy}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* 📝 Registration Routing Map */}
      <Route
        path="/register"
        element={
          !user ? (
            <Register
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleRegisterSubmit}
              role={role}
              setView={setViewProxy}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* 🛡️ Protected Dashboard Route Guard Architecture */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard
              campaigns={campaigns}
              donorProfile={donorProfile}
              user={user}
              setView={setViewProxy}
              setUser={setUser}
              handleDonate={handleDonate}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 🔍 Fallback Catch-All Route Guard Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}