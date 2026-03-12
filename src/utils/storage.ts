import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const uploadCustomerDocument = async (
  customerId: string,
  file: File,
  uploadedBy: { id?: string; name?: string } = {}
) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 50MB. Actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '_');
  const path = `customers/${customerId}/${timestamp}_${safeName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('customer-documents')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('customer-documents')
    .getPublicUrl(path);

  // Save metadata in DB
  const { data, error: dbError } = await supabase
    .from('customer_documents')
    .insert({
      customer_id: customerId,
      name: file.name,
      path,
      url: publicUrl,
      size: file.size,
      uploaded_by: uploadedBy?.id || null,
    })
    .select('id')
    .single();

  if (dbError) throw dbError;

  return { id: data.id, name: file.name, path, url: publicUrl };
};

export const listCustomerDocuments = async (customerId: string) => {
  const { data } = await supabase
    .from('customer_documents')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  return data ?? [];
};

export const deleteCustomerDocument = async (_customerId: string, docId: string, path: string) => {
  await supabase.storage.from('customer-documents').remove([path]);
  await supabase.from('customer_documents').delete().eq('id', docId);
};
