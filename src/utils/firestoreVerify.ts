import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Utility functions to verify and manage Firestore data
 * Use these for debugging and data verification
 */

export interface FirestoreStats {
  customersCount: number;
  billsCount: number;
  notificationsCount: number;
  usersCount: number;
  documentsCount: number;
}

/**
 * Get total count of documents in a collection
 */
export const getCollectionCount = async (collectionName: string): Promise<number> => {
  try {
    const snap = await getDocs(collection(db, collectionName));
    return snap.size;
  } catch (err) {
    console.error(`Error getting count for ${collectionName}:`, err);
    return 0;
  }
};

/**
 * Get Firestore statistics
 */
export const getFirestoreStats = async (): Promise<FirestoreStats> => {
  try {
    const [customersCount, billsCount, notificationsCount, usersCount, documentsCount] = await Promise.all([
      getCollectionCount('customers'),
      getCollectionCount('bills'),
      getCollectionCount('notifications'),
      getCollectionCount('users'),
      getCollectionCount('documents')
    ]);

    return {
      customersCount,
      billsCount,
      notificationsCount,
      usersCount,
      documentsCount
    };
  } catch (err) {
    console.error('Error getting Firestore stats:', err);
    return {
      customersCount: 0,
      billsCount: 0,
      notificationsCount: 0,
      usersCount: 0,
      documentsCount: 0
    };
  }
};

/**
 * Get recent activity logs
 */
export const getRecentActivities = async (limitCount: number = 20) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    return [];
  }
};

/**
 * Get all customers
 */
export const getAllCustomers = async () => {
  try {
    const snap = await getDocs(collection(db, 'customers'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error fetching customers:', err);
    return [];
  }
};

/**
 * Get all bills
 */
export const getAllBills = async () => {
  try {
    const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error fetching bills:', err);
    return [];
  }
};

/**
 * Get customer by email (for customer portal)
 */
export const getCustomerByEmail = async (email: string) => {
  try {
    const q = query(collection(db, 'customers'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error('Error fetching customer by email:', err);
    return null;
  }
};

/**
 * Verify Firestore collections structure
 */
export const verifyFirestoreCollections = async () => {
  const stats = await getFirestoreStats();
  return stats;
};

export default {
  getCollectionCount,
  getFirestoreStats,
  getRecentActivities,
  getAllCustomers,
  getAllBills,
  getCustomerByEmail,
  verifyFirestoreCollections
};
