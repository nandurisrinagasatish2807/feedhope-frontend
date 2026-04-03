import React, { useState } from 'react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); // Your digital key
        alert("Login Successful! Welcome back.");
        window.location.href = '/dashboard'; 
      } else {
        alert(data.error || "Login failed. Check your email/password.");
      }
    } catch (err) {
      alert("Backend is offline. Make sure Spring Boot is running!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white shadow-2xl rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">FeedHope Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="UTD Email" 
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg font-bold transition duration-300">
            Enter Dashboard
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          New here? <a href="/" className="text-blue-600 font-semibold">Register instead</a>
        </p>
      </div>
    </div>
  );
};

export default Login;