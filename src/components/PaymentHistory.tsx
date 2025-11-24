import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

interface Payment {
  id: string;
  customerId: string;
  amount: number;
  month: string;
  date: Date;
  status: 'Paid' | 'Pending';
  invoiceUrl?: string;
}

interface PaymentHistoryProps {
  customerId: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ customerId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const billsRef = collection(db, 'bills');
        const q = query(
          billsRef,
          where('customerId', '==', customerId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const paymentList: Payment[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          paymentList.push({
            id: doc.id,
            customerId: data.customerId,
            amount: data.amount || 0,
            month: data.month || '',
            date: data.createdAt?.toDate?.() || new Date(),
            status: data.status || 'Pending',
            invoiceUrl: data.invoiceUrl
          });
        });
        setPayments(paymentList);
      } catch (err) {
        console.error('Error fetching payment history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchPayments();
    }
  }, [customerId]);

  const displayedPayments = showAll ? payments : payments.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment History</h3>
      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No payment history available</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {displayedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{payment.month}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(payment.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600 dark:text-blue-400">₹{payment.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === 'Paid'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
                {payment.invoiceUrl && (
                  <a
                    href={payment.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
              </div>
            ))}
          </div>
          {payments.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-semibold"
            >
              {showAll ? 'Show Less' : `Show All (${payments.length})`}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
};
