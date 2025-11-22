# Shrinika Derma Admin Dashboard

Beautiful, responsive admin dashboard for managing the Shrinika Derma home-service booking business.

## Features

- 🔐 **Authentication** - Secure admin login
- 📊 **Dashboard** - Overview with statistics
- 📅 **Bookings Management** - View and update booking statuses
- 📦 **Categories Management** - CRUD operations for categories
- 🛍️ **Services Management** - CRUD operations for services
- 👥 **Users Management** - View all users
- 📱 **Fully Responsive** - Works on all devices
- 🎨 **Modern UI** - Beautiful design with Tailwind CSS

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/
│   ├── dashboard/          # Dashboard pages
│   │   ├── page.tsx        # Dashboard overview
│   │   ├── bookings/       # Bookings management
│   │   ├── categories/     # Categories management
│   │   ├── services/       # Services management
│   │   └── users/          # Users management
│   ├── login/              # Login page
│   └── page.tsx            # Home/redirect page
├── components/
│   └── layout/             # Layout components
│       ├── Sidebar.tsx     # Navigation sidebar
│       └── DashboardLayout.tsx
├── lib/
│   ├── api.ts              # Axios configuration
│   ├── types.ts            # TypeScript types
│   └── services/           # API service functions
│       ├── auth.ts
│       ├── bookings.ts
│       ├── catalog.ts
│       └── users.ts
└── public/                 # Static assets
```

## Features Overview

### Dashboard
- Statistics cards showing:
  - Total bookings
  - Pending/Confirmed/Completed bookings
  - Total categories and services
  - Total users

### Bookings Management
- View all bookings with filters
- Search by name, phone, or booking ID
- Filter by status (Pending, Confirmed, Completed, Cancelled)
- Update booking status
- View booking details

### Categories Management
- Create, edit, and delete categories
- Upload category images
- Toggle active/inactive status
- Beautiful card-based layout

### Services Management
- Create, edit, and delete services
- Assign services to categories
- Set duration and price
- Upload service images
- Toggle active/inactive status

### Users Management
- View all registered users
- Search users by name, email, phone
- View user details and role
- See registration date

## Authentication

The dashboard requires admin authentication. Users must:
1. Have a valid admin account
2. Login with email/phone and password
3. JWT token is stored in localStorage
4. Automatic redirect to login if unauthorized

## API Integration

All API calls are made through service functions in `lib/services/`. The API base URL is configured in `.env.local`.

## Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

Mobile features:
- Collapsible sidebar
- Touch-friendly buttons
- Responsive tables and grids
- Mobile-optimized modals

## Development

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000/api)

## License

Private - All rights reserved
