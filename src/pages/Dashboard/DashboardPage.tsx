import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Footer } from '../../components/Footer';
import Logo from '../../components/Logo';
import { CustomerGraph } from './CustomerGraph';
import { AddCustomer } from './AddCustomer';
import { EditCustomer } from './EditCustomer';
import { SearchCustomer } from './SearchCustomer';
import { CustomerList } from './CustomerList';
import { ChangeEmail } from './ChangeEmail';
import { ChangePassword } from './ChangePassword';

type TabType = 'overview' | 'add' | 'edit' | 'search' | 'list' | 'changeEmail' | 'changePassword';

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size={40} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">KKR Cable Networks</h1>
                <p className="text-gray-600">Welcome, {userData?.firstName} {userData?.lastName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 shadow-xl"
          >
            <p className="text-lg font-semibold text-green-600">Logout successfully!</p>
          </motion.div>
        </div>
      )}

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto space-x-1 py-2">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'list', label: 'Customer Lists', icon: Users },
              { id: 'add', label: 'Add Customer', icon: Users },
              { id: 'edit', label: 'Edit Customer', icon: Users },
              { id: 'search', label: 'Search Customer', icon: Users },
              { id: 'changeEmail', label: 'Change Email', icon: Users },
              { id: 'changePassword', label: 'Change Password', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 flex-grow">
        {activeTab === 'overview' && <CustomerGraph />}
        {activeTab === 'add' && <AddCustomer />}
        {activeTab === 'edit' && <EditCustomer />}
        {activeTab === 'search' && <SearchCustomer />}
        {activeTab === 'list' && <CustomerList />}
        {activeTab === 'changeEmail' && <ChangeEmail />}
        {activeTab === 'changePassword' && <ChangePassword />}
      </main>

      <Footer />
    </div>
  );
};
