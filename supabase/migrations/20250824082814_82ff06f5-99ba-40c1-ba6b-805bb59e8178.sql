-- Create the invoices storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', true);

-- Create policies for the invoices bucket
CREATE POLICY "Users can upload their own invoices" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own invoices" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public access to invoices" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices');