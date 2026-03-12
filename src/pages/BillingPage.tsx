import { useEffect, useState } from 'react';
import {
    Receipt,
    Search,
    CheckCircle2,
    FileDown,
    Clock,
    Send,
    Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Bill } from '../types';
import toast from 'react-hot-toast';
import GenerateBillsModal from '../components/GenerateBillsModal';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { sendAutomationMessage } from '../utils/automation';

const BillingPage = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const { data, error } = await supabase
                .from('bills')
                .select('*, customer:customers(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBills(data || []);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            // Loading removed
        }
    };

    const handleTogglePaid = async (bill: Bill) => {
        const newStatus = bill.paid_status === 'paid' ? 'unpaid' : 'paid';
        const paymentDate = newStatus === 'paid' ? new Date().toISOString() : null;

        try {
            const { error } = await supabase
                .from('bills')
                .update({
                    paid_status: newStatus,
                    payment_date: paymentDate
                })
                .eq('id', bill.id);

            if (error) throw error;
            toast.success(`Bill marked as ${newStatus}`);
            fetchBills();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const filteredBills = bills.filter(b => {
        const customerName = b.customer?.name.toLowerCase() || '';
        const boxId = b.customer?.box_id.toLowerCase() || '';
        return customerName.includes(searchTerm.toLowerCase()) || boxId.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Billing History</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor payments and generate invoices</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95"
                >
                    <Receipt size={20} />
                    Generate Monthly Bills
                </button>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase">Total Collected</p>
                            <h3 className="text-2xl font-black dark:text-white">₹{bills.filter(b => b.paid_status === 'paid').reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-3xl border border-rose-100 dark:border-rose-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200 dark:shadow-none">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-rose-600 dark:text-rose-400 text-sm font-bold uppercase">Pending Amount</p>
                            <h3 className="text-2xl font-black dark:text-white">₹{bills.filter(b => b.paid_status === 'unpaid').reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <p className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase">Active Invoices</p>
                            <h3 className="text-2xl font-black dark:text-white">{bills.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by customer or box ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Billing Period</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Invoices</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredBills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold dark:text-white">{bill.customer?.name}</p>
                                        <p className="text-xs text-gray-500">{bill.customer?.box_id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium dark:text-gray-300">
                                            {new Date(0, bill.month - 1).toLocaleString('default', { month: 'long' })} {bill.year}
                                        </p>
                                        <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                                            <Calendar size={12} />
                                            Due: {new Date(bill.due_date).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-lg font-black dark:text-white">₹{bill.amount}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleTogglePaid(bill)}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${bill.paid_status === 'paid'
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                            {bill.paid_status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => generateInvoicePDF(bill)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all"
                                            >
                                                <FileDown size={14} />
                                                PDF
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const link = await sendAutomationMessage({
                                                        phone: bill.customer?.phone || '',
                                                        customerName: bill.customer?.name || 'Customer',
                                                        type: 'bill_reminder',
                                                        details: {
                                                            period: `${new Date(0, bill.month - 1).toLocaleString('default', { month: 'long' })} ${bill.year}`,
                                                            amount: bill.amount
                                                        }
                                                    });
                                                    window.open(link, '_blank');
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all"
                                            >
                                                <Send size={14} />
                                                WhatsApp
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <GenerateBillsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchBills}
            />
        </div>
    );
};

export default BillingPage;
