-- Activer RLS sur la table "Data base"
ALTER TABLE public."Data base" ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour la table "Data base"
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

-- Créer les politiques de storage pour les utilisateurs
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);