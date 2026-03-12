import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
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
    const fetchCounts = async () => {
      // Fetch active customers count
      const { count: active } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch deactive customers count
      const { count: deactive } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'deactive');

      setActiveCount(active ?? 0);
      setDeactiveCount(deactive ?? 0);
      setLoading(false);
    };

    const fetchBillStats = async () => {
      const { data: bills } = await supabase
        .from('bills')
        .select('amount, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (bills) {
        const stats = new Map<string, { revenue: number; customers: number }>();
        bills.forEach((bill) => {
          const date = new Date(bill.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!stats.has(monthKey)) stats.set(monthKey, { revenue: 0, customers: 0 });
          const current = stats.get(monthKey)!;
          current.revenue += bill.amount || 0;
          current.customers += 1;
        });

        const sorted = Array.from(stats.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6)
          .map(([month, data]) => ({
            month: month.split('-')[1],
            revenue: data.revenue,
            customers: data.customers,
          }));

        setMonthlyStats(sorted);
      }
    };

    fetchCounts();
    fetchBillStats();

    // Realtime subscription for customer counts
    const channel = supabase
      .channel('customer-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Customer Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Track your active and inactive customers</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Users, count: total, label: 'Total Customers', sub: 'All registered customers', color: 'from-blue-500 to-blue-600' },
          { icon: UserCheck, count: activeCount, label: 'Active Customers', sub: `${activePercentage.toFixed(1)}% of total`, color: 'from-green-500 to-green-600' },
          { icon: UserX, count: deactiveCount, label: 'Deactive Customers', sub: `${deactivePercentage.toFixed(1)}% of total`, color: 'from-red-500 to-red-600' },
        ].map(({ icon: Icon, count, label, sub, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <Icon className="w-10 h-10" />
              <span className="text-3xl font-bold">{count}</span>
            </div>
            <h3 className="text-xl font-semibold">{label}</h3>
            <p className="mt-2 opacity-80">{sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Customer Distribution</h3>
        <div className="space-y-4">
          {[
            { label: 'Active Customers', count: activeCount, pct: activePercentage, color: 'from-green-500 to-green-600' },
            { label: 'Deactive Customers', count: deactiveCount, pct: deactivePercentage, color: 'from-red-500 to-red-600' },
          ].map(({ label, count, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
                <span className="text-gray-600 dark:text-gray-400">{count} ({pct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`bg-gradient-to-r ${color} h-full rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Active vs Deactive</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Active', value: activeCount }, { name: 'Deactive', value: deactiveCount }]}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value">
                  <Cell key="active" fill="#10b981" />
                  <Cell key="deactive" fill="#ef4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
