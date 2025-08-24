-- Create the invoices table with proper structure
CREATE TABLE public.invoices (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  image_url text,
  date date,
  vendeur text,
  tva_total numeric(10,2),
  montant_ttc numeric(10,2),
  mode_paiement text,
  categorie text,
  numero_facture text,
  articles_description text,
  articles_quantite int2,
  articles_totale numeric(10,2)
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;

-- Set up REPLICA IDENTITY for realtime updates
ALTER TABLE public.invoices REPLICA IDENTITY FULL;