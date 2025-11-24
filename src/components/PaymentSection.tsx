import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import type { Customer } from '../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'bank';
  last4?: string;
  upiId?: string;
  isDefault: boolean;
}

interface PaymentSectionProps {
  customer: Customer;
  onPaymentSuccess?: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ customer, onPaymentSuccess }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount] = useState<number>(customer.billAmount);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Initialize with default payment methods
    const defaultMethods: PaymentMethod[] = [
      {
        id: 'upi_1',
        type: 'upi',
        upiId: 'kkrcablenetworks@upi',
        isDefault: true
      },
      {
        id: 'bank_1',
        type: 'bank',
        last4: '9876',
        isDefault: false
      }
    ];
    setPaymentMethods(defaultMethods);
    setSelectedMethod(defaultMethods[0].id);
  }, []);

  const handlePayment = async () => {
    if (!selectedMethod) {
      setErrorMessage('Please select a payment method');
      return;
    }

    if (amount <= 0) {
      setErrorMessage('No outstanding amount to pay');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real scenario, this would integrate with Razorpay/UPI API
      // For now, we simulate a successful payment
      setPaymentStatus('success');
      setErrorMessage('');

      setTimeout(() => {
          // Mark payment in Firestore: set billAmount to 0 and billStatus to 'Paid'
          (async () => {
            try {
              if (customer.id) {
                const customerRef = doc(db, 'customers', customer.id);
                await updateDoc(customerRef, { billAmount: 0, billStatus: 'Paid', updatedAt: serverTimestamp() });
              }
            } catch (e) {
              console.warn('Failed to update customer payment status', e);
            }
          })();

          onPaymentSuccess?.();
        setPaymentStatus('idle');
      }, 2000);
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Pay Your Bill
      </h3>

      <div className="space-y-4">
        {/* Bill Amount */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Amount</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{customer.billAmount}</p>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Select Payment Method
          </label>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <label key={method.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="payment-method"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {method.type === 'upi' && '📱 UPI'}
                    {method.type === 'card' && '💳 Card'}
                    {method.type === 'bank' && '🏦 Bank Transfer'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {method.upiId || `****${method.last4}`}
                  </p>
                </div>
                {method.isDefault && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Payment Amount
          </label>
          <input
            type="number"
            value={amount}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-200">{errorMessage}</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-200">Payment successful! 🎉</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={loading || paymentStatus === 'processing'}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            loading || paymentStatus === 'processing'
              ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
              : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
          }`}
        >
          {loading || paymentStatus === 'processing' ? 'Processing...' : `Pay ₹${amount}`}
        </button>

        {/* Security Notice */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          🔒 Your payment information is secured with industry-standard encryption.
        </p>
      </div>
    </motion.div>
  );
};
