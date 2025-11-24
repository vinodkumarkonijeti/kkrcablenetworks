import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Users, CreditCard } from 'lucide-react';
import type { Customer } from '../../types';

export const OperatorDashboard = () => {
  const { userData } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) return;

    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('operatorId', '==', userData.id));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data: Customer[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Customer);
        });
        setCustomers(data);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching operator customers:', error);
      setLoading(false);
    }
  }, [userData?.id]);

  const paidCustomers = customers.filter((c) => c.billAmount === 0 || c.billStatus === 'Paid');
  const unpaidCustomers = customers.filter((c) => c.billAmount > 0 && c.billStatus === 'Not Paid');

  const totalBillAmount = unpaidCustomers.reduce((sum, c) => sum + (c.billAmount || 0), 0);

  const formatINR = (amount: number | undefined | null) => {
    try {
      const val = amount ?? 0;
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    } catch (e) {
      return `₹${amount ?? 0}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Total Customers</p>
              <p className="text-3xl font-bold mt-2">{customers.length}</p>
            </div>
            <Users className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Bills Paid</p>
              <p className="text-3xl font-bold mt-2">{paidCustomers.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Unpaid Bills</p>
              <p className="text-3xl font-bold mt-2">{unpaidCustomers.length}</p>
            </div>
            <AlertCircle className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Total Pending</p>
              <p className="text-2xl font-bold mt-2">{formatINR(totalBillAmount)}</p>
            </div>
            <CreditCard className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>
      </div>

      {/* Paid Customers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-green-500">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">✅ Paid Bills ({paidCustomers.length})</h3>
        </div>

        {paidCustomers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No customers with paid bills</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paidCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {customer.firstName} {customer.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">Box ID: {customer.boxId}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">Paid</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>📱 {customer.phoneNumber}</p>
                  <p>🏘️ {customer.village}</p>
                  <p className="font-semibold text-green-700">Amount: {formatINR(customer.billAmount)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Unpaid Customers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-red-500">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-gray-800">❌ Unpaid Bills ({unpaidCustomers.length})</h3>
        </div>

        {unpaidCustomers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No customers with unpaid bills</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpaidCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {customer.firstName} {customer.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">Box ID: {customer.boxId}</p>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">Unpaid</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>📱 {customer.phoneNumber}</p>
                  <p>🏘️ {customer.village}</p>
                  <p className="font-bold text-red-700">Due: {formatINR(customer.billAmount)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
