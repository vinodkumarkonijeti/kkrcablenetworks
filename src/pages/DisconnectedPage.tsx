import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const DisconnectedPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-red-600 p-12 text-center text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <ShieldAlert size={120} />
            </div>
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                <Logo fill size={60} />
              </div>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Connection Cut</h1>
            <p className="opacity-80 font-bold text-sm mt-2 uppercase tracking-widest">Account Status: DISCONNECTED</p>
          </div>

          <div className="p-10 space-y-8 text-center">
            <div className="space-y-4">
              <p className="text-gray-500 font-medium">
                Your KKR Cable Network account has been disconnected due to non-payment or an expired subscription. 
              </p>
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                <p className="text-red-700 font-black text-sm uppercase">Please pay your outstanding dues to restore service immediately.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Support</p>
              <div className="flex flex-col gap-2">
                <a href="tel:91kkrcablenetworks@gmail.com" className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all font-bold text-gray-700">
                  <Phone size={18} className="text-red-600" /> +91 Call Support
                </a>
                <a href="mailto:kkrcablenetworks@gmail.com" className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all font-bold text-gray-700">
                  <Mail size={18} className="text-red-600" /> Email Admin
                </a>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-red-600 transition-all"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </div>
        </div>
        
        <p className="text-center mt-8 text-gray-400 text-xs font-medium">
          KKR Cable Network &copy; 2024. All Rights Reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default DisconnectedPage;
