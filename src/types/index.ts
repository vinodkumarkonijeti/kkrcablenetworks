export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  occupation: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  village: string;
  mandal: string;
  pincode: string;
  boxId: string;
  startDate: Date;
  endDate?: Date;
  billAmount: number;
  status: 'Active' | 'Deactive';
  billStatus: 'Paid' | 'Not Paid';
  createdAt: Date;
  updatedAt: Date;
}
