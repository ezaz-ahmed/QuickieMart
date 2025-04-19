import express, { Request } from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

interface CustomRequest extends Request {
  user?: any;
}

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: CustomRequest) => (req.user ? 1000 : 100),
  message: { error: 'Too many requests, please try again later!' },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

app.use(limiter);

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use('/', proxy(process.env.PROXY_TARGET || 'http://localhost:6001'));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
