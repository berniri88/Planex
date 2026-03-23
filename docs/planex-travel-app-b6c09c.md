# Planex Travel Planning App - Premium Development Plan

Planex is a high-end travel planning application that combines sophisticated itinerary management, collaborative planning, and private expense splitting to create a seamless, premium travel experience.

## Executive Summary

Planex differentiates itself through visual excellence, an intuitive "Apple-like" user experience, and advanced features like **Git-like plan branching** and **Haptic-enhanced interactions**. The app is designed for modern travelers who demand reliability (Offline-first) and privacy (Granular expense visibility).

## Technical Architecture

### Frontend Stack (Premium Web & Mobile)
- **Framework**: React 18 + Vite
- **Mobile Foundation**: **Capacitor 5+** (Enables native APIs: Haptics, Push, Biometrics)
- **Styling**: Tailwind CSS + **Framer Motion** (For fluid, life-like micro-animations)
- **State Management**: React Query (Server), Zustand (Client)
- **Offline Logic**: **PWA with Background Sync** + LocalStorage persistence
- **Icons**: Lucide React + Custom SVG micro-interactions

### Backend Stack
- **Database**: Supabase (PostgreSQL with Real-time)
- **Authentication**: Supabase Auth (Email/Social + Biometric support via Capacitor)
- **Privacy**: **Row Level Security (RLS)** (Users only see expenses they participate in)
- **External APIs**: Currency Exchange Rate API (Real-time conversions)
- **Deployment**: Vercel (Web) + App Store / Play Store (via Capacitor)

## Advanced Database Schema Detail

### Private Expenses & Splitting
```sql
-- Enhanced Expenses with Participants-only visibility
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  paid_by_user_id UUID REFERENCES profiles(id),
  is_private BOOLEAN DEFAULT false, -- If true, RLS ensures visibility ONLY to participants
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy: Users can only see expenses they are part of
CREATE POLICY "Expense visibility based on participation" ON expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM expense_splits 
    WHERE expense_splits.expense_id = expenses.id 
    AND expense_splits.user_id = auth.uid()
  ) OR paid_by_user_id = auth.uid()
);
```

### Branching System
```sql
-- Branching supports "Split View" comparison
CREATE TABLE travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_id UUID REFERENCES travels(id),
  parent_id UUID REFERENCES travel_plans(id), -- For hierarchical branching
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  metadata JSONB -- Stores state diffs for comparison
);
```

## Premium Feature Detail

### 1. "Apple-Feel" Micro-interactions
- **Fluidity**: 60fps transitions using spring physics (Framer Motion).
- **Haptic Feedback**: Subtle vibration on confirmation actions (Save, Delete, Confirm status).
- **No Drag-and-Drop**: Clean, gesture-based or menu-driven UI to avoid interaction fatigue.

### 2. The "Traveler's Clock" (Timezone Mastery)
- **Context-Aware Time**: Itinerary cards show current local time of the event.
- **Home Delta**: Sub-text showing time relative to the user's current device time ("In 3 hours", or "Arrives 9:00 PM Home Time").
- **Automatic Sync**: Updates as soon as the device changes timezone.

### 3. Visual Branch Merge (Guided)
- **Split View Comparison**: Side-by-side comparison of two plan branches.
- **Guided Conflict Resolution**: If a conflict exists (e.g., different hotels for the same date), a clean UI presents both options for the user to choose one.

### 4. PWA + Native Performance
- **Background Sync**: Edits made while in the air (offline) are queued and synced automatically upon landing.
- **Native Polish**: Capacitor provides a real splash screen and native header behavior on iOS/Android.

### 5. Multi-Currency Integration
- **Auto-Conversion**: Integrated exchange rate API calculates trip totals in a "Main Currency" while keeping original expense data.
- **Manual Overrides**: For when the traveler uses a specific cash rate.

## Feature Implementation Roadmap

### Phase 1: Foundation & Polish (Weeks 1-4)
- Setup React + Capacitor + Framer Motion.
- Implementation of "Apple-style" button and card components.
- Secure Authentication with RLS foundation for private expenses.
- Basic CRUD with Offline persistence.

### Phase 2: Advanced Logic (Weeks 5-8)
- **Timezone System**: Implementation of the Traveler's Clock logic.
- **Branching**: Branch creation and the "Split View" comparison UI.
- **Expense Privacy**: Advanced RLS and multi-currency calculations.
- **Haptic Integration**: Wiring Capacitor Haptics to key UI actions.

### Phase 3: Reliability & Scaling (Weeks 9-12)
- **Conflict Resolution UI**: Guided merge tools.
- **PWA Sync**: Background sync workers for offline editing.
- **Performance Audit**: Ensuring 60fps on mobile devices.
- **Release**: Deployment to Stores via Capacitor.

## Competitive Advantages
- **Privacy First**: Truly private expenses within group trips.
- **Branching Power**: No more "what-if" confusion in group chats.
- **Unrivaled UX**: Combining the ease of a web app with the feel of a native "premium" tool.

---
Plan confirmed and ready for implementation.
