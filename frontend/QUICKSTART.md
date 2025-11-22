# Quick Start Guide

## Prerequisites

1. **Backend must be running** on `http://localhost:3000`
2. **Node.js 18+** installed
3. **Admin account** created in the backend

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file** (if not exists):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Default Admin Credentials

After running the backend seed script:
- **Email:** `admin@example.com`
- **Password:** `admin123`

## Features

✅ **Dashboard** - Overview with statistics  
✅ **Bookings** - Manage and update booking statuses  
✅ **Categories** - Create, edit, delete categories  
✅ **Services** - Create, edit, delete services  
✅ **Users** - View all registered users  
✅ **Responsive** - Works on mobile, tablet, and desktop  

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Login fails
- Verify admin account exists in database
- Check backend logs for errors
- Ensure JWT_SECRET is set in backend

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

