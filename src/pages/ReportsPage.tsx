import { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    CreditCard, 
    ArrowUpRight,
    FileText
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area
} from 'recharts';
import { supabase } from '../lib/supabase';

const ReportsPage = () => {
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [growthData, setGrowthData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeCustomers: 0,
        pendingBills: 0,
        collectionRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Revenue Data (Optimized with specific fields)
            const { data: bills } = await supabase
                .from('bills')
                .select('amount, month, year, paid_status')
                .order('year', { ascending: false })
                .order('month', { ascending: false })
                .limit(500); // Sanity limit for performance

            const revenueMap: Record<string, number> = {};
            let totalRev = 0;
            let paidRev = 0;

            bills?.forEach(bill => {
                const label = `${bill.month}/${bill.year}`;
                const amount = Number(bill.amount);
                revenueMap[label] = (revenueMap[label] || 0) + amount;
                totalRev += amount;
                if (bill.paid_status === 'paid') paidRev += amount;
            });

            const revChartData = Object.entries(revenueMap).slice(0, 6).reverse().map(([name, total]) => ({
                name,
                total
            }));
            setRevenueData(revChartData);

            // 2. Fetch Customer Growth (Lightweight selection)
            const { data: customers } = await supabase
                .from('customers')
                .select('created_at, status');

            const growthMap: Record<string, number> = {};
            let activeCount = 0;

            customers?.forEach(c => {
                const date = new Date(c.created_at);
                const label = `${date.getMonth() + 1}/${date.getFullYear()}`;
                growthMap[label] = (growthMap[label] || 0) + 1;
                if (c.status === 'active') activeCount++;
            });

            const growChartData = Object.entries(growthMap).slice(-6).map(([name, count]) => ({
                name,
                customers: count
            }));
            setGrowthData(growChartData);

            const unpaidBills = bills?.filter(b => b.paid_status === 'unpaid').length || 0;

            setStats({
                totalRevenue: totalRev,
                activeCustomers: activeCount,
                pendingBills: unpaidBills,
                collectionRate: totalRev > 0 ? Math.round((paidRev / totalRev) * 100) : 100
            });

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black dark:text-white uppercase tracking-tight">Business Intelligence</h1>
                    <p className="text-sm font-bold text-gray-400">Real-time financial and network analytics</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={async () => {
                            const { generateOperatorMonthlyReport } = await import('../utils/automation');
                            // Calculate approximate stats from current state
                            const reportStats = {
                                total: stats.activeCustomers + 24, // Example offset for demo
                                active: stats.activeCustomers,
                                deactive: 24,
                                pending: stats.pendingBills,
                                rate: stats.collectionRate
                            };
                            const link = await generateOperatorMonthlyReport('919999999999', reportStats); 
                            window.open(link, '_blank');
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-4 rounded-[1.5rem] flex items-center gap-2 font-black transition-all shadow-xl shadow-green-100 dark:shadow-none uppercase tracking-widest text-[10px]"
                    >
                        <FileText size={18} /> Send Monthly Report
                    </button>
                    <button 
                        onClick={fetchReportData}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[1.5rem] flex items-center gap-2 font-black transition-all shadow-xl shadow-blue-100 dark:shadow-none uppercase tracking-widest text-[10px]"
                    >
                        <TrendingUp size={18} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100/50' },
                    { label: 'Active Subscribers', value: stats.activeCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100/50' },
                    { label: 'Pending Bills', value: stats.pendingBills, icon: BarChart3, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: 'Collection Rate', value: `${stats.collectionRate}%`, icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-100/50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black mt-1 dark:text-white">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 dark:text-white">Monthly Revenue Trends</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Growth Chart */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 dark:text-white">Subscribers Growth</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorGrow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="customers" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorGrow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
