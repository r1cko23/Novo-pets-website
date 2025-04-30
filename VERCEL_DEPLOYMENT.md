# Deploying to Vercel with Supabase Transaction Pooler

This guide explains how to deploy the Novo Pets application to Vercel using the Supabase Transaction Pooler connection.

## Why Transaction Pooler?

For a serverless environment like Vercel:

- **Transaction Pooler** is optimized for stateless applications like serverless functions
- Each function invocation makes brief, isolated database connections
- Transaction Pooler connections are IPv4 compatible, avoiding IPv4/IPv6 compatibility issues
- Ideal for the type of database interactions in this application

## Environment Variables

Add the following environment variables in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://hkrybonrzhclsjdjtxvq.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DATABASE_URL` | Transaction Pooler connection string | `postgresql://postgres.hkrybonrzhclsjdjtxvq:[YOUR-PASSWORD]@db.hkrybonrzhclsjdjtxvq` |
| `JWT_SECRET` | Secret for JWT token generation | Use a secure random string |

## Vercel Deployment Steps

1. **Connect your repository**:
   - Create a new project in Vercel and connect it to your repository

2. **Configure the project**:
   - Set the Root Directory to the repository root
   - The existing `vercel.json` will configure the build settings

3. **Add environment variables**:
   - Add all the variables listed above
   - Make sure to use the Transaction Pooler connection string for `DATABASE_URL`

4. **Deploy**:
   - Click Deploy and Vercel will build and deploy your application

## Transaction Pooler Connection

The Transaction Pooler connection string follows this format:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF]
```

You can find this in your Supabase dashboard under:
- Project Settings > Database > Connection string > Transaction pooler
- Replace `[YOUR-PASSWORD]` with your actual database password

## Testing the Deployment

After deployment, verify these endpoints are working:
- `/api/bookings` - Should return bookings data
- `/api/admin/login` - Should allow admin login
- `/admin` - Should show the admin login page

## Troubleshooting

- **Connection Issues**: If you encounter database connection problems, verify your Transaction Pooler connection string is correct
- **IPv4/IPv6 Errors**: If you see IPv6 compatibility errors, confirm you're using the Transaction Pooler URL, not Direct Connection

## Security Notes

- Always use environment variables for sensitive information
- Consider using a custom domain and HTTPS
- Change the default admin password after deployment 