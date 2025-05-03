# Novo Pets Website

A modern, responsive website for Novo Pets, a premium pet services company offering grooming, hotel stays, and daycare services.

## Features

- Online booking system for grooming, hotel, and daycare services
- Admin dashboard for managing appointments
- Real-time availability checking
- Responsive design for all devices

## Technology Stack

- Frontend: React with TypeScript
- Backend: Express.js
- Database: Supabase (PostgreSQL)
- Styling: TailwindCSS 
- Authentication: JWT with Supabase Auth

## Development Guidelines

### Date Handling

The project uses specific date handling practices to ensure consistent behavior across timezones. All dates are stored and transmitted in YYYY-MM-DD format without any timezone conversions.

For detailed information, see the [Date Handling Guidelines](docs/date-handling-guidelines.md).

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   cp .env.example .env
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/client` - React frontend application
- `/api` - Express API endpoints
- `/docs` - Documentation and guidelines

## License

All rights reserved. This code is not open source and requires permission for any use outside of the Novo Pets organization. 