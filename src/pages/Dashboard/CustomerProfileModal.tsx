import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { addDays } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { Customer } from '../../types';
import { X } from 'lucide-react';

interface Props {
  customer: Customer | null;
  onClose: () => void;
}

export const CustomerProfileModal = ({ customer, onClose }: Props) => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);

    const fetchBills = async () => {
      const { data } = await supabase
        .from('bills')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setBills(data ?? []);
      setLoading(false);
    };

    fetchBills();
  }, [customer]);

  if (!customer) return null;

  const startDate = customer.startDate ? new Date(customer.startDate as any) : null;
  const endDate = startDate ? addDays(startDate, 30) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{customer.name || `${customer.firstName} ${customer.lastName}`}</h3>
            <p className="text-sm opacity-80">Box ID: {customer.box_id || customer.boxId} • {customer.village}{customer.mandal ? `, ${customer.mandal}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition"><X size={20} /></button>
        </div>

        {/* Details */}
        <div className="p-6 grid grid-cols-2 gap-4 border-b dark:border-gray-700">
          {[
            ['Phone', customer.phone || customer.phoneNumber],
            ['Status', customer.status],
            ['Monthly Fee', `₹${customer.monthly_fee ?? customer.billAmount ?? 0}`],
            ['Bill Status', customer.paid_status || customer.billStatus || '—'],
            ['Start Date', startDate ? startDate.toLocaleDateString() : '—'],
            ['End Date', endDate ? endDate.toLocaleDateString() : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Payment History */}
        <div className="p-6">
          <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">Payment History</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : bills.length === 0 ? (
            <p className="text-sm text-gray-500">No payment records found.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bills.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">₹{b.amount}</p>
                    <p className="text-xs text-gray-500">{b.month ? `Month ${b.month}/${b.year}` : '—'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.paid_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {b.paid_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerProfileModal;
