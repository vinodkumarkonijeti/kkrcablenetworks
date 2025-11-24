import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Don't auto-redirect logged-in users. Let them choose to go to dashboard/portal via buttons
  // or navigate directly. This prevents redirect loops.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-gradient flex items-center justify-center p-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="bg-white rounded-full w-24 h-24 overflow-hidden shadow-2xl"
            >
              {/* Logo.fill will make the image cover the circular container */}
              <div className="w-full h-full">
                <Logo fill />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl"
        >
          WELCOME!
          <br />
          <span className="text-yellow-300">KKR CABLE NETWORKS</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="space-x-4"
        >
          {currentUser ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition-all transform hover:scale-105 shadow-xl"
              >
                Go to Dashboard
              </button>
              <button
                onClick={async () => {
                  // If not logged in, send user to the login page and keep intended destination
                  if (!currentUser) {
                    navigate('/login', { state: { next: '/customer-portal' } });
                    return;
                  }

                  // Check user's actual role from Firestore
                  try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    const userRole = userDoc.exists() ? (userDoc.data() as any)?.role : null;

                    // If admin or operator, redirect to dashboard, not customer portal
                    if (userRole === 'admin' || userRole === 'operator') {
                      navigate('/dashboard', { replace: true });
                      return;
                    }

                    // For customers, ensure users/{uid} has role 'customer' and a minimal customers record exists
                    if (!userDoc.exists()) {
                      await setDoc(userDocRef, { email: currentUser.email || '', role: 'customer', createdAt: serverTimestamp() }, { merge: true });
                    } else {
                      const ud = userDoc.data() as any;
                      if (!ud.role) {
                        await setDoc(userDocRef, { role: 'customer' }, { merge: true });
                      }
                    }

                    // Check if customers record exists for this email
                    if (currentUser.email) {
                      const customersRef = collection(db, 'customers');
                      const q = query(customersRef, where('email', '==', currentUser.email));
                      const snap = await getDocs(q);
                      if (snap.empty) {
                        // create a minimal customer record so portal has data
                        await addDoc(collection(db, 'customers'), {
                          email: currentUser.email,
                          firstName: '',
                          lastName: '',
                          phoneNumber: '',
                          village: '',
                          boxId: '',
                          status: 'Active',
                          billAmount: 0,
                          billStatus: 'Unpaid',
                          createdAt: serverTimestamp()
                        });
                      }
                    }

                    navigate('/customer-portal', { replace: true });
                  } catch (err) {
                    console.error('Go to portal error:', err);
                    // fallback to navigate anyway
                    navigate('/customer-portal', { replace: true });
                  }
                }}
                className="bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600 transition-all transform hover:scale-105 shadow-xl"
              >
                Go to Portal
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
              >
                Login
              </button>
              {/* Operator registration is restricted to admin; removed from public home */}
              <button
                onClick={() => navigate('/customer-register')}
                className="bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600 transition-all transform hover:scale-105 shadow-xl"
              >
                Customer Register
              </button>
            </>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

