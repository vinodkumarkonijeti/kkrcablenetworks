import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set timeout to show error if loading takes too long
    const timeout = setTimeout(() => {
      setError('Loading is taking longer than expected. Please refresh the page.');
    }, 30000); // 30 seconds

    return () => clearTimeout(timeout);
  }, []);

  if (error) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', zIndex: 50 }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '32rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#dc2626' }}>⚠️</div>
          <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden dark:bg-gray-800">
            <Logo fill size={96} />
          </div>
        </div>

        <div className="w-56">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800">
            <motion.div
              className="h-full bg-blue-600 dark:bg-indigo-400"
              initial={{ width: '0%' }}
              animate={{ width: '60%' }}
              transition={{ ease: 'easeInOut', duration: 1.2, repeat: Infinity, repeatType: 'mirror' }}
            />
          </div>
          <p className="mt-3 text-center text-gray-700 dark:text-gray-200">{message}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
