import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { motion } from 'framer-motion';

interface SessionContextType {
  sessionActive: boolean;
  remainingTime: number;
  isAccountLocked: boolean;
  lockoutTime: number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 2 * 60 * 1000; // Show warning at 2 minutes remaining

export function SessionProvider({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const [sessionActive, setSessionActive] = useState(true);
  const [remainingTime, setRemainingTime] = useState(INACTIVITY_TIMEOUT);
  const [showWarning, setShowWarning] = useState(false);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const inactivityTimer = useRef<NodeJS.Timeout>();
  const warningTimer = useRef<NodeJS.Timeout>();

  // Check for account lockout on mount
  useEffect(() => {
    const storedLockout = localStorage.getItem('accountLockout');
    if (storedLockout) {
      const lockoutData = JSON.parse(storedLockout);
      const now = Date.now();
      if (now < lockoutData.expiresAt) {
        setIsAccountLocked(true);
        setLockoutTime(lockoutData.expiresAt - now);
      } else {
        localStorage.removeItem('accountLockout');
        localStorage.removeItem('failedLoginAttempts');
      }
    }
  }, []);

  // Handle lockout countdown
  useEffect(() => {
    if (!isAccountLocked || lockoutTime <= 0) return;

    const timer = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1000) {
          setIsAccountLocked(false);
          localStorage.removeItem('accountLockout');
          localStorage.removeItem('failedLoginAttempts');
          addToast('Your account is now unlocked. Please try logging in again.', 'success');
          clearInterval(timer);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAccountLocked, lockoutTime, addToast]);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = () => {
    if (!currentUser || isAccountLocked) return;

    // Clear existing timers
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    setSessionActive(true);
    setShowWarning(false);
    setRemainingTime(INACTIVITY_TIMEOUT);

    // Set warning timer (fires when 2 minutes remaining)
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_TIME);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timer
    inactivityTimer.current = setTimeout(() => {
      setSessionActive(false);
      setShowWarning(false);
      handleSessionTimeout();
    }, INACTIVITY_TIMEOUT);
  };

  const handleSessionTimeout = async () => {
    try {
      await logout();
      addToast('Session expired due to inactivity. Please log in again.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const extendSession = () => {
    resetInactivityTimer();
    addToast('Session extended', 'success');
  };

  // Setup activity listeners
  useEffect(() => {
    if (!currentUser || isAccountLocked) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handler = () => {
      if (sessionActive) {
        resetInactivityTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handler);
    });

    // Initial timer setup
    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handler);
      });
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [currentUser, isAccountLocked, sessionActive]);

  // Countdown display for remaining time
  useEffect(() => {
    if (!showWarning) return;

    const countdown = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showWarning]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SessionContext.Provider value={{ sessionActive, remainingTime, isAccountLocked, lockoutTime }}>
      {children}

      {/* Session Timeout Warning Modal */}
      {showWarning && currentUser && !isAccountLocked && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4"
          >
            <h2 className="text-xl font-bold text-red-600 mb-3">Session Expiring Soon</h2>
            <p className="text-gray-700 mb-4">
              Your session will expire in <span className="font-bold text-red-600">{formatTime(remainingTime)}</span> due to inactivity.
              Click below to continue your session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSessionTimeout}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded font-semibold hover:bg-gray-400 transition"
              >
                Logout
              </button>
              <button
                onClick={extendSession}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
              >
                Continue Session
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Account Locked Modal */}
      {isAccountLocked && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4"
          >
            <h2 className="text-xl font-bold text-red-600 mb-3">Account Temporarily Locked</h2>
            <p className="text-gray-700 mb-4">
              Your account has been locked due to too many failed login attempts. 
              Please try again in <span className="font-bold text-red-600">{formatTime(lockoutTime)}</span>.
            </p>
            <p className="text-sm text-gray-500">
              This is a security measure to protect your account.
            </p>
          </motion.div>
        </div>
      )}
    </SessionContext.Provider>
  );
}
