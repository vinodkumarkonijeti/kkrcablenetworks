import { supabase } from '../lib/supabase';

export const logActivity = async (
  userId: string,
  _userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: 'CUSTOMER' | 'BILL' | 'USER',
  entityId: string,
  entityName: string,
  details: string
) => {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: action,
      target_type: entityType,
      target_id: entityId,
      details: { entityName, description: details },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
