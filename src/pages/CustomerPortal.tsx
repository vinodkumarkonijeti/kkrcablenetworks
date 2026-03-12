import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Wifi, AlertCircle, Receipt, History, LifeBuoy, CreditCard, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import type { Customer, Bill } from '../types';

type TabType = 'dashboard' | 'bills' | 'payments' | 'history' | 'support';

const CustomerPortal: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [bills, setBills] = useState<Bill[]>([]);

  const formatINR = (amount: number | undefined | null) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);
  };

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.email) return;

      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('email', user.email)
        .maybeSingle();

      if (error) throw error;
      setCustomer(data);

      if (data) {
        const { data: billData } = await supabase
          .from('bills')
          .select('*')
          .eq('customer_id', data.id)
          .order('created_at', { ascending: false });
        setBills(billData || []);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full border border-gray-100">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-2 uppercase">Account Not Linked</h2>
          <p className="text-gray-500 font-medium mb-8">We couldn't find a customer record linked to your email ({user?.email}). Please contact KKR Support.</p>
          <button onClick={handleLogout} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-500 transition-all">Logout</button>
        </div>
      </div>
    );
  }

  const statusColor = customer.account_status === 'Active' ? 'bg-green-500' : customer.account_status === 'Suspended' ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-6 sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full overflow-hidden shadow-md flex-shrink-0">
               <Logo fill size={48} />
            </div>
            <div>
              <h1 className="text-xl font-black dark:text-white uppercase tracking-tight">KKR CUSTOMER PORTAL</h1>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">ID: {customer.customer_id || 'PENDING'}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{user?.email}</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl hover:bg-red-100 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* Status & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 scale-150 transition-transform group-hover:rotate-12 ${statusColor}`}>
              <Wifi size={128} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Service Status</p>
              <h2 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${customer.account_status === 'Active' ? 'text-green-600' : 'text-amber-600'}`}>
                {customer.account_status || 'ACTIVE'}
              </h2>
              <div className="flex flex-wrap gap-4">
                 <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl">
                    <Wifi size={16} className="text-blue-600" />
                    <span className="text-xs font-bold">{customer.connection_type || 'Cable TV'}</span>
                 </div>
                 <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl">
                    <LayoutDashboard size={16} className="text-purple-600" />
                    <span className="text-xs font-bold">{customer.box_id}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 dark:shadow-none text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <CreditCard size={32} className="opacity-50" />
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Pay Now</span>
            </div>
            <div>
              <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-1">Outstanding Balance</p>
              <h3 className="text-5xl font-black tabular-nums tracking-tighter">{formatINR(customer.outstanding_amount)}</h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'bills', label: 'My Bills', icon: Receipt },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'history', label: 'History', icon: History },
            { id: 'support', label: 'Support', icon: LifeBuoy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-gray-900 dark:text-gray-400 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[400px]">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b pb-4 dark:text-white">Account Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-bold">Registered Email</span>
                      <span className="text-sm font-black text-blue-600">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-bold">Plan Name</span>
                      <span className="text-sm font-black uppercase">{customer.plan_id ? 'PRO PLAN' : 'Standard Cable'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-bold">Monthly Rate</span>
                      <span className="text-sm font-black">{formatINR(customer.monthly_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-bold">Installation Date</span>
                      <span className="text-sm font-black uppercase">{customer.installation_date || 'N/A'}</span>
                    </div>
                  </div>
               </div>
               
               <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b pb-4 dark:text-white">Recent Activity</h3>
                  <div className="space-y-4">
                    {bills.slice(0, 3).map(bill => (
                      <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Receipt className="text-blue-500" size={18} />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Bill for {bill.month}/{bill.year}</p>
                            <p className="text-xs font-bold text-gray-500">{bill.paid_status === 'paid' ? 'Paid on Time' : 'Outstanding'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${bill.paid_status === 'paid' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                          {bill.paid_status}
                        </span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'bills' && (
             <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <tr>
                        <th className="px-8 py-6">Month</th>
                        <th className="px-8 py-6">Amount</th>
                        <th className="px-8 py-6">Due Date</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-800">
                      {bills.map(bill => (
                        <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-8 py-6 font-black uppercase">{bill.month}/{bill.year}</td>
                          <td className="px-8 py-6 font-bold">{formatINR(bill.amount)}</td>
                          <td className="px-8 py-6 text-gray-500">{bill.due_date}</td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${bill.paid_status === 'paid' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                              {bill.paid_status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="text-blue-600 font-black uppercase text-[10px] hover:underline">Download</button>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
          
          {(activeTab === 'payments' || activeTab === 'history' || activeTab === 'support') && (
            <div className="bg-white dark:bg-gray-900 p-12 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800 text-center">
               <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
               <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Module Under Expansion</h3>
               <p className="text-gray-400 font-medium max-w-sm mx-auto mt-2">I am currently building out the full V2 {activeTab} logic. This will be ready in the next push!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
