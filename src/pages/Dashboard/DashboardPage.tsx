import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../../lib/supabase';

const StatsCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all"
  >
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 dark:text-white">{value}</h3>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deactive: 0,
    revenue: 0,
    paid: 0,
    unpaid: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    let timeoutId: NodeJS.Timeout;
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', table: 'customers', schema: 'public' },
        () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(fetchStats, 1500);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', table: 'bills', schema: 'public' },
        () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(fetchStats, 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeoutId);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch specifically needed counts and sums
      const [customersRes, activeRes, billsRes, revenueRes] = await Promise.all([
        supabase.from('customers').select('status', { count: 'exact', head: true }),
        supabase.from('customers').select('status', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('bills').select('paid_status, amount, created_at'), // Still need for chart, but restricted fields
        supabase.from('bills').select('amount').eq('paid_status', 'paid')
      ]);

      const total = customersRes.count || 0;
      const active = activeRes.count || 0;
      const deactive = total - active;

      const revenue = revenueRes.data?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      const paidCount = billsRes.data?.filter(b => b.paid_status === 'paid').length || 0;
      const unpaid = (billsRes.data?.length || 0) - paidCount;

      setStats({ total, active, deactive, revenue, paid: paidCount, unpaid });

      // Process revenue data for chart (limited to last 6 months for performance)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyRevenue = (billsRes.data || [])
        .filter(b => b.paid_status === 'paid' && new Date(b.created_at) >= sixMonthsAgo)
        .reduce((acc: any, bill) => {
          const month = new Date(bill.created_at).toLocaleString('default', { month: 'short' });
          acc[month] = (acc[month] || 0) + Number(bill.amount);
          return acc;
        }, {});

      const chartData = Object.keys(monthlyRevenue).map(month => ({
        name: month,
        revenue: monthlyRevenue[month]
      }));
      setRevenueData(chartData);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Paid', value: stats.paid, color: '#10b981' },
    { name: 'Unpaid', value: stats.unpaid, color: '#f59e0b' }
  ];

  const barData = [
    { name: 'Active', value: stats.active },
    { name: 'Deactive', value: stats.deactive }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Customers"
          value={stats.total}
          icon={Users}
          color="bg-blue-500"
          trend={12}
        />
        <StatsCard
          title="Active Connections"
          value={stats.active}
          icon={UserCheck}
          color="bg-emerald-500"
          trend={8}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={IndianRupee}
          color="bg-purple-500"
          trend={15}
        />
        <StatsCard
          title="Pending Payments"
          value={stats.unpaid}
          icon={Clock}
          color="bg-amber-500"
          trend={-5}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-xl font-bold mb-6 dark:text-white text-center sm:text-left">Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
            <h3 className="text-xl font-bold mb-6 dark:text-white w-full text-center sm:text-left">Payment Status</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieData[index].color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-4">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 dark:text-white text-center sm:text-left">Connection Health</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
