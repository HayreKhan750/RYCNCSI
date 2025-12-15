import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // For theme
import { setTheme } from '../../store/slices/themeSlice';
import Header from '../common/Header';

const InstructorSettings = () => {
    const dispatch = useDispatch();
    const { mode } = useSelector(state => state.theme);
    const { user } = useSelector(state => state.auth);

    const [notifPreferences, setNotifPreferences] = useState({
        emailReviews: true,
        emailDigest: false,
        pushNewReview: true
    });

    const [activeSection, setActiveSection] = useState('general'); // general, security, help

    const handleToggle = (key) => {
        setNotifPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Header title="Settings" />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Account Settings</h1>
                 
                 <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 space-y-1">
                            {[
                                { id: 'general', label: 'General & Theme', icon: '🎨' },
                                { id: 'notifications', label: 'Notifications', icon: '🔔' },
                                { id: 'security', label: 'Privacy & Security', icon: '🔒' },
                                { id: 'help', label: 'Help & Support', icon: '❓' },
                            ].map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                                        activeSection === item.id 
                                        ? 'bg-indigo-50 text-indigo-700' 
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                             <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">My Plan</div>
                             <div className="text-sm font-semibold text-indigo-900 mb-1">Instructor Pro</div>
                             <div className="text-xs text-indigo-600">Active until Dec 2025</div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 space-y-6">
                        {/* GENERAL / THEME */}
                        {activeSection === 'general' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-fade-in">
                                <h2 className="text-xl font-bold text-slate-800 mb-6">Appearance</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => dispatch(setTheme('light'))}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                            mode === 'light' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 mb-2 relative overflow-hidden">
                                            <div className="absolute top-2 left-2 right-2 h-2 bg-white rounded-sm"></div>
                                            <div className="absolute top-6 left-2 w-1/3 h-16 bg-white rounded-sm"></div>
                                        </div>
                                        <span className={`font-semibold ${mode === 'light' ? 'text-indigo-700' : 'text-slate-600'}`}>Light Mode</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => dispatch(setTheme('dark'))}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                            mode === 'dark' ? 'border-indigo-500 bg-slate-900' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="w-full h-24 bg-slate-800 rounded-lg border border-slate-700 mb-2 relative overflow-hidden">
                                             <div className="absolute top-2 left-2 right-2 h-2 bg-slate-700 rounded-sm"></div>
                                             <div className="absolute top-6 left-2 w-1/3 h-16 bg-slate-700 rounded-sm"></div>
                                        </div>
                                        <span className={`font-semibold ${mode === 'dark' ? 'text-white' : 'text-slate-600'}`}>Dark Mode</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeSection === 'notifications' && (
                             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-fade-in">
                                <h2 className="text-xl font-bold text-slate-800 mb-6">Email Preferences</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-800">New Review Alerts</div>
                                            <div className="text-sm text-slate-500">Get notified when a student posts a new review.</div>
                                        </div>
                                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input 
                                                type="checkbox" 
                                                name="toggle" 
                                                id="toggle1" 
                                                checked={notifPreferences.emailReviews}
                                                onChange={() => handleToggle('emailReviews')}
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-200 checked:right-0 checked:border-indigo-500"
                                                style={{ right: notifPreferences.emailReviews ? '0' : 'auto', left: notifPreferences.emailReviews ? 'auto' : '0' }}
                                            />
                                            <label 
                                                htmlFor="toggle1" 
                                                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${notifPreferences.emailReviews ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                            ></label>
                                        </div>
                                    </div>
                                    <hr className="border-slate-100" />
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-800">Weekly Digest</div>
                                            <div className="text-sm text-slate-500">Summary of your stats and performance every Monday.</div>
                                        </div>
                                         <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input 
                                                type="checkbox" 
                                                checked={notifPreferences.emailDigest}
                                                onChange={() => handleToggle('emailDigest')}
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-200"
                                                style={{ right: notifPreferences.emailDigest ? '0' : 'auto', left: notifPreferences.emailDigest ? 'auto' : '0' }}
                                            />
                                            <label 
                                                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${notifPreferences.emailDigest ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                                onClick={() => handleToggle('emailDigest')} // Click handler wrapper
                                            ></label>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}

                        {/* HELP / SUPPORT */}
                        {activeSection === 'help' && (
                             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-fade-in">
                                <h2 className="text-xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>
                                <div className="space-y-4">
                                    <details className="group bg-slate-50 rounded-xl p-4 cursor-pointer">
                                        <summary className="font-semibold text-slate-700 list-none flex justify-between items-center">
                                            How do I reply to a review?
                                            <span className="transition group-open:rotate-180">▼</span>
                                        </summary>
                                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                            Navigate to the "Reviews" tab or dashboard panel. Click "Reply" on any student feedback. Your reply will be publicly visible.
                                        </p>
                                    </details>
                                    <details className="group bg-slate-50 rounded-xl p-4 cursor-pointer">
                                        <summary className="font-semibold text-slate-700 list-none flex justify-between items-center">
                                            Can I delete a review?
                                            <span className="transition group-open:rotate-180">▼</span>
                                        </summary>
                                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                            Instructors cannot directly delete reviews to ensure transparency. However, you can "Report" a review if it violates our community guidelines (e.g., hate speech, spam).
                                        </p>
                                    </details>
                                    <details className="group bg-slate-50 rounded-xl p-4 cursor-pointer">
                                        <summary className="font-semibold text-slate-700 list-none flex justify-between items-center">
                                            How is my engagement score calculated?
                                            <span className="transition group-open:rotate-180">▼</span>
                                        </summary>
                                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                            It's a mix of your reply rate, how recently you've been active, and the volume of feedback you receive.
                                        </p>
                                    </details>
                                </div>
                                
                                <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">Need personalized help?</h3>
                                <button className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-700 transition-colors">
                                    Contact Support Team
                                </button>
                             </div>
                        )}
                        
                        {/* SECURITY placeholder */}
                         {activeSection === 'security' && (
                             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-fade-in">
                                 <h2 className="text-xl font-bold text-slate-800 mb-6">Privacy & Security</h2>
                                 <p className="text-slate-500 mb-6">Manage your password and security settings via your main account provider (Google/Email).</p>
                                 <button className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50">
                                     Change Password
                                 </button>
                             </div>
                         )}

                    </div>
                 </div>
            </div>
        </div>
    );
};

export default InstructorSettings;
