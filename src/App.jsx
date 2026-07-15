import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [donorProfile, setDonorProfile] = useState(null);
  
  // 1. Persistent State Initialization: Read from localStorage on app boot
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
  });

  const [view, setView] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? 'dashboard' : 'selection';
  });

  const [role, setRole] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // 2. Stripe Redirect Handler: Catch URL query parameters from checkout redirect
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment') === 'success') {
      alert('🏆 Thank you for your contribution! Your donation was processed successfully.');
      // Clean up the URL string so the notification doesn't pop up again on manual refreshes
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (queryParams.get('payment') === 'cancel') {
      alert('❌ Transaction canceled. Your payment method was not charged.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 3. Keep localStorage clean when user explicitly logs out
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (view === 'dashboard') {
      const fetchCampaigns = async () => {
        try {
          const response = await axios.get('http://localhost:8080/api/v1/campaigns');
          setCampaigns(response.data.data.content);
        } catch (error) {
          console.error("Failed to fetch campaigns:", error);
        }
      };

      const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token || token === 'undefined' || token === 'null' || !user || !user.id) return;

        try {
          const response = await axios.get(`http://localhost:8080/api/v1/donors/profile/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDonorProfile(response.data);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      };
      
      fetchCampaigns();
      fetchProfile();
    }
  }, [view, user]);

  const handleDonate = async (campaignId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please log in again.");
      setView('login');
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
    setView('register');
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
      setView('login'); 
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
      
      // Sync access payload token AND user details to survival context
      localStorage.setItem('token', response.data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      setUser(response.data.data.user);
      alert('Login Successful!');
      setView('dashboard'); 
    } catch (error) {
      alert('Login failed: Invalid credentials.');
    }
  };

  if (view === 'dashboard') {
    return (
      <Dashboard 
        campaigns={campaigns} 
        donorProfile={donorProfile} 
        user={user} 
        setView={setView} 
        setUser={setUser} 
        handleDonate={handleDonate}
      />
    );
  }

  if (view === 'login') {
    return (
      <Login 
        formData={formData} 
        setFormData={setFormData} 
        handleLoginSubmit={handleLoginSubmit} 
        setView={setView}
      />
    );
  }

  if (view === 'register') {
    return (
      <Register 
        formData={formData} 
        setFormData={setFormData} 
        handleSubmit={handleRegisterSubmit} 
        role={role} 
        setView={setView}
      />
    );
  }

  return (
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
        Returning user? <button onClick={() => setView('login')} className="text-blue-600 font-bold hover:underline">Sign in to your account</button>
      </p>
    </div>
  );
}

export default App;