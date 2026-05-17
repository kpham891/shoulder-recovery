-- Add exact degree measurements for flexion and abduction ROM
-- Replaces the coarse bucket selects with precise PT-measured values

alter table public.logs
  add column if not exists flexion_degrees smallint check (flexion_degrees >= 0 and flexion_degrees <= 180),
  add column if not exists abduction_degrees smallint check (abduction_degrees >= 0 and abduction_degrees <= 180);
