import React from 'react';

function Register({ formData, setFormData, handleSubmit, role, setView }) {
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

export default Register;