import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Calendar, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logActivity } from '../../utils/activityLogger';
import toast from 'react-hot-toast';

export const AddCustomer = () => {
  const { user, userData } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    village: '',
    mandal: '',
    pincode: '',
    boxId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    billAmount: '200',
    status: 'active' as 'active' | 'deactive',
    billStatus: 'unpaid' as 'paid' | 'unpaid',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('You must be logged in.'); return; }

    setLoading(true);
    try {
      // Ensure profile exists
      if (!userData) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('users').upsert({
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email!,
            role: 'operator',
          }, { onConflict: 'id' });
        }
      }

      const billAmount = Number(formData.billAmount);
      const customerName = `${formData.firstName} ${formData.lastName}`.trim();

      const { data, error } = await supabase.from('customers').insert({
        name: customerName,
        phone: formData.phoneNumber,
        village: formData.village,
        mandal: formData.mandal,
        box_id: formData.boxId,
        monthly_fee: billAmount,
        status: formData.status,
        address: formData.pincode,
        created_by: user.id,
      }).select('id').single();

      if (error) throw error;

      await logActivity(user.id, userData?.name || 'User', 'CREATE', 'CUSTOMER', data.id, customerName, `Added new customer with Box ID: ${formData.boxId}`);

      toast.success('Customer added successfully!');
      
      // WhatsApp Automation Trigger
      const confirmMessage = window.confirm('Customer added! Would you like to send the welcome message via WhatsApp?');
      if (confirmMessage) {
          const { sendAutomationMessage } = await import('../../utils/automation');
          const link = await sendAutomationMessage({
              phone: formData.phoneNumber,
              customerName: customerName,
              type: 'welcome',
              details: { box_id: formData.boxId }
          });
          window.open(link, '_blank');
      }

      setFormData({
        firstName: '', lastName: '', phoneNumber: '', village: '',
        mandal: '', pincode: '', boxId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        billAmount: '200', status: 'active', billStatus: 'unpaid',
      });
    } catch (error: any) {
      toast.error(error.message || 'Error adding customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'firstName', label: 'First Name *', type: 'text' },
    { name: 'lastName', label: 'Last Name *', type: 'text' },
    { name: 'phoneNumber', label: 'Phone Number *', type: 'tel' },
    { name: 'village', label: 'Village *', type: 'text' },
    { name: 'mandal', label: 'Mandal *', type: 'text' },
    { name: 'pincode', label: 'Pincode', type: 'text' },
    { name: 'boxId', label: 'Box ID *', type: 'text' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
      <div className="flex items-center space-x-3 mb-6">
        <UserPlus className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Add New Customer</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {fields.map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
              <input
                type={type}
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                required={label.includes('*')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />Start Date *
            </label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <IndianRupee className="inline w-4 h-4 mr-1" />Bill Amount *
            </label>
            <input type="number" name="billAmount" value={formData.billAmount} onChange={handleChange} required min="0"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" />
            {Number(formData.billAmount) === 0 && (
              <p className="text-sm text-green-600 mt-1">✓ Bill amount is 0 - will be marked as Paid</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
            <select name="status" value={formData.status} onChange={handleChange} required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
              <option value="active">Active</option>
              <option value="deactive">Deactive</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Adding Customer...' : 'Add Customer'}
        </button>
      </form>
    </motion.div>
  );
};
