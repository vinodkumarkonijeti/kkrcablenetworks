import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, MapPin, Wifi, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import Logo from '../components/Logo';

export const CustomerRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    village: '',
    mandal: '',
    boxId: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('System error: The database connection is not configured correctly. Please contact KKR Support.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      // 1. Register the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            role: 'customer', // Explicitly customer
          }
        }
      });

      if (signUpError) throw signUpError;

      const userId = data.user?.id;

      if (userId) {
        // 2. Create user profile in public.users
        await supabase.from('users').upsert({
          id: userId,
          name: formData.name,
          email: formData.email,
          role: 'customer',
        });

        // 3. Check if a customer with this boxId exists - link or create
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('box_id', formData.boxId)
          .single();

        if (existingCustomer) {
          // Verify name matches or is empty (if created as placeholder)
          const existingName = existingCustomer.name?.toLowerCase() || '';
          const inputName = formData.name.toLowerCase();
          
          if (existingName && !existingName.includes(inputName.split(' ')[0]) && !inputName.includes(existingName.split(' ')[0])) {
            setError('Box ID is linked to a different name. Please contact KKR Support.');
            setLoading(false);
            return;
          }

          // Link the email to the existing customer record
          await supabase.from('customers').update({
            email: formData.email,
          }).eq('box_id', formData.boxId);
        } else {
          // If Box ID doesn't exist, we create a new one as requested, but ensure it's a customer
          await supabase.from('customers').insert({
            name: formData.name,
            phone: formData.phoneNumber,
            box_id: formData.boxId,
            village: formData.village,
            mandal: formData.mandal,
            status: 'active',
            monthly_fee: 200, 
            created_by: userId,
            email: formData.email,
            customer_id: formData.boxId // Match box_id to customer_id for simplicity
          });
        }
      }

      setShowSuccess(true);
      setTimeout(() => navigate('/login', { state: { email: formData.email } }), 2500);

    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        setError('Email already registered. Please login instead.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Logo size={52} className="rounded-xl shadow-md" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-800">KKR Cable Networks</h1>
              <p className="text-sm text-green-600 font-medium">Customer Registration Portal</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-3">Register to access your cable connection details</p>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-5 text-sm"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {/* Success Banner */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-5 text-sm"
          >
            <CheckCircle size={16} />
            Registration successful! Redirecting to login...
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Information */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', name: 'name', icon: User, placeholder: 'Enter your full name' },
                { label: 'Email Address', name: 'email', icon: Mail, placeholder: 'your@email.com', type: 'email' },
                { label: 'Phone Number', name: 'phoneNumber', icon: Phone, placeholder: '+91 XXXXXXXXXX', type: 'tel' },
              ].map(({ label, name, icon: Icon, placeholder, type = 'text' }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={type}
                      name={name}
                      value={(formData as any)[name]}
                      onChange={handleChange}
                      required
                      placeholder={placeholder}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Connection Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    required
                    placeholder="Your village"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mandal</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="mandal"
                    value={formData.mandal}
                    onChange={handleChange}
                    required
                    placeholder="Your mandal"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Box ID / Connection ID</label>
                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="boxId"
                    value={formData.boxId}
                    onChange={handleChange}
                    required
                    placeholder="e.g. KKR-123456"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Account Security</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Password', name: 'password', placeholder: 'Min 6 characters' },
                { label: 'Confirm Password', name: 'confirmPassword', placeholder: 'Re-enter password' },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="password"
                      name={name}
                      value={(formData as any)[name]}
                      onChange={handleChange}
                      required
                      placeholder={placeholder}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || showSuccess}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-100 mt-2"
          >
            {loading ? 'Registering...' : 'Register as Customer'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-800 font-semibold">
              Login here
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default CustomerRegisterPage;
