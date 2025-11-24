import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { userData: loginUserData } = await login(email, password);

      // If the user was redirected here because they clicked "Go to Portal",
      // `location.state.next` will be set. In that case, assign the 'customer'
      // role and ensure a minimal customer record exists before navigating.
      const finalRole = loginUserData?.role;
      const intended = location?.state?.next as string | undefined;

      if (intended === '/customer-portal') {
        try {
          const { doc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          // If the authenticated user is an admin or operator, don't change their role
          // or force them into the customer portal. Send admins/operators to dashboard.
          if (loginUserData?.role === 'admin' || loginUserData?.role === 'operator') {
            navigate('/dashboard', { replace: true });
            return;
          }
          // set users/{uid} role to customer
          if (loginUserData && loginUserData.id) {
            const userDocRef = doc(db, 'users', loginUserData.id);
            try {
              await setDoc(userDocRef, { email: loginUserData.email || '', role: 'customer', createdAt: serverTimestamp() }, { merge: true });
            } catch (e) {
              console.warn('[LoginPage] Failed to set customer role:', e);
            }
          }

          // Ensure customers record exists
          if (loginUserData?.email) {
            const customersRef = collection(db, 'customers');
            const q = query(customersRef, where('email', '==', loginUserData.email));
            const snap = await getDocs(q);
            if (snap.empty) {
              try {
                await addDoc(collection(db, 'customers'), {
                  email: loginUserData.email,
                  firstName: '',
                  lastName: '',
                  phoneNumber: '',
                  village: '',
                  boxId: '',
                  status: 'Active',
                  billAmount: 0,
                  billStatus: 'Paid',
                  createdAt: serverTimestamp()
                });
              } catch (e) {
                console.warn('[LoginPage] Failed to create customer record:', e);
              }
            }
          }

          navigate('/customer-portal', { replace: true });
          return;
        } catch (e) {
          console.warn('[LoginPage] Portal redirect setup failed', e);
        }
      }

      // Default navigation based on role
      if (finalRole === 'customer') {
        navigate('/customer-portal', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[LoginPage] Login error:', err);
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-blue-600 rounded-full p-4 mb-4"
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Login to your account</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                Register
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
