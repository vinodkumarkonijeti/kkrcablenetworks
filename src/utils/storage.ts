import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size

export const uploadCustomerDocument = async (customerId: string, file: File, uploadedBy: { id?: string; name?: string } = {}) => {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds 50MB limit. Actual size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '_');
    const path = `customers/${customerId}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, path);

    // Uploading file

    await uploadBytes(storageRef, file);
    // File uploaded successfully

    const url = await getDownloadURL(storageRef);
    // Download URL obtained

    // Save metadata in Firestore under customers/{customerId}/documents
    const docRef = await addDoc(collection(db, 'customers', customerId, 'documents'), {
      name: file.name,
      path,
      url,
      size: file.size,
      uploadedBy: uploadedBy || null,
      createdAt: serverTimestamp()
    });

    // Document metadata saved
    return { id: docRef.id, name: file.name, path, url };
  } catch (error: any) {
    console.error('Upload failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Upload failed: ${error?.message || 'Unknown error'}`);
  }
};

export const listCustomerDocuments = async (customerId: string) => {
  const docsQuery = query(collection(db, 'customers', customerId, 'documents'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(docsQuery);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
};

export const deleteCustomerDocument = async (customerId: string, docId: string, path: string) => {
  // Delete from storage first
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (err) {
    // ignore storage deletion errors - still attempt to remove metadata
    console.warn('Storage delete failed for', path, err);
  }

  // Delete metadata
  await deleteDoc(doc(db, 'customers', customerId, 'documents', docId));
};
