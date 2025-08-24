-- Modify the existing "Data base" table to add all required columns for invoices
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS fournisseur text;
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS categorie text;
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS mode_paiement text;
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS article_description text;
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS article_quantite integer;
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS article_prix_unitaire decimal(10,2);
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS article_total decimal(10,2);
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS total_ht decimal(10,2);
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS tva decimal(10,2);
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS total_ttc decimal(10,2);
ALTER TABLE public."Data base" ADD COLUMN IF NOT EXISTS image_url text;

-- Enable Row Level Security on the table
ALTER TABLE public."Data base" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own invoices" 
ON public."Data base" 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" 
ON public."Data base" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public."Data base" 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public."Data base" 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for invoice images
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

-- Create storage policies for invoice images
CREATE POLICY "Users can view their own invoice images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own invoice images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own invoice images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own invoice images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for the table
ALTER TABLE public."Data base" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public."Data base";