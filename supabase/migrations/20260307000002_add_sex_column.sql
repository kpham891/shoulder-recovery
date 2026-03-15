-- Add sex column to drink_goals if not present
ALTER TABLE public.drink_goals
  ADD COLUMN IF NOT EXISTS sex text DEFAULT 'unspecified';
