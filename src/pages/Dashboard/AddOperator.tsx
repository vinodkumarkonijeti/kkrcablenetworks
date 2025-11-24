import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useToast } from '../../contexts/ToastContext';

export const AddOperator: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = credential.user.uid;
      await setDoc(doc(db, 'users', uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        occupation: 'Operator',
        role: 'operator',
        createdAt: serverTimestamp()
      });
      addToast('Operator created successfully', 'success');
      setForm({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' });
    } catch (err: any) {
      console.error('AddOperator error', err);
      addToast(err?.message || 'Failed to create operator', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-xl font-bold mb-4">Create Operator (Admin Only)</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input required name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className="p-2 border rounded" />
          <input required name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className="p-2 border rounded" />
        </div>
        <input required name="email" value={form.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded w-full" />
        <input required name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Phone" className="p-2 border rounded w-full" />
        <input required type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" className="p-2 border rounded w-full" />
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Creating...' : 'Create Operator'}</button>
      </form>
    </div>
  );
};

export default AddOperator;
