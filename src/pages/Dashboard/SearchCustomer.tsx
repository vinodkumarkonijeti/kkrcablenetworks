import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const SearchCustomer = () => {
  const [searchType, setSearchType] = useState<'name' | 'box_id' | 'village' | 'phone'>('box_id');
  const [searchValue, setSearchValue] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!searchValue.trim()) { setMessage('Please enter a search value'); return; }
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike(searchType, `%${searchValue.trim()}%`)
        .limit(50);

      if (error) throw error;
      setCustomers(data ?? []);
      if (!data || data.length === 0) setMessage('No customers found.');
    } catch {
      setMessage('Error searching customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const labelMap: Record<string, string> = {
    name: 'Name', box_id: 'Box ID', village: 'Village', phone: 'Phone'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Search className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Search Customer</h2>
      </div>

      {message && (
        <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">{message}</div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search By</label>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value as typeof searchType)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
            {Object.entries(labelMap).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-4">
          <input type="text" value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search by ${labelMap[searchType]}...`}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" />
          <button onClick={handleSearch} disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            <Search className="w-5 h-5" /><span>Search</span>
          </button>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Name', 'Phone', 'Village', 'Box ID', 'Status', 'Monthly Fee'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.village}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">{c.box_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">₹{c.monthly_fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};
