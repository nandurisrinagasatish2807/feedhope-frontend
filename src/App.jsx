import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './index.css'

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [donorProfile, setDonorProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('selection');
  const [role, setRole] = useState('');
  
  // State for Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

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
        if (!token || token === 'undefined' || token === 'null' || !user || !user.id) {
          console.warn("No token or user found, skipping fetchProfile");
          return;
        }

        try {
          const response = await axios.get(`http://localhost:8080/api/v1/donors/profile/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
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

  // 💳 New Stripe Payment Intent Handler
  const handleDonate = async (campaignId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please log in again.");
      setView('login');
      return;
    }

    const inputAmount = prompt("Enter your donation amount ($):", "25");
    if (!inputAmount || isNaN(inputAmount) || parseFloat(inputAmount) <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    try {
      // Points exactly to your native backend DonationController.java endpoint matching CreateDonationRequest parameters
      const response = await axios.post('http://localhost:8080/api/v1/donations/create-intent', {
        campaignId: campaignId,
        amount: parseFloat(inputAmount),
        currency: "USD"
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Safely read the generated transaction details
      const donationData = response.data.data;
      
      if (donationData && donationData.status === "PENDING") {
        alert(`Payment Intent Staged Successfully!\nDonation ID: ${donationData.id}\nStatus: ${donationData.status}\n\nSimulating local card swipe clearance mechanism...`);
        
        // Simulating immediate payment completion on your screen
        if (view === 'dashboard') {
          setView('selection');
          setTimeout(() => setView('dashboard'), 100);
        }
      } else {
        alert("Failed to initialize transaction pipeline securely.");
      }

    } catch (error) {
      console.error("Donation initialization failed:", error);
      alert("Payment processing failed: " + (error.response?.data?.message || error.message));
    }
  };

  const handleRegisterClick = (selectedRole) => {
    setRole(selectedRole);
    setFormData({ name: '', email: '', password: '' }); 
    setView('register');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      alert('Password validation error: Must be at least 8 characters long.');
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

    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: formData.email.trim(),
      password: formData.password,
      phone: "" 
    };

    try {
      await axios.post('http://localhost:8080/api/v1/auth/register', payload);
      alert('Registration Successful! Please log in.');
      setFormData({ name: '', email: '', password: '' }); 
      setView('login'); 
    } catch (error) {
      console.log("Backend Error Details:", error.response?.data);
      const serverMessage = error.response?.data?.message || 'Check console logs for details.';
      alert(`Registration failed: ${serverMessage}`);
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
      setUser(response.data.data.user);
      alert('Login Successful!');
      setView('dashboard'); 
    } catch (error) {
      alert('Login failed: Invalid credentials.');
    }
  };

  // --- DASHBOARD VIEW ---
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <nav className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black tracking-tight">Feed<span className="text-blue-600">Hope</span></h1>
          <button onClick={() => { setView('selection'); setUser(null); localStorage.removeItem('token'); }} className="bg-slate-200 px-6 py-2 rounded-xl font-bold hover:bg-slate-300">Log Out</button>
        </nav>
        
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-8 text-slate-900">Welcome back, {user?.firstName || 'User'}!</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-blue-50">
              <p className="text-slate-500 font-bold mb-2 uppercase text-xs tracking-widest">Total Impact</p>
              <h3 className="text-5xl font-black text-blue-600">{donorProfile ? donorProfile.totalMealsFunded : '0'}</h3>
              <p className="text-slate-400 mt-2 font-medium">Meals Provided</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-green-50">
              <p className="text-slate-500 font-bold mb-2 uppercase text-xs tracking-widest">Hope Points</p>
              <h3 className="text-5xl font-black text-green-600">{donorProfile ? donorProfile.totalMealsFunded * 10 : 0}</h3>
              <p className="text-slate-400 mt-2 font-medium">Earned this month</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-orange-50">
              <p className="text-slate-500 font-bold mb-2 uppercase text-xs tracking-widest">Rank</p>
              <h3 className="text-5xl font-black text-orange-500">#4</h3>
              <p className="text-slate-400 mt-2 font-medium">In Richardson area</p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
            <h4 className="text-2xl font-bold mb-6">Active Campaigns</h4>
            <div className="space-y-4">
              {campaigns && campaigns.length > 0 ? (
                campaigns.map((campaign, index) => (
                  <div key={index} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl">
                    <div>
                      <h5 className="font-bold text-lg text-slate-800">{campaign.title}</h5>
                      <p className="text-slate-500">{campaign.description}</p>
                      <p className="text-sm font-medium text-slate-600 mt-2">
                        Raised: ${campaign.raisedAmount || 0} / Goal: ${campaign.goalAmount}
                      </p>
                    </div>
                    {/* ⚡ Wire up the functional click event listener handler */}
                    <button 
                      onClick={() => handleDonate(campaign.id)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95 hover:bg-blue-700"
                    >
                      Donate Now
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No active campaigns available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
          <button onClick={() => setView('selection')} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2">
            ← Back
          </button>
          <h2 className="text-3xl font-black mb-2 text-blue-600">Login</h2>
          <p className="text-slate-500 mb-8 font-medium">Welcome back to FeedHope</p>
          
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="name@email.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="••••••••"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full py-4 rounded-2xl font-bold text-white text-lg mt-4 shadow-lg bg-blue-600 shadow-blue-100 transition-transform active:scale-95">
              Sign In
            </button>
          </form>
          <p className="mt-6 text-center text-slate-500 font-medium text-sm">
            Don't have an account? <button onClick={() => setView('selection')} className="text-blue-600 font-bold hover:underline">Register</button>
          </p>
        </div>
      </div>
    );
  }

  // --- REGISTER VIEW ---
  if (view === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
          <button onClick={() => setView('selection')} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2">
            ← Back
          </button>
          <h2 className="text-3xl font-black mb-2 text-slate-900">Create Account</h2>
          <p className="text-slate-500 mb-8 font-medium">Register as a <span className={role === 'DONOR' ? 'text-blue-600' : 'text-green-600'}>{role}</span></p>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Enter your name"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="name@email.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password (Min 8 Characters)</label>
              <input 
                type="password" 
                required
                value={formData.password}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="••••••••"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <button type="submit" className={`w-full py-4 rounded-2xl font-bold text-white text-lg mt-4 shadow-lg transition-transform active:scale-95 ${role === 'DONOR' ? 'bg-blue-600 shadow-blue-100' : 'bg-green-600 shadow-green-100'}`}>
              Complete Registration
            </button>
          </form>
          <p className="mt-6 text-center text-slate-500 font-medium text-sm">
            Already have an account? <button onClick={() => setView('login')} className="text-blue-600 font-bold hover:underline">Log In</button>
          </p>
        </div>
      </div>
    );
  }

  // --- SELECTION VIEW ---
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