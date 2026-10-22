ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS ssn_hash text, ADD COLUMN IF NOT EXISTS phone_hash text;
CREATE INDEX IF NOT EXISTS quotes_ssn_hash_idx ON public.quotes (ssn_hash);
CREATE INDEX IF NOT EXISTS quotes_phone_hash_idx ON public.quotes (phone_hash);