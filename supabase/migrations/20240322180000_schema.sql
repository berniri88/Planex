-- ==========================================
-- PLANEX — Supabase Premium Database Schema
-- ==========================================

-- Enable the pgcrypto extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dates TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'Planning Phase',
    icon TEXT DEFAULT 'Globe',
    color TEXT DEFAULT 'bg-primary/5',
    main_currency TEXT DEFAULT 'USD',
    destination TEXT NOT NULL,
    destination_timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. PLAN BRANCHES TABLE (For "Guided Merge" and split views)
CREATE TABLE IF NOT EXISTS public.plan_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    parent_id UUID REFERENCES public.plan_branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TRAVEL ITEMS TABLE (Itinerary nodes across branches)
CREATE TABLE IF NOT EXISTS public.travel_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.plan_branches(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'vuelo', 'alojamiento', 'restaurante', etc.
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    timezone TEXT DEFAULT 'UTC',
    
    -- JSONB for locations ensures flexibility for Lat/Lng + Address
    origin JSONB, 
    destination JSONB,
    location JSONB, 
    
    estimated_cost DECIMAL(12,2),
    real_cost DECIMAL(12,2),
    currency TEXT DEFAULT 'USD',
    
    reservation_ref TEXT,
    notes TEXT,
    
    status TEXT DEFAULT 'idea', -- 'idea', 'tentativo', 'confirmado'
    attachments JSONB DEFAULT '[]'::jsonb, -- Store objects with url, name, ref
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. EXPENSES TABLE (Row Level Security target)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    paid_by_user_id UUID REFERENCES auth.users(id),
    category TEXT DEFAULT 'Other',
    is_private BOOLEAN DEFAULT false,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. EXPENSE PARTICIPANTS (Who splits what)
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    share DECIMAL(12,2) -- Exact amount this person owes/paid
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- TRIPS: Users can only view/edit trips they created
CREATE POLICY "Users can manage their own trips"
ON public.trips FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- BRANCHES: Viewable if connected to a trip the user has access to
CREATE POLICY "Users can manage branches of their trips"
ON public.plan_branches FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.trips WHERE trips.id = plan_branches.trip_id AND trips.user_id = auth.uid()
));

-- TRAVEL ITEMS: Viewable if connected to a branch of a trip the user has access to
CREATE POLICY "Users can manage items inside their branches"
ON public.travel_items FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.plan_branches
    JOIN public.trips ON trips.id = plan_branches.trip_id
    WHERE plan_branches.id = travel_items.branch_id AND trips.user_id = auth.uid()
));

-- EXPENSES: The Core Privacy Logic
CREATE POLICY "Expense visibility based on privacy & participation"
ON public.expenses FOR SELECT
USING (
    -- Public expenses inside trips you own
    (is_private = false AND EXISTS (
        SELECT 1 FROM public.trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid()
    ))
    OR 
    -- Private expenses: Only you paid it, or you participate in the split
    (is_private = true AND (
        paid_by_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.expense_participants 
            WHERE expense_participants.expense_id = expenses.id 
            AND expense_participants.user_id = auth.uid()
        )
    ))
);

CREATE POLICY "Users can insert expenses to their trips"
ON public.expenses FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Expense_participants visible to those in the trip"
ON public.expense_participants FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.expenses 
    JOIN public.trips ON trips.id = expenses.trip_id
    WHERE expenses.id = expense_participants.expense_id AND trips.user_id = auth.uid()
));
