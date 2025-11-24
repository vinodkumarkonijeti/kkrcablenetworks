import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, MapPin, Wifi } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const CustomerRegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    village: '',
    boxId: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.village || !formData.boxId) {
      setError('All fields are required');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // First, check if a customer with this email already exists
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('email', '==', formData.email));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setError('Email already registered as a customer. Please log in instead.');
        setLoading(false);
        return;
      }

      // Create the auth user and users doc with role=customer
      await register(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        occupation: 'Customer',
        role: 'customer'
      });

      // If a customer with this boxId exists, ensure names match and link email
      try {
        const { collection, query, where, getDocs, doc, updateDoc, addDoc } = await import('firebase/firestore');
        const customersRef = collection(db, 'customers');
        const byBox = query(customersRef, where('boxId', '==', formData.boxId));
        const boxSnap = await getDocs(byBox);

        if (!boxSnap.empty) {
          const cdoc = boxSnap.docs[0];
          const existing = cdoc.data() as any;
          const nameMatches = (existing.firstName || '').toLowerCase() === formData.firstName.toLowerCase() && (existing.lastName || '').toLowerCase() === formData.lastName.toLowerCase();
          if (!nameMatches) {
            setError('Box ID belongs to a different customer. Please contact support.');
            setLoading(false);
            return;
          }

          // Link email to existing customer record if missing
          if (!existing.email) {
            try {
              await updateDoc(doc(db, 'customers', cdoc.id), {
                email: formData.email,
                updatedAt: serverTimestamp()
              });
            } catch (e) {
              console.warn('Failed to link email to existing customer', e);
            }
          }
        } else {
          // Create new customer record
          const newCustomer = {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber,
            village: formData.village,
            mandal: '',
            pincode: '',
            boxId: formData.boxId,
            startDate: new Date(),
            billAmount: 0,
            status: 'Active',
            billStatus: 'Paid',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await addDoc(collection(db, 'customers'), newCustomer);
        }
      } catch (err) {
        console.warn('Failed to create/link customer record:', err);
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { email: formData.email } });
      }, 2000);
    } catch (err) {
      const e: any = err;
      if (e?.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try logging in.');
      } else if (e?.code === 'auth/configuration-not-found') {
        setError(
          'Authentication provider not configured. Enable Email/Password sign-in in your Firebase Console (Authentication → Sign-in method).' 
        );
      } else {
        setError('Failed to create account. ' + (e?.message ?? ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-green-600 rounded-full p-4 mb-4"
          >
            <Wifi className="w-8 h-8 text-white" />
          </motion.div>
          <div className="flex items-center justify-center gap-3">
            <Logo size={48} />
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Customer Portal</h2>
              <p className="text-gray-600 mt-2">Register for Cable Connection</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="First name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Connection Information */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Connection Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Village
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Village name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Box ID / Connection ID
                </label>
                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="boxId"
                    value={formData.boxId}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Your box/connection ID"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Security</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register as Customer'}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-800 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
