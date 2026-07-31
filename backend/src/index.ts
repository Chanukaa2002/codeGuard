import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import githubRoutes from './routes/github.routes';
import reportRoutes from './routes/report.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('CodeGuard AI Backend API');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/github', githubRoutes);
app.use('/api/v1/reports', reportRoutes);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`------------------------------------------------------------`);
});

// Force reload
