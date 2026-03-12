import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface GenerateBillsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const GenerateBillsModal = ({ isOpen, onClose, onSuccess }: GenerateBillsModalProps) => {
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // 1. Fetch all active customers
            const { data: customers, error: custError } = await supabase
                .from('customers')
                .select('*')
                .eq('status', 'active');

            if (custError) throw custError;
            if (!customers || customers.length === 0) {
                toast.error('No active customers found');
                return;
            }

            // 2. Check for existing bills for this period to avoid duplicates
            const { data: existingBills, error: billError } = await supabase
                .from('bills')
                .select('customer_id')
                .eq('month', month)
                .eq('year', year);

            if (billError) throw billError;

            const billedCustomerIds = new Set(existingBills?.map(b => b.customer_id) || []);
            const customersToBill = customers.filter(c => !billedCustomerIds.has(c.id));

            if (customersToBill.length === 0) {
                toast.success('All bills for this period are already generated');
                onClose();
                return;
            }

            // 3. Generate new bills
            const dueDate = new Date(year, month - 1, 10).toISOString(); // Due on 10th of the month

            const newBills = customersToBill.map(c => ({
                customer_id: c.id,
                month,
                year,
                amount: c.monthly_fee,
                due_date: dueDate,
                paid_status: 'unpaid'
            }));

            const { error: insertError } = await supabase.from('bills').insert(newBills);
            if (insertError) throw insertError;

            toast.success(`Generated ${newBills.length} new bills`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold dark:text-white">Batch Billing</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Monthly invoice generation</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex gap-3 text-sm text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                    <Sparkles className="shrink-0" size={20} />
                                    <p>This will automatically generate unpaid invoices for all active customers who haven't been billed yet for the selected period.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                            <Calendar size={16} className="text-purple-500" /> Billing Month
                                        </label>
                                        <select
                                            value={month}
                                            onChange={(e) => setMonth(Number(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500 transition-all dark:text-white appearance-none"
                                        >
                                            {months.map((m, i) => (
                                                <option key={m} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                            <Calendar size={16} className="text-blue-500" /> Year
                                        </label>
                                        <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Generate'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GenerateBillsModal;
