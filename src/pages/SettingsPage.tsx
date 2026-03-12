import { useState } from 'react';
import {
    User,
    Shield,
    Bell,
    Moon,
    Sun,
    CreditCard,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const { userData, signOut } = useAuth();
    const { theme, toggle } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'billing', icon: CreditCard, label: 'Billing Config' },
        { id: 'notifications', icon: Bell, label: 'Push Notifications' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-72 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon size={20} />
                                {tab.label}
                            </div>
                            <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-8">
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-6 pb-8 border-b border-gray-100 dark:border-gray-800">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                                        {userData?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold dark:text-white">{userData?.name}</h3>
                                        <p className="text-gray-500">{userData?.email}</p>
                                        <span className="mt-2 inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest rounded-full">
                                            {userData?.role}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Display Name</label>
                                        <input
                                            type="text"
                                            defaultValue={userData?.name}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            disabled
                                            value={userData?.email}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 opacity-60 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white mb-4">Security Settings</h3>
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                                <Shield size={18} className="text-blue-500" /> Change Password
                                            </h4>
                                            <form className="space-y-4" onSubmit={async (e) => {
                                                e.preventDefault();
                                                const form = e.target as HTMLFormElement;
                                                const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                                                const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

                                                if (newPassword !== confirmPassword) {
                                                    toast.error('Passwords do not match');
                                                    return;
                                                }
                                                if (newPassword.length < 6) {
                                                    toast.error('Password must be at least 6 characters');
                                                    return;
                                                }

                                                const { error } = await supabase.auth.updateUser({ password: newPassword });
                                                if (error) {
                                                    toast.error(error.message);
                                                } else {
                                                    toast.success('Password updated successfully');
                                                    form.reset();
                                                }
                                            }}>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">New Password</label>
                                                        <input
                                                            name="newPassword"
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="w-full bg-white dark:bg-gray-900 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Confirm New Password</label>
                                                        <input
                                                            name="confirmPassword"
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="w-full bg-white dark:bg-gray-900 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                                                >
                                                    Update Password
                                                </button>
                                            </form>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                                                    {theme === 'dark' ? <Moon size={24} className="text-blue-500" /> : <Sun size={24} className="text-amber-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold dark:text-white">Dark Mode</p>
                                                    <p className="text-sm text-gray-500">Enable high-contrast night theme</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggle}
                                                className={`w-14 h-8 rounded-full transition-all relative ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
