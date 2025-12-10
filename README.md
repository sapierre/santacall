<div align="center">

# SantaCall

AI-powered personalized Santa video calls and messages for kids.

</div>

## Overview

SantaCall is a micro-SaaS that lets parents create magical Christmas experiences for their children through:

- **Personalized Santa Videos** - AI-generated video messages where Santa knows the child's name, age, interests, and wishes
- **Live Santa Calls** - Real-time video calls with an AI Santa avatar that responds conversationally

Built with [Tavus](https://tavus.io) for AI video generation and conversational video interface (CVI).

## Features

- Personalized video messages mentioning child's name, age, interests, and gift wishes
- Live 3-minute video calls with AI Santa (FaceTime-style fullscreen experience)
- Stripe checkout for payments
- Email notifications (order confirmation, video ready, call link, call completed)
- Admin dashboard to manage orders, videos, and calls
- Natural conversational script generation (no verbatim regurgitation)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe Checkout
- **AI Video**: Tavus API (video generation + CVI for live calls)
- **Video Infrastructure**: Daily.co (WebRTC)
- **Email**: React Email templates
- **Styling**: Tailwind CSS + shadcn/ui

## Environment Variables

```bash
# Tavus API
TAVUS_API_KEY=your_tavus_api_key
TAVUS_REPLICA_ID=your_santa_replica_id
TAVUS_PERSONA_ID=your_santa_persona_id
TAVUS_WEBHOOK_SECRET=random_secret_for_webhook_verification

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_SANTACALL_WEBHOOK_SECRET=whsec_...

# Pricing (in cents)
SANTACALL_VIDEO_PRICE_CENTS=799
SANTACALL_CALL_PRICE_CENTS=1299

# App URL (IMPORTANT: must be public URL for Tavus webhooks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

> **Note**: `NEXT_PUBLIC_APP_URL` must be a publicly accessible URL for Tavus webhooks to work. Using `localhost` will cause video generation callbacks to fail silently.

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (copy `.env.example` to `.env.local`)
4. Run database migrations: `pnpm --filter @turbostarter/db db:migrate`
5. Start the dev server: `pnpm dev`

## Project Structure

```
apps/web/src/
├── modules/santacall/          # Core SantaCall module
│   ├── booking/                # Booking form
│   ├── delivery/               # Video player, call embed
│   ├── order/                  # Order status page
│   └── lib/                    # API client, utilities
├── modules/marketing/santacall/ # Landing page components
└── components/cvi/             # Tavus CVI React components

packages/
├── api/src/modules/santacall/  # API routes, Stripe/Tavus integration
├── db/src/schema/santacall.ts  # Database schema
└── email/src/templates/santacall/ # Email templates
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/santacall/checkout` | Create Stripe checkout session |
| `GET /api/santacall/order` | Get order by number + token |
| `POST /api/santacall/webhook/stripe` | Stripe payment webhook |
| `POST /api/santacall/webhook/tavus` | Tavus video/call status webhook |
| `GET /api/santacall/admin/orders` | List orders (admin) |
| `GET /api/santacall/admin/video-jobs` | List video jobs (admin) |
| `GET /api/santacall/admin/conversations` | List calls (admin) |

## Order Flow

### Video Orders
1. Customer fills booking form
2. Redirected to Stripe checkout
3. Payment webhook triggers Tavus video generation
4. Tavus webhook updates order when video is ready
5. Customer receives email with video link

### Call Orders
1. Customer fills booking form + selects time slot
2. Redirected to Stripe checkout
3. Payment webhook creates Tavus conversation
4. Customer receives email with call link
5. At scheduled time, customer joins fullscreen call
6. Tavus webhook updates order when call ends

## License

Private - All rights reserved
