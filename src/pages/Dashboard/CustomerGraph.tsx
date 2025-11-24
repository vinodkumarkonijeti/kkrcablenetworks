import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Users, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LineChart, Line } from 'recharts';

interface MonthlyStats {
  month: string;
  revenue: number;
  customers: number;
}

export const CustomerGraph = () => {
  const [activeCount, setActiveCount] = useState(0);
  const [deactiveCount, setDeactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);

  useEffect(() => {
    const customersRef = collection(db, 'customers');
    const activeQuery = query(customersRef, where('status', '==', 'Active'));
    const deactiveQuery = query(customersRef, where('status', '==', 'Deactive'));

    // Subscribe to active customers
    const unsubActive = onSnapshot(activeQuery, (snapshot) => {
      setActiveCount(snapshot.size);
      setLoading(false);
    });

    // Subscribe to deactive customers
    const unsubDeactive = onSnapshot(deactiveQuery, (snapshot) => {
      setDeactiveCount(snapshot.size);
    });

    // Subscribe to bills for monthly revenue stats
    const billsRef = collection(db, 'bills');
    const unsubBills = onSnapshot(billsRef, (snapshot) => {
      const stats = new Map<string, { revenue: number; customers: number }>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.createdAt.seconds * 1000);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!stats.has(monthKey)) {
          stats.set(monthKey, { revenue: 0, customers: 0 });
        }
        
        const current = stats.get(monthKey)!;
        current.revenue += data.amount || 0;
        current.customers += 1;
      });
      
      const sortedStats = Array.from(stats.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6) // Last 6 months
        .map(([month, data]) => ({
          month: month.split('-')[1],
          revenue: data.revenue,
          customers: data.customers
        }));
      
      setMonthlyStats(sortedStats);
    });

    return () => {
      unsubActive();
      unsubDeactive();
      unsubBills();
    };
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
        className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Customer Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Active Customers</span>
              <span className="text-gray-600 dark:text-gray-400">{activeCount} ({activePercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
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
              <span className="text-gray-700 dark:text-gray-300 font-medium">Deactive Customers</span>
              <span className="text-gray-600 dark:text-gray-400">{deactiveCount} ({deactivePercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <XAxis 
                  dataKey="month" 
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ fill: '#3b82f6' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Active vs Deactive</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Active', value: activeCount },
                { name: 'Deactive', value: deactiveCount }
              ]}>
                <XAxis 
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value">
                  {[
                    <Cell key="active" fill="#10b981" />,
                    <Cell key="deactive" fill="#ef4444" />
                  ]}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
