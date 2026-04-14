import express from 'express';
import cors from 'cors';
import subjectsRouter from './db/routes/subjects';
import securityMiddleware from './middleware/security';
import { isArcjetKeyValid } from './config/arcjet';

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL is not defined in environment variables');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

// Middleware
app.use(express.json());

// Only apply security middleware if ARCJET_KEY is valid and not expired
if (isArcjetKeyValid()) {
  app.use(securityMiddleware);
} else {
  console.warn('ARCJET_KEY is invalid or expired. Security middleware is disabled.');
}

app.use('/api/subjects', subjectsRouter);

// Root GET route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the classroom API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
