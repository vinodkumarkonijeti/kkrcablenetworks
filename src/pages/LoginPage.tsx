import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'operator' | 'customer'>('operator');
  const navigate = useNavigate();

  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      let loginIdentifier = email;

      // Resolve Email if using Customer ID or Mobile
      if (loginType === 'customer' && !email.includes('@')) {
        const { data: resolvedCustomer, error: lookupError } = await supabase
          .from('customers')
          .select('email')
          .or(`customer_id.eq."${email}",phone.eq."${email}"`)
          .maybeSingle();

        if (lookupError) throw lookupError;
        if (!resolvedCustomer?.email) {
          throw new Error('Customer ID or Mobile Number not recognized.');
        }
        loginIdentifier = resolvedCustomer.email;
      }

      const { user, profile } = await signIn(loginIdentifier, password);
      
      if (!user || !profile) {
        throw new Error('Could not retrieve user profile');
      }
      
      // Verification check: if operator login used but profile is customer (or vice versa)
      if (loginType === 'operator' && profile.role === 'customer') {
          toast.error('This is for Operators. Use Customer Portal login.');
          return;
      }
      if (loginType === 'customer' && profile.role !== 'customer') {
          toast.error('This account is an Operator. Please use the Operator login tab.');
          return;
      }

      // 1. Role-based Redirection
      if (profile.role === 'admin' || profile.role === 'operator') {
        toast.success('Admin access granted');
        navigate('/dashboard');
        return;
      }

      // 2. Customer Redirection (Smart Logic)
      if (profile.role === 'customer') {
        const { data: customer, error: custError } = await supabase
          .from('customers')
          .select('account_status')
          .eq('email', loginIdentifier) // Use resolved email
          .maybeSingle();

        if (custError) throw custError;

        if (!customer) {
          toast.error('Customer profile not found. Please contact support.');
          return;
        }

        switch (customer.account_status) {
          case 'Active':
            toast.success('Welcome to KKR Portal');
            navigate('/portal');
            break;
          case 'Suspended':
            toast.error('Account Suspended: Overdue Payment Found', { duration: 6000 });
            navigate('/portal'); // Still let them enter to pay
            break;
          case 'Disconnected':
            navigate('/disconnected');
            break;
          default:
            navigate('/portal');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-4 relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
              <Logo size={60} className="relative rounded-2xl shadow-xl" />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              KKR Network
            </h1>
          </div>

          {/* Login Type Switcher */}
          <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
            <button 
              onClick={() => setLoginType('operator')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginType === 'operator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              Operator
            </button>
            <button 
              onClick={() => setLoginType('customer')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginType === 'customer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              Customer
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">
                {loginType === 'operator' ? 'Operator Email' : 'Email / Customer ID'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type={loginType === 'operator' ? 'email' : 'text'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-500"
                  placeholder={loginType === 'operator' ? 'name@example.com' : 'KKR-XXXX / 9876543210'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => toast.error('Please contact admin for password reset')}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Connect Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              Don't have access? <button onClick={() => navigate(loginType === 'operator' ? '/register' : '/customer-register')} className="text-blue-400 font-semibold cursor-pointer hover:underline">Register Here</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
