import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Customer } from '../../types';
import { Users, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerGraph = () => {
  const [activeCount, setActiveCount] = useState(0);
  const [deactiveCount, setDeactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerCounts = async () => {
      try {
        const customersRef = collection(db, 'customers');

        const activeQuery = query(customersRef, where('status', '==', 'Active'));
        const activeSnapshot = await getDocs(activeQuery);
        setActiveCount(activeSnapshot.size);

        const deactiveQuery = query(customersRef, where('status', '==', 'Deactive'));
        const deactiveSnapshot = await getDocs(deactiveQuery);
        setDeactiveCount(deactiveSnapshot.size);
      } catch (error) {
        console.error('Error fetching customer counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerCounts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const total = activeCount + deactiveCount;
  const activePercentage = total > 0 ? (activeCount / total) * 100 : 0;
  const deactivePercentage = total > 0 ? (deactiveCount / total) * 100 : 0;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Customer Overview</h2>
        <p className="text-gray-600">Track your active and inactive customers</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10" />
            <span className="text-3xl font-bold">{total}</span>
          </div>
          <h3 className="text-xl font-semibold">Total Customers</h3>
          <p className="text-blue-100 mt-2">All registered customers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-10 h-10" />
            <span className="text-3xl font-bold">{activeCount}</span>
          </div>
          <h3 className="text-xl font-semibold">Active Customers</h3>
          <p className="text-green-100 mt-2">{activePercentage.toFixed(1)}% of total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <UserX className="w-10 h-10" />
            <span className="text-3xl font-bold">{deactiveCount}</span>
          </div>
          <h3 className="text-xl font-semibold">Deactive Customers</h3>
          <p className="text-red-100 mt-2">{deactivePercentage.toFixed(1)}% of total</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Customer Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 font-medium">Active Customers</span>
              <span className="text-gray-600">{activeCount} ({activePercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activePercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 font-medium">Deactive Customers</span>
              <span className="text-gray-600">{deactiveCount} ({deactivePercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${deactivePercentage}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
