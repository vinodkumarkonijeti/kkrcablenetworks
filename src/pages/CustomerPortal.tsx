import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion } from 'framer-motion';
import { LogOut, Wifi, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentHistory } from '../components/PaymentHistory';
import { PaymentSection } from '../components/PaymentSection';
import { SupportChat } from '../components/SupportChat';
import Logo from '../components/Logo';
import type { Customer } from '../types';

type TabType = 'dashboard' | 'payments' | 'history' | 'support';

export const CustomerPortal: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const formatINR = (amount: number | undefined | null) => {
    try {
      const val = amount ?? 0;
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    } catch (e) {
      return `₹${amount ?? 0}`;
    }
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        if (!currentUser?.email) return;

        // Fetch customer record by email
        const customersRef = collection(db, 'customers');
        const q = query(customersRef, where('email', '==', currentUser.email));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const doc = snap.docs[0];
          setCustomer({ id: doc.id, ...doc.data() } as Customer);
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [currentUser]);

  const refetch = async () => {
    try {
      if (!currentUser?.email) return;
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('email', '==', currentUser.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        setCustomer({ id: d.id, ...d.data() } as Customer);
      }
    } catch (e) {
      console.warn('Refetch customer failed', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-lg"
        >
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Customer Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't find your customer record. Please contact support.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full overflow-hidden shadow-md flex-shrink-0">
              <Logo fill size={48} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KKR CABLE NETWORKS</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome, {customer.firstName}!</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      {/* Connection Status */}
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            customer.status === 'Active'
              ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
          }`}
        >
          <Wifi
            className={`w-6 h-6 ${
              customer.status === 'Active' ? 'text-green-600' : 'text-red-600'
            }`}
          />
          <div className="flex-1">
            <p className={`font-semibold ${
              customer.status === 'Active' ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'
            }`}>
              {customer.status === 'Active' ? '✅ Connection Active' : '❌ Connection Inactive'}
            </p>
            <p className={`text-sm ${
              customer.status === 'Active' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              Box ID: {customer.boxId}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="container mx-auto px-4 py-3 flex gap-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
        >
          📊 View as Operator
        </button>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'payments', label: 'Pay Bill' },
            { id: 'history', label: 'Payment History' },
            { id: 'support', label: 'Support' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Connection Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📍 Connection Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {customer.firstName} {customer.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{customer.phoneNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Village:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{customer.village || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Box ID:</span>
                  <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">{customer.boxId || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{customer.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    customer.status === 'Active'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {customer.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bill Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Bill:</span>
                  <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{formatINR(customer.billAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  {(() => {
                    const billAmt = customer.billAmount ?? 0;
                    const isPaid = billAmt === 0 || customer.billStatus === 'Paid';
                    return (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isPaid
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {isPaid ? 'Paid' : (customer.billStatus || 'Unpaid')}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'payments' && customer && (
          <PaymentSection customer={customer} onPaymentSuccess={refetch} />
        )}

        {activeTab === 'history' && customer && (
          <PaymentHistory customerId={customer.id} />
        )}

        {activeTab === 'support' && customer && (
          <SupportChat customerId={customer.id} />
        )}
      </div>
    </div>
  );
};
