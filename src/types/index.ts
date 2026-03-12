export type UserRole = 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  box_id: string;
  village: string;
  mandal: string;
  address?: string;
  status: 'active' | 'deactive';
  monthly_fee: number;
  id_proof_url?: string;
  created_by: string;
  created_at: string;
}

export interface Bill {
  id: string;
  customer_id: string;
  month: number;
  year: number;
  amount: number;
  due_date: string;
  paid_status: 'paid' | 'unpaid';
  payment_date?: string;
  invoice_url?: string;
  created_at: string;
  customer?: Customer; // For joined queries
}

export interface Payment {
  id: string;
  customer_id: string;
  bill_id: string;
  payment_method: string;
  transaction_id: string;
  amount: number;
  created_at: string;
}

export interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_by?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  timestamp: string;
}
