import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface ActivityLog {
  id: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  target_type: 'CUSTOMER' | 'BILL' | 'USER';
  target_id: string;
  details: any;
  timestamp: string;
}

export const Notifications = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CUSTOMER' | 'BILL' | 'USER'>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      setLogs(data ?? []);
      setLoading(false);
    };
    fetchLogs();

    const channel = supabase
      .channel('activity-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => fetchLogs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = filter === 'ALL' ? logs : logs.filter((l) => l.target_type === filter);

  const getIcon = (action: string) => {
    if (action === 'CREATE') return <Plus className="w-4 h-4 text-green-600" />;
    if (action === 'UPDATE') return <Edit className="w-4 h-4 text-blue-600" />;
    if (action === 'DELETE') return <Trash2 className="w-4 h-4 text-red-600" />;
    return <Bell className="w-4 h-4" />;
  };

  const getColor = (action: string) => {
    if (action === 'CREATE') return 'border-green-400 bg-green-50 dark:bg-green-900/20';
    if (action === 'UPDATE') return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (action === 'DELETE') return 'border-red-400 bg-red-50 dark:bg-red-900/20';
    return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Activity Log</h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['ALL', 'CUSTOMER', 'BILL', 'USER'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${filter === f
              ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No activities yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className={`rounded-lg border-l-4 p-4 shadow-sm ${getColor(log.action)}`}>
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">{getIcon(log.action)}</div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                    {log.action.toLowerCase()} — {log.target_type.toLowerCase()}
                  </p>
                  {log.details?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.details.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm') : '—'}
                  </p>
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
