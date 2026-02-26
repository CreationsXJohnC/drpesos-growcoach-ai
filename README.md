# Dr. Pesos Grow Coach AI

**Your personal AI cultivation assistant — Powered by Ori Company · We Grow Life**

An AI cultivation coach that helps you diagnose plant issues, build optimized grow plans, and understand every stage of the process — guided by Dr. Pesos and powered by Ori Company's We Grow Life methodology. Beginner-friendly, pro-level insights. 24/7 support.

---

## Live Demo

> Coming soon — [drpesos-growcoach.vercel.app](#)

---

## Features

- **Dr. Pesos AI Chat** — Streaming AI assistant with cultivation expertise, friendly Dr. Pesos personality, and knowledge drawn from the We Grow Life indoor cultivation guidebook
- **Grow Calendar Generator** — Personalized week-by-week grow plan with daily tasks, environmental targets (Temp, RH, VPD, PPFD), and Dr. Pesos' signature defoliation schedule
- **Photo Plant Diagnosis** — Upload a photo of your plant for instant symptom analysis, probable causes, and corrective action steps
- **Commercial Mode** — SOP-style responses, KPI planning, and batch workflow design for licensed commercial cultivators
- **Extensible Knowledge Base** — RAG-powered retrieval from the 16-chapter indoor cultivation guidebook, with support for adding new sources
- **Subscription Tiers** — 48-hour free trial → Monthly → Commercial → Lifetime access
- **Native Mobile App** — iOS and Android apps with push notifications for daily grow task reminders

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | Next.js 15 (App Router) + TypeScript |
| Mobile | Expo SDK (React Native) |
| AI Model | Claude claude-sonnet-4-6 (Anthropic SDK) |
| Database | Supabase (PostgreSQL + Auth + Storage + pgvector) |
| Payments | Stripe |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Deployment | Vercel (web) + Expo EAS (mobile) |
| Analytics | Mixpanel |

---

## Project Structure

```
drpesos-app/
├── web/          # Next.js web application
├── mobile/       # Expo React Native mobile app
└── shared/       # Shared TypeScript types and utilities
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Bun or npm
- Supabase account
- Anthropic API key
- Stripe account
- Expo account (for mobile)

### Installation

```bash
# Clone the repo
git clone https://github.com/CreationsXJohnC/drpesos-growcoach-ai.git
cd drpesos-growcoach-ai

# Install web dependencies
cd web && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` in the `web/` directory and fill in your keys:

```bash
cp web/.env.example web/.env.local
```

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Run Locally

```bash
# Web app
cd web && npm run dev
# → http://localhost:3000

# Mobile app
cd mobile && npx expo start
```

---

## Subscription Tiers

| Tier | Price | Access |
|---|---|---|
| Free Trial | $0 | 48-hour access, 3 questions/day |
| Grower Monthly | $9–19/mo | Unlimited chat, grow calendar, photo diagnosis |
| Commercial Monthly | $49–99/mo | Above + SOP mode, KPIs, batch workflow |
| Lifetime Pass | $97–147 | Grower tier forever |

---

## About

Built by [JohnC Creations LLC](https://github.com/CreationsXJohnC) · Powered by Ori Company · We Grow Life

> "Grow clean, healthy, high-quality cannabis with simple, step-by-step guidance." — Dr. Pesos
