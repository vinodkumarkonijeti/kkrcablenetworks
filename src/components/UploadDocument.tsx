import { useEffect, useState } from 'react';
import { uploadCustomerDocument, listCustomerDocuments, deleteCustomerDocument } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Trash2, DownloadCloud, Upload } from 'lucide-react';

interface UploadDocumentProps {
  customerId: string;
}

const UploadDocument = ({ customerId }: UploadDocumentProps) => {
  const { userData } = useAuth();
  const { addToast } = useToast();
  const [files, setFiles] = useState<FileList | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    try {
      const list = await listCustomerDocuments(customerId);
      setDocs(list);
    } catch (err) {
      console.error('Error listing documents', err);
      addToast('Failed to load documents', 'error');
    }
  };

  useEffect(() => {
    if (customerId) fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleUpload = async () => {
    if (!files || !customerId) {
      addToast('Please select a file first', 'error');
      return;
    }
    setLoading(true);
    try {
      const uploaded = [] as any[];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Uploading file
        const res = await uploadCustomerDocument(customerId, file, { id: userData?.id, name: `${userData?.firstName || ''} ${userData?.lastName || ''}` });
        uploaded.push(res);
      }
      setFiles(null as any);
      addToast(`Successfully uploaded ${uploaded.length} document(s)`, 'success');
      await fetchDocs();
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err?.message || 'Unknown error';
      addToast(`Upload failed: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string, path: string) => {
    if (!customerId) return;
    setLoading(true);
    try {
      await deleteCustomerDocument(customerId, docId, path);
      addToast('Document deleted successfully', 'success');
      await fetchDocs();
    } catch (err: any) {
      console.error('Delete doc error', err);
      addToast(`Delete failed: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
      <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Customer Documents</h3>
      <div className="flex gap-2 items-center mb-3">
        <input 
          type="file" 
          multiple 
          onChange={(e) => setFiles(e.target.files)}
          disabled={loading}
          className="text-sm text-gray-500 dark:text-gray-400"
        />
        <button
          onClick={handleUpload}
          disabled={!files || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded flex items-center gap-2 transition"
        >
          <Upload className="w-4 h-4" />
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between border dark:border-gray-700 p-2 rounded dark:bg-gray-700">
              <div>
                <a href={d.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  {d.name}
                </a>
                <div className="text-xs text-gray-500 dark:text-gray-400">Uploaded by: {d.uploadedBy?.name || 'Unknown'}</div>
              </div>
              <div className="flex items-center gap-2">
                <a href={d.url} target="_blank" rel="noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                  <DownloadCloud className="w-5 h-5" />
                </a>
                <button onClick={() => handleDelete(d.id, d.path)} disabled={loading} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UploadDocument;
