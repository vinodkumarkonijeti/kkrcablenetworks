import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'CUSTOMER' | 'BILL' | 'USER';
  entityId: string;
  entityName: string;
  details: string;
  timestamp: Date;
}

export const logActivity = async (
  userId: string,
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: 'CUSTOMER' | 'BILL' | 'USER',
  entityId: string,
  entityName: string,
  details: string
) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      userName,
      action,
      entityType,
      entityId,
      entityName,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
