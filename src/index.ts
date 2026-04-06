import express from 'express';
import cors from 'cors';
import subjectsRouter from './db/routes/subjects';

const app = express();
const PORT = 8000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

// Middleware
app.use(express.json());

app.use('/api/subjects', subjectsRouter);

// Root GET route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the classroom API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
