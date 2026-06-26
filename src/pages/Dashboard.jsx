import React from 'react';

function Dashboard({ campaigns, donorProfile, user, setView, setUser, handleDonate }) {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <nav className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black tracking-tight">Feed<span className="text-blue-600">Hope</span></h1>
        <button 
          onClick={() => { setView('selection'); setUser(null); localStorage.removeItem('token'); }} 
          className="bg-slate-200 px-6 py-2 rounded-xl font-bold hover:bg-slate-300"
        >
          Log Out
        </button>
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

export default Dashboard;