-- ==========================================
-- PLANEX — Mejoras de Gastos y Colaboración
-- ==========================================

-- 1. TRIP PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.trip_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    name TEXT,
    is_companion BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENHANCING TABLES
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS travel_item_id UUID REFERENCES public.travel_items(id) ON DELETE SET NULL;

-- Ensure travel_items has cost fields (some might be missing in older migration versions)
ALTER TABLE public.travel_items ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'reference'; -- 'reference', 'reserved', 'partial', 'paid'
ALTER TABLE public.travel_items ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.travel_items ADD COLUMN IF NOT EXISTS next_payment_amount DECIMAL(12,2);
ALTER TABLE public.travel_items ADD COLUMN IF NOT EXISTS next_payment_date DATE;

-- 3. FIXING RLS RECURSION
-- First drop existing problematic policies
DROP POLICY IF EXISTS "Expense visibility based on privacy & participation" ON public.expenses;
DROP POLICY IF EXISTS "Expense_participants visible to those in the trip" ON public.expense_participants;
DROP POLICY IF EXISTS "Users can manage their own trips" ON public.trips;

-- RE-ENABLE RLS on new tables
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

-- NEW TRIP POLICIES (Allow participants to see the trip)
CREATE POLICY "Trip visibility for owners and participants"
ON public.trips FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.trip_participants 
        WHERE trip_participants.trip_id = trips.id 
        AND (trip_participants.user_id = auth.uid() OR trip_participants.email = (auth.jwt()->>'email'))
    )
);

CREATE POLICY "Owners can manage trips"
ON public.trips FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- NEW EXPENSE POLICIES (No recursion)
CREATE POLICY "Expense select rules"
ON public.expenses FOR SELECT
USING (
    -- 1. Owner of the trip sees everything
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid())
    OR
    -- 2. Participant of the specific expense sees it
    EXISTS (
        SELECT 1 FROM public.expense_participants 
        WHERE expense_participants.expense_id = expenses.id 
        AND (expense_participants.user_id = auth.uid())
    )
    OR
    -- 3. Trip companions see public expenses
    (is_private = false AND EXISTS (
        SELECT 1 FROM public.trip_participants
        WHERE trip_participants.trip_id = expenses.trip_id
        AND trip_participants.user_id = auth.uid()
        AND trip_participants.is_companion = true
    ))
);

-- NEW EXPENSE_PARTICIPANTS POLICIES
-- This depends on the TRIP owner or being the user in the participant list
CREATE POLICY "Expense participant select"
ON public.expense_participants FOR SELECT
USING (
    -- User is the participant
    auth.uid() = user_id
    OR
    -- User owns the trip the expense belongs to
    EXISTS (
        SELECT 1 FROM public.expenses
        JOIN public.trips ON trips.id = expenses.trip_id
        WHERE expenses.id = expense_participants.expense_id AND trips.user_id = auth.uid()
    )
);

-- NEW TRIP_PARTICIPANTS POLICIES
CREATE POLICY "Trip participants visibility"
ON public.trip_participants FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_participants.trip_id AND trips.user_id = auth.uid())
    OR
    user_id = auth.uid()
    OR
    email = (auth.jwt()->>'email')
);

CREATE POLICY "Owners can manage trip participants"
ON public.trip_participants FOR ALL
USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_participants.trip_id AND trips.user_id = auth.uid()));
