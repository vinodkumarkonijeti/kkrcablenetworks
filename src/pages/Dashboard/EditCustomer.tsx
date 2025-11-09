import { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { Edit, Search, Calendar, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { Customer } from '../../types';

export const EditCustomer = () => {
  const [searchBoxId, setSearchBoxId] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    village: '',
    boxId: '',
    billAmount: '',
    endDate: ''
  });

  const handleSearch = async () => {
    try {
      setLoading(true);
      setMessage('');
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('boxId', '==', searchBoxId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const customerData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Customer;
        setCustomer(customerData);
        setFormData({
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          phoneNumber: customerData.phoneNumber,
          village: customerData.village,
          boxId: customerData.boxId,
          billAmount: customerData.billAmount.toString(),
          endDate: customerData.endDate ? format(customerData.endDate.toDate?.() || new Date(), 'yyyy-MM-dd') : ''
        });
      } else {
        setMessage('Customer not found with this Box ID');
        setCustomer(null);
      }
    } catch (error) {
      setMessage('Error searching customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      setLoading(true);
      const customerRef = doc(db, 'customers', customer.id);
      await updateDoc(customerRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        village: formData.village,
        boxId: formData.boxId,
        billAmount: Number(formData.billAmount),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        updatedAt: new Date()
      });
      setMessage('Customer updated successfully!');
      setTimeout(() => {
        setMessage('');
        setCustomer(null);
        setSearchBoxId('');
      }, 2000);
    } catch (error) {
      setMessage('Error updating customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Edit className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Edit Customer Details</h2>
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

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search by Box ID
        </label>
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchBoxId}
            onChange={(e) => setSearchBoxId(e.target.value)}
            placeholder="Enter Box ID"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchBoxId}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {customer && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village *
              </label>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Box ID *
              </label>
              <input
                type="text"
                name="boxId"
                value={formData.boxId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <IndianRupee className="inline w-4 h-4 mr-1" />
                Bill Amount *
              </label>
              <input
                type="number"
                name="billAmount"
                value={formData.billAmount}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Customer'}
          </button>
        </form>
      )}
    </motion.div>
  );
};
