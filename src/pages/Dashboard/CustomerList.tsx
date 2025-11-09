import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { Users, Trash2 } from 'lucide-react';
import { Customer } from '../../types';

export const CustomerList = () => {
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [deactiveCustomers, setDeactiveCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers');

      const activeQuery = query(customersRef, where('status', '==', 'Active'));
      const activeSnapshot = await getDocs(activeQuery);
      const active: Customer[] = [];
      activeSnapshot.forEach((doc) => {
        active.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setActiveCustomers(active);

      const deactiveQuery = query(customersRef, where('status', '==', 'Deactive'));
      const deactiveSnapshot = await getDocs(deactiveQuery);
      const deactive: Customer[] = [];
      deactiveSnapshot.forEach((doc) => {
        deactive.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setDeactiveCustomers(deactive);
    } catch (error) {
      setMessage('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (customerId: string) => {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      setMessage('Customer deleted successfully');
      setShowDeleteConfirm(null);
      fetchCustomers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting customer');
    }
  };

  const CustomerTable = ({ customers, title, bgColor }: { customers: Customer[]; title: string; bgColor: string }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className={`flex items-center space-x-3 mb-4 pb-4 border-b-2 ${bgColor}`}>
        <Users className="w-6 h-6" />
        <h3 className="text-xl font-bold text-gray-800">{title} ({customers.length})</h3>
      </div>

      {customers.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No customers found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Village</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{customer.phoneNumber}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{customer.village}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{customer.boxId}</td>
                  <td className="px-4 py-4 whitespace-nowrap">₹{customer.billAmount}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        customer.billStatus === 'Paid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {customer.billStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setShowDeleteConfirm(customer.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Customer Lists</h2>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('successfully')
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <CustomerTable customers={activeCustomers} title="Active Customers" bgColor="border-green-500" />
      <CustomerTable customers={deactiveCustomers} title="Deactive Customers" bgColor="border-red-500" />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 shadow-xl max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
