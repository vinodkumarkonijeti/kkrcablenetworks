import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { addDays } from 'date-fns';
import { db } from '../../config/firebase';
import type { Customer } from '../../types';

interface Props {
  customer: Customer | null;
  onClose: () => void;
}

export const CustomerProfileModal = ({ customer, onClose }: Props) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    const billsRef = collection(db, 'bills');
    const q = query(billsRef, where('customerId', '==', customer.id), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setPayments(arr);
      setLoading(false);
    });

    return () => unsub();
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{customer.firstName} {customer.lastName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Box ID: {customer.boxId} • {customer.village}, {customer.mandal}</p>
          </div>
          <button onClick={onClose} className="text-sm text-gray-600 dark:text-gray-300">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div><strong>Phone:</strong> {customer.phoneNumber}</div>
            <div><strong>Status:</strong> {customer.status}</div>
            <div><strong>Bill Amount:</strong> ₹{customer.billAmount}</div>
            <div><strong>Bill Status:</strong> {customer.billStatus}</div>
          </div>
          <div className="space-y-2">
            <div><strong>Start Date:</strong> {customer.startDate ? new Date(customer.startDate as any).toLocaleDateString() : '-'}</div>
            <div><strong>End Date:</strong> {customer.startDate ? new Date(addDays(new Date(customer.startDate as any), 30)).toLocaleDateString() : '-'}</div>
            <div><strong>Created:</strong> {customer.createdAt ? new Date(customer.createdAt as any).toLocaleDateString() : '-'}</div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2">Payment History</h4>
          {loading ? (
            <div className="text-sm text-gray-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="text-sm text-gray-500">No payments found.</div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <div>
                    <div className="font-medium">₹{p.amount}</div>
                    <div className="text-xs text-gray-500">{p.month || p.description} — {p.status || 'Unknown'}</div>
                  </div>
                  <div className="text-sm text-gray-600">{p.createdAt ? new Date(p.createdAt.seconds ? p.createdAt.seconds * 1000 : p.createdAt).toLocaleDateString() : '-'}</div>
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
