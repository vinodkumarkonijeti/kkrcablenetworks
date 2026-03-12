export type UserRole = 'admin' | 'operator' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface UserSettings {
  monthly_fee: number;
  tax_rate: number;
  currency: string;
}

export interface Customer {
  id: string;
  customer_id?: string;
  name: string;
  phone: string;
  email?: string;
  box_id: string;
  village: string;
  mandal: string;
  address?: string;
  area?: string;
  connection_type?: 'Cable' | 'Internet' | 'Combo';
  plan_id?: string;
  status: 'active' | 'deactive';
  account_status?: 'Active' | 'Suspended' | 'Disconnected';
  monthly_fee: number;
  outstanding_amount?: number;
  installation_date?: string;
  id_proof_url?: string;
  created_by: string;
  created_at: string;
}

export interface Plan {
  id: string;
  plan_name: string;
  plan_type: 'Cable' | 'Internet' | 'Combo';
  price: number;
  channels?: string;
  internet_speed?: string;
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

export interface Complaint {
  complaint_id: string;
  customer_id: string;
  issue_type: string;
  description?: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  created_at: string;
  customer?: Customer;
}

export interface Technician {
  technician_id: string;
  name: string;
  phone: string;
  assigned_area?: string;
  created_at: string;
}

export interface ServiceRequest {
  request_id: string;
  customer_id: string;
  technician_id?: string;
  request_type: string;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed';
  scheduled_date?: string;
  created_at: string;
  customer?: Customer;
  technician?: Technician;
}
