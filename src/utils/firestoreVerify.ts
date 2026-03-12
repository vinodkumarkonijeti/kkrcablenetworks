import { supabase } from '../lib/supabase';

export interface SupabaseStats {
  customersCount: number;
  billsCount: number;
  notificationsCount: number;
  usersCount: number;
  documentsCount: number;
}

export const getCollectionCount = async (tableName: string): Promise<number> => {
  try {
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
};

export const getFirestoreStats = async (): Promise<SupabaseStats> => {
  const [customersCount, billsCount, notificationsCount, usersCount, documentsCount] = await Promise.all([
    getCollectionCount('customers'),
    getCollectionCount('bills'),
    getCollectionCount('activity_logs'),
    getCollectionCount('users'),
    getCollectionCount('customer_documents'),
  ]);
  return { customersCount, billsCount, notificationsCount, usersCount, documentsCount };
};

export const getRecentActivities = async (limitCount = 20) => {
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limitCount);
  return data ?? [];
};

export const getAllCustomers = async () => {
  const { data } = await supabase.from('customers').select('*');
  return data ?? [];
};

export const getAllBills = async () => {
  const { data } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
};

export const getCustomerByEmail = async (_email: string) => {
  // Note: customers table doesn't have email field in Supabase schema
  return null;
};

export const verifyFirestoreCollections = async () => {
  return getFirestoreStats();
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
