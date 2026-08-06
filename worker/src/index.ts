import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import scanRoutes from './routes/scan.routes';

dotenv.config();

console.log('CodeGuard AI Worker started (Express Mode)...');
console.log(`------------------------------------------------------------`);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', scanRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Worker listening for HTTP jobs on port ${PORT}`);
});
