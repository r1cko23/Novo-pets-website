// This is a special entry point for Vercel API functions
// It imports and exports the Express app from our server
import app from '../server/index';

// Export the Express app for Vercel serverless deployment
export default app; 