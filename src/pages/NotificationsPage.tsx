import { useEffect, useState } from 'react';
import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Clock,
    CheckCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read_status: boolean;
    created_at: string;
}

const NotificationsPage = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read_status: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(notifications.map(n => n.id === id ? { ...n, read_status: true } : n));
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read_status: true })
                .eq('read_status', false);

            if (error) throw error;
            setNotifications(notifications.map(n => ({ ...n, read_status: true })));
            toast.success('All marked as read');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
            case 'error': return <AlertCircle className="text-rose-500" size={20} />;
            default: return <Bell className="text-blue-500" size={20} />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Notifications</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Stay updated with system activities</p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors"
                >
                    <CheckCheck size={18} />
                    Mark all as read
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-20 text-center text-gray-400">
                        <Bell size={64} className="mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium">All caught up!</p>
                        <p>No new notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-6 flex gap-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ${!n.read_status ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                onClick={() => !n.read_status && markAsRead(n.id)}
                            >
                                <div className="mt-1">{getIcon(n.type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-bold ${n.read_status ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                            {n.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {n.message}
                                    </p>
                                </div>
                                {!n.read_status && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-3 shadow-lg shadow-blue-200" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
