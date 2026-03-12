import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Trash2, Eye, Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomerProfileModal from './CustomerProfileModal';
import { useToast } from '../../contexts/ToastContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const CustomerList = () => {
  const [activeCustomers, setActiveCustomers] = useState<any[]>([]);
  const [deactiveCustomers, setDeactiveCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [filterVillage, setFilterVillage] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'village' | 'amount'>('name');
  const [allVillages, setAllVillages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { addToast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('name');
    const all = data ?? [];
    const active = all.filter((c) => c.status === 'active');
    const deactive = all.filter((c) => c.status === 'deactive');
    setActiveCustomers(active);
    setDeactiveCustomers(deactive);
    setAllVillages([...new Set(all.map((c) => c.village).filter(Boolean))]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();

    let timeoutId: NodeJS.Timeout;
    const channel = supabase
      .channel('customer-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        // Debounce refetch to avoid rapid-fire updates
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fetchCustomers, 1000);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      clearTimeout(timeoutId);
    };
  }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      addToast('Error deleting customer', 'error');
    } else {
      addToast('Customer deleted successfully', 'success');
      setShowDeleteConfirm(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0) {
      const all = [...activeCustomers, ...deactiveCustomers];
      const lower = value.toLowerCase();
      const suggestions = all
        .filter((c) => c.name?.toLowerCase().includes(lower) || c.box_id?.toLowerCase().includes(lower))
        .slice(0, 8);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const filteredActive = useMemo(() => {
    const lower = searchQuery.toLowerCase().trim();
    return activeCustomers.filter(c => 
      (!lower || c.name?.toLowerCase().includes(lower) || c.box_id?.toLowerCase().includes(lower)) &&
      (!filterVillage || c.village === filterVillage)
    ).sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'village') return (a.village || '').localeCompare(b.village || '');
      if (sortBy === 'amount') return (b.monthly_fee ?? 0) - (a.monthly_fee ?? 0);
      return 0;
    });
  }, [activeCustomers, searchQuery, filterVillage, sortBy]);

  const filteredDeactive = useMemo(() => {
    const lower = searchQuery.toLowerCase().trim();
    return deactiveCustomers.filter(c => 
      (!lower || c.name?.toLowerCase().includes(lower) || c.box_id?.toLowerCase().includes(lower)) &&
      (!filterVillage || c.village === filterVillage)
    ).sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'village') return (a.village || '').localeCompare(b.village || '');
      if (sortBy === 'amount') return (b.monthly_fee ?? 0) - (a.monthly_fee ?? 0);
      return 0;
    });
  }, [deactiveCustomers, searchQuery, filterVillage, sortBy]);

  const exportToExcel = () => {
    try {
      const dataToExport = [...filteredActive, ...filteredDeactive];
      
      if (!dataToExport.length) { 
        addToast('No customers to export', 'error'); 
        return; 
      }

      // Prepare data with better headers
      const data = dataToExport.map((c) => ({
        'Customer Name': c.name || 'N/A',
        'Phone Number': c.phone || 'N/A',
        'Setup Box ID': c.box_id || 'N/A',
        'Village/Area': c.village || 'N/A',
        'Mandal': c.mandal || 'N/A',
        'Monthly Fee (INR)': c.monthly_fee || 0,
        'Active Status': c.status === 'active' ? 'Active' : 'Deactivated',
        'Registration Date': c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'
      }));

      // Create worksheet and workbook correctly
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      
      // Use a more robust write method
      XLSX.writeFile(wb, `KKR_Network_Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      addToast(`Export successful: ${data.length} records`, 'success');
    } catch (error) {
      console.error('Export Failure:', error);
      addToast('Export failed. Please check browser permissions.', 'error');
    }
  };

  const exportToPDF = async () => {
    const dataArr = [...filteredActive, ...filteredDeactive];
    if (!dataArr.length) { addToast('No customers to export', 'info'); return; }
    const container = document.createElement('div');
    container.style.cssText = 'padding:20px;background:white;width:fit-content;';
    container.innerHTML = `
      <h2 style="text-align:center;margin-bottom:16px;">KKR Cable Network — Customer List</h2>
      <table style="border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#3b82f6;color:white;">
          <th style="border:1px solid #ddd;padding:8px;">Name</th>
          <th style="border:1px solid #ddd;padding:8px;">Phone</th>
          <th style="border:1px solid #ddd;padding:8px;">Village</th>
          <th style="border:1px solid #ddd;padding:8px;">Box ID</th>
          <th style="border:1px solid #ddd;padding:8px;">Amount</th>
          <th style="border:1px solid #ddd;padding:8px;">Status</th>
        </tr></thead>
        <tbody>${dataArr.map((c, i) => `
          <tr style="background:${i % 2 === 0 ? '#f9fafb' : 'white'}">
            <td style="border:1px solid #ddd;padding:8px;">${c.name}</td>
            <td style="border:1px solid #ddd;padding:8px;">${c.phone}</td>
            <td style="border:1px solid #ddd;padding:8px;">${c.village}</td>
            <td style="border:1px solid #ddd;padding:8px;">${c.box_id}</td>
            <td style="border:1px solid #ddd;padding:8px;text-align:right;">₹${c.monthly_fee}</td>
            <td style="border:1px solid #ddd;padding:8px;">${c.status}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2 });
      const pdf = new jsPDF('l', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, canvas.height * w / canvas.width);
      pdf.save(`KKR_Customers_${new Date().toISOString().slice(0, 10)}.pdf`);
      addToast(`Exported ${dataArr.length} customers to PDF`, 'success');
    } finally {
      document.body.removeChild(container);
    }
  };

  const CustomerTable = ({ customers, title, accent }: { customers: any[]; title: string; accent: string }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
      <div className={`flex items-center gap-3 mb-4 pb-4 border-b-2 ${accent}`}>
        <Users className="w-6 h-6" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title} ({customers.length})</h3>
      </div>
      {customers.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No customers found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Name', 'Phone', 'Village', 'Box ID', 'Monthly Fee', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.village}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">{c.box_id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{c.monthly_fee}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => setSelectedCustomer(c)} className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(c.id)} className="text-red-600 hover:text-red-800">
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Customer Lists</h2>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Search</label>
          <div className="relative">
            <input type="text" placeholder="Search by name or box ID..."
              value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {searchSuggestions.map((c) => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-0">
                    <div className="font-medium text-gray-800 dark:text-gray-100">{c.name}</div>
                    <div className="text-xs text-gray-500">Box: {c.box_id} • {c.village}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Village</label>
            <select value={filterVillage} onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
              <option value="">All Villages</option>
              {allVillages.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white">
              <option value="name">Name</option>
              <option value="village">Village</option>
              <option value="amount">Bill Amount</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilterVillage(''); setSortBy('name'); setSearchQuery(''); }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">
          <Download className="w-5 h-5" />Export Excel
        </button>
        <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition">
          <FileText className="w-5 h-5" />Export PDF
        </button>
      </div>

      <CustomerTable customers={filteredActive} title="Active Customers" accent="border-green-500" />
      <CustomerTable customers={filteredDeactive} title="Deactive Customers" accent="border-red-500" />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this customer? This cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Delete</button>
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedCustomer && (
        <CustomerProfileModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </motion.div>
  );
};
