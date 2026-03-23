# 🌍 Planex — Premium Travel Planning

Planex is a sophisticated travel planning application designed for modern explorers. It combines elegant itinerary management with collaborative group tools.

## ✨ Premium Features
- **Traveler's Clock**: Smart timezone management with contextual countdowns.
- **Apple-inspired Micro-interactions**: Fluid transitions and feedback.
- **Offline Persistence**: Sessions and data available even when in the air.
- **Branching system**: Explore alternative plans like a pro.

## 🚀 Getting Started

### 1. Install Dependencies
Due to local permission restrictions, please run the following command in your terminal:
```bash
npm install
```

### 2. Configure Environment
Rename `.env.example` to `.env` and add your **Supabase** credentials:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 3. Run Development Server
```bash
npm run dev
```

## 🛠 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Native**: Capacitor
- **State/Auth**: Supabase, Zustand, TanStack Query
