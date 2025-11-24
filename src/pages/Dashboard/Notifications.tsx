import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';
import { Bell, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'CUSTOMER' | 'BILL' | 'USER';
  entityId: string;
  entityName: string;
  details: string;
  timestamp: any;
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CUSTOMER' | 'BILL' | 'USER'>('ALL');

  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Notification[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredNotifications = filter === 'ALL' 
    ? notifications 
    : notifications.filter((n) => n.entityType === filter);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'UPDATE':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Created';
      case 'UPDATE':
        return 'Updated';
      case 'DELETE':
        return 'Deleted';
      default:
        return 'Modified';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-50 border-green-200';
      case 'UPDATE':
        return 'bg-blue-50 border-blue-200';
      case 'DELETE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Activity Log</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'CUSTOMER', 'BILL', 'USER'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No activities yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-white rounded-lg border-l-4 p-4 shadow ${getActionColor(notification.action)}`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(notification.action)}
                </div>
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {notification.userName}{' '}
                        <span className="font-normal text-gray-600">
                          {getActionText(notification.action).toLowerCase()}
                        </span>
                        {' '}
                        <span className="font-medium text-gray-800">{notification.entityName}</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{notification.details}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Type: {notification.entityType}</span>
                        {notification.timestamp && (
                          <span>
                            {format(notification.timestamp.toDate ? notification.timestamp.toDate() : new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Notifications;
