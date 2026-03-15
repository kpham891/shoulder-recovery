-- Add optional yearly drink target to drink_goals
ALTER TABLE public.drink_goals
  ADD COLUMN IF NOT EXISTS yearly_drink_target numeric;
