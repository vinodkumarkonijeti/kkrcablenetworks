import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MapPin, Box, IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddCustomerModal = ({ isOpen, onClose, onSuccess }: AddCustomerModalProps) => {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        box_id: '',
        village: '',
        mandal: '',
        address: '',
        monthly_fee: 200,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('You must be logged in to add customers.');
            return;
        }

        setLoading(true);
        try {
            // Ensure profile exists in public.users before creating customer
            if (!userData) {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    await supabase.from('users').upsert({
                        id: authUser.id,
                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                        email: authUser.email!,
                        role: (authUser.user_metadata?.role || 'operator'),
                    }, { onConflict: 'id' });
                }
            }

            const { error } = await supabase.from('customers').insert({
                ...formData,
                created_by: user.id,
                status: 'active'
            });

            if (error) throw error;

            toast.success('Customer added successfully');
            onSuccess();
            onClose();
            setFormData({
                name: '',
                phone: '',
                box_id: '',
                village: '',
                mandal: '',
                address: '',
                monthly_fee: 200,
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to add customer');
        } finally {
            setLoading(false);
        }
    };

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
                        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold dark:text-white">New Subscriber</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Register a new connection</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                                <User size={16} className="text-blue-500" /> Full Name
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                                <Phone size={16} className="text-blue-500" /> Phone Number
                                            </label>
                                            <input
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                                placeholder="+91 00000 00000"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                                <Box size={16} className="text-blue-500" /> Setup Box ID
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.box_id}
                                                onChange={(e) => setFormData({ ...formData, box_id: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                                placeholder="KKR-123456"
                                            />
                                        </div>
                                    </div>

                                    {/* Location & Fee */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                                    <MapPin size={16} className="text-blue-500" /> Village
                                                </label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.village}
                                                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                                    placeholder="Village"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Mandal</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.mandal}
                                                    onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                                    placeholder="Mandal"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Full Address</label>
                                            <textarea
                                                rows={2}
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white resize-none"
                                                placeholder="Street, House No..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                                <IndianRupee size={16} className="text-blue-500" /> Monthly Fee
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.monthly_fee}
                                                onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] px-6 py-4 rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : 'Register Connection'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddCustomerModal;
