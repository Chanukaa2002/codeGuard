import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('CodeGuard AI Backend API');
});

app.use('/api/v1/auth', authRoutes);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`------------------------------------------------------------`);
});
