import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Search, Calendar, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const EditCustomer = () => {
  const [searchBoxId, setSearchBoxId] = useState('');
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    box_id: '',
    monthly_fee: '',
    endDate: '',
    status: 'active',
  });

  const handleSearch = async () => {
    if (!searchBoxId.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('box_id', searchBoxId.trim())
        .single();

      if (error || !data) {
        toast.error('Customer not found with this Box ID');
        setCustomer(null);
      } else {
        setCustomer(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          village: data.village || '',
          box_id: data.box_id || '',
          monthly_fee: String(data.monthly_fee ?? ''),
          endDate: '',
          status: data.status || 'active',
        });
      }
    } catch {
      toast.error('Error searching for customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          phone: formData.phone,
          village: formData.village,
          box_id: formData.box_id,
          monthly_fee: Number(formData.monthly_fee),
          status: formData.status,
        })
        .eq('id', customer.id);

      if (error) throw error;

      toast.success('Customer updated successfully!');
      setTimeout(() => {
        setCustomer(null);
        setSearchBoxId('');
        setFormData({ name: '', phone: '', village: '', box_id: '', monthly_fee: '', endDate: '', status: 'active' });
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Error updating customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Edit className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Customer Details</h2>
      </div>

      {/* Search */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search by Box ID</label>
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchBoxId}
            onChange={(e) => setSearchBoxId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Box ID (e.g. KKR-001)"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white"
          />
          <button onClick={handleSearch} disabled={loading || !searchBoxId.trim()}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            <Search className="w-5 h-5" /><span>Search</span>
          </button>
        </div>
      </div>

      {customer && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: 'name', label: 'Full Name *', type: 'text' },
              { name: 'phone', label: 'Phone Number *', type: 'tel' },
              { name: 'village', label: 'Village *', type: 'text' },
              { name: 'box_id', label: 'Box ID *', type: 'text' },
            ].map(({ name, label, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                <input type={type} name={name} value={(formData as any)[name]} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <IndianRupee className="inline w-4 h-4 mr-1" />Bill Amount *
              </label>
              <input type="number" name="monthly_fee" value={formData.monthly_fee} min="0" onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
                <option value="active">Active</option>
                <option value="deactive">Deactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />End Date
              </label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Customer'}
          </button>
        </form>
      )}
    </motion.div>
  );
};
