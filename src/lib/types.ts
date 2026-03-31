// ==========================================
// PLANEX — Mock Data (Phase 2: Enhanced)
// ==========================================

// --- Core Types ---

export type TravelItemCategory = 'vuelo' | 'bus' | 'tren' | 'taxi' | 'otro_transporte' | 'alojamiento' | 'actividad' | 'restaurante' | 'otros';

export interface LocationData {
  address: string;
  lat?: number;
  lng?: number;
}

export interface Attachment {
  id: string;
  url: string; // Base64 or Real URL
  name: string;
  referenceText?: string;
}

export interface TravelItem {
  id: string;
  type: TravelItemCategory;
  name: string;
  description: string;
  url?: string;
  start_time: string;
  end_time?: string;
  timezone: string;
  
  // Transport specific
  origin?: LocationData;
  destination?: LocationData;
  // Non-transport specific
  location?: LocationData;

  estimated_cost?: number;
  real_cost?: number;
  currency?: string;

  reservation_ref?: string;
  notes?: string;

  status: 'idea' | 'tentativo' | 'confirmado';
  branchId?: string; // Which branch this item belongs to
  
  attachments?: Attachment[];
  gpx_url?: string;
  custom_icon?: string; // Lucide icon name (PascalCase)
  
  // Payment tracking (v2)
  payment_status?: 'reference' | 'reserved' | 'partial' | 'paid';
  amount_paid?: number;
  next_payment_amount?: number;
  next_payment_date?: string; // ISO Date
}

export interface TripParticipant {
  id: string;
  trip_id: string;
  user_id?: string;
  email?: string;
  name?: string;
  is_companion: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  name: string;
  dates: string;
  startDate: string;
  endDate: string;
  status: string;
  icon: string;
  color: string;
  mainCurrency: string;
  destination: string;
  destinationTimezone: string;
  background_url?: string;
  participants?: TripParticipant[];
}

export interface PlanBranch {
  id: string;
  tripId: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  description: string;
  color: string;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  participants: string[];
  date: string;
  category: 'Food' | 'Transport' | 'Attraction' | 'Accommodation' | 'Shopping' | 'Other';
  is_private: boolean;
  exchangeRate?: number; // Manual override rate
  convertedAmount?: number; // Amount in trip's main currency
  travel_item_id?: string; // Link to Itinerary Item
}

export interface Balance {
  user: string;
  amount: number;
  status: 'owe_me' | 'i_owe';
  avatar?: string;
}

// Types Only

