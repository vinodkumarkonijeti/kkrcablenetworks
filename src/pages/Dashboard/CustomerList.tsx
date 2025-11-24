import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { Users, Trash2, Eye, Download, FileText } from 'lucide-react';
import type { Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import CustomerProfileModal from './CustomerProfileModal';
import { useToast } from '../../contexts/ToastContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const CustomerList = () => {
  const { userData } = useAuth();
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [deactiveCustomers, setDeactiveCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterVillage, setFilterVillage] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Deactive'>('All');
  const [filterBillStatus, setFilterBillStatus] = useState<'All' | 'Paid' | 'Not Paid'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'village' | 'amount'>('name');
  const [allVillages, setAllVillages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { addToast } = useToast();

  const fetchCustomers = () => {
    try {
      const customersRef = collection(db, 'customers');
      
      // Build queries based on user role
      // For operators: filter by operatorId; for admins: fetch all
      const buildQuery = (status: 'Active' | 'Deactive') => {
        if (userData?.role === 'operator' && userData?.id) {
          return query(customersRef, where('status', '==', status), where('operatorId', '==', userData.id));
        } else {
          return query(customersRef, where('status', '==', status));
        }
      };

      const activeQuery = buildQuery('Active');
      const deactiveQuery = buildQuery('Deactive');

      const unsubActive = onSnapshot(activeQuery, (snapshot) => {
        const active: Customer[] = [];
        snapshot.forEach((d) => {
          active.push({ id: d.id, ...d.data() } as Customer);
        });
        setActiveCustomers(active);
        setAllVillages([...new Set(active.map((c) => c.village))]);
        setLoading(false);
      });

      const unsubDeactive = onSnapshot(deactiveQuery, (snapshot) => {
        const deactive: Customer[] = [];
        snapshot.forEach((d) => {
          deactive.push({ id: d.id, ...d.data() } as Customer);
        });
        setDeactiveCustomers(deactive);
      });

      return () => {
        unsubActive();
        unsubDeactive();
      };
    } catch (error) {
      setMessage('Error fetching customers');
    }
  };

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterBillStatus('All');
    setFilterVillage('');
    setSortBy('name');
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const fuzzySearch = (query: string, customers: Customer[]): Customer[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    return customers.filter((customer) => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const boxId = customer.boxId.toLowerCase();

      // Exact match at start gets highest priority
      if (fullName.startsWith(lowerQuery) || boxId.startsWith(lowerQuery)) {
        return true;
      }

      // Partial match anywhere in the name or boxId
      if (fullName.includes(lowerQuery) || boxId.includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const allCustomers = [...activeCustomers, ...deactiveCustomers];
      const suggestions = fuzzySearch(value, allCustomers).slice(0, 8);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(`${customer.firstName} ${customer.lastName}`);
    setShowSuggestions(false);
  };

  const exportToExcel = () => {
    const allCustomers = [...activeCustomers, ...deactiveCustomers];
    const filteredData = getFilteredCustomers(allCustomers);

    if (filteredData.length === 0) {
      addToast('No customers to export', 'info');
      return;
    }

    const exportData = filteredData.map((customer) => ({
      'First Name': customer.firstName,
      'Last Name': customer.lastName,
      'Phone Number': customer.phoneNumber,
      'Village': customer.village,
      'Box ID': customer.boxId,
      'Bill Amount (₹)': customer.billAmount,
      'Bill Status': customer.billAmount === 0 ? 'No Due' : customer.billStatus,
      'Status': customer.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    // Set column widths
    const colWidths = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `KKR_Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast(`Exported ${filteredData.length} customers to Excel`, 'success');
  };

  const exportToPDF = async () => {
    const allCustomers = [...activeCustomers, ...deactiveCustomers];
    const filteredData = getFilteredCustomers(allCustomers);

    if (filteredData.length === 0) {
      addToast('No customers to export', 'info');
      return;
    }

    try {
      // Create a temporary container for the table
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.backgroundColor = 'white';
      container.style.width = 'fit-content';

      // Create table HTML
      let tableHTML = '<h2 style="text-align: center; margin-bottom: 20px;">KKR Cable Network - Customer List</h2>';
      tableHTML += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
      tableHTML += '<thead><tr style="background-color: #3b82f6; color: white;">';
      tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Name</th>';
      tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Phone</th>';
      tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Village</th>';
      tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Box ID</th>';
      tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Bill (₹)</th>';
      tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Status</th>';
      tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Connection</th>';
      tableHTML += '</tr></thead><tbody>';

      filteredData.forEach((customer, index) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : 'white';
        tableHTML += `<tr style="background-color: ${bgColor};">`;
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${customer.firstName} ${customer.lastName}</td>`;
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${customer.phoneNumber}</td>`;
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${customer.village}</td>`;
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${customer.boxId}</td>`;
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${customer.billAmount}</td>`;
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${customer.billAmount === 0 ? 'No Due' : customer.billStatus}</td>`;
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${customer.status}</td>`;
        tableHTML += '</tr>';
      });

      tableHTML += '</tbody></table>';
      container.innerHTML = tableHTML;
      document.body.appendChild(container);

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = pdfWidth / canvasWidth;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, canvasHeight * ratio);
      pdf.save(`KKR_Customers_${new Date().toISOString().split('T')[0]}.pdf`);

      // Clean up
      document.body.removeChild(container);
      addToast(`Exported ${filteredData.length} customers to PDF`, 'success');
    } catch (error) {
      addToast('Error generating PDF', 'error');
      console.error('PDF export error:', error);
    }
  };

  useEffect(() => {
    const cleanup = fetchCustomers();
    return cleanup;
  }, [userData?.id, userData?.role]);

  const handleDelete = async (customerId: string) => {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      addToast('Customer deleted successfully', 'success');
      setShowDeleteConfirm(null);
    } catch (error) {
      addToast('Error deleting customer', 'error');
    }
  };

  const getFilteredCustomers = (customers: Customer[]) => {
    let filtered = customers;

    // Apply search query filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const boxId = c.boxId.toLowerCase();
        return fullName.includes(lowerQuery) || boxId.includes(lowerQuery);
      });
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    if (filterBillStatus !== 'All') {
      if (filterBillStatus === 'Paid') {
        filtered = filtered.filter((c) => c.billStatus === 'Paid' || c.billAmount === 0);
      } else {
        filtered = filtered.filter((c) => c.billStatus === 'Not Paid' && c.billAmount !== 0);
      }
    }

    if (filterVillage) {
      filtered = filtered.filter((c) => c.village === filterVillage);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'village') return a.village.localeCompare(b.village);
      if (sortBy === 'amount') return b.billAmount - a.billAmount;
      return 0;
    });

    return filtered;
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
                        customer.billAmount === 0 || customer.billStatus === 'Paid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {customer.billAmount === 0 ? 'No Due' : customer.billStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap flex gap-2">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(customer.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
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

      {/* Search Section */}
      <div className="relative mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or box ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                {searchSuggestions.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectSuggestion(customer)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 transition"
                  >
                    <div className="font-semibold text-gray-800">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Box: {customer.boxId} • {customer.village}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && searchQuery && searchSuggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-center text-gray-500 z-50">
                No customers found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Active' | 'Deactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Active</option>
              <option>Deactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Status</label>
            <select
              value={filterBillStatus}
              onChange={(e) => setFilterBillStatus(e.target.value as 'All' | 'Paid' | 'Not Paid')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>Paid</option>
              <option>Not Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Village</label>
            <select
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Villages</option>
              {allVillages.map((village) => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'village' | 'amount')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="village">Village</option>
              <option value="amount">Bill Amount</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          <Download className="w-5 h-5" />
          Export to Excel
        </button>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          <FileText className="w-5 h-5" />
          Export to PDF
        </button>
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

      <CustomerTable customers={getFilteredCustomers(activeCustomers)} title="Active Customers" bgColor="border-green-500" />
      <CustomerTable customers={getFilteredCustomers(deactiveCustomers)} title="Deactive Customers" bgColor="border-red-500" />

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

      {selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </motion.div>
  );
};

