import { motion } from 'framer-motion';
import { Users, TrendingUp, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  onSelect: (tab: string) => void;
  variant?: 'overlay' | 'permanent';
  showToggle?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open = false, onClose = () => {}, onSelect, variant = 'overlay', showToggle = false, collapsed = false, onToggleCollapse = () => {} }) => {
  // Overlay variant: same as before (for mobile)
  if (variant === 'overlay') {
    return (
      <>
        {/* overlay */}
        {open && <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-40 z-30" />}

        <motion.aside
          initial={{ x: -320 }}
          animate={{ x: open ? 0 : -320 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-40 shadow-lg p-4"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Menu</h3>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {showToggle && (
            <div className="mb-4">
              <ThemeToggle />
            </div>
          )}

          <nav className="flex flex-col gap-2">
            <button onClick={() => onSelect('overview')} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button onClick={() => onSelect('list')} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <Users className="w-4 h-4" />
              <span>Customer List</span>
            </button>
            <button onClick={() => onSelect('add')} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <Users className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </nav>
        </motion.aside>
      </>
    );
  }

  // Permanent variant: left column that pushes content to the right
  const widthClass = collapsed ? 'w-20' : 'w-72';
  return (
    <aside className={`fixed left-0 top-0 bottom-0 ${widthClass} bg-white dark:bg-gray-900 z-20 shadow-lg p-4 hidden md:flex flex-col`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${collapsed ? 'hidden' : ''}`}>Menu</h3>
        <button onClick={onToggleCollapse} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {showToggle && (
        <div className={`mb-4 ${collapsed ? 'flex justify-center' : ''}`}>
          <ThemeToggle />
        </div>
      )}

      <nav className="flex flex-col gap-2">
        <button onClick={() => onSelect('overview')} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left">
          <TrendingUp className="w-4 h-4" />
          <span className={`${collapsed ? 'hidden' : ''}`}>Overview</span>
        </button>
        <button onClick={() => onSelect('list')} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left">
          <Users className="w-4 h-4" />
          <span className={`${collapsed ? 'hidden' : ''}`}>Customer List</span>
        </button>
        <button onClick={() => onSelect('add')} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left">
          <Users className="w-4 h-4" />
          <span className={`${collapsed ? 'hidden' : ''}`}>Add Customer</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
