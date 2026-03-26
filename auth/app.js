import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();


app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())    

// app.use(
//     cors({
//     origin:process.env.CORS_ORIGIN?.split(',') || "http://localhost:5173",
//     credentials:true
//     }),
// )
app.use(cors()); // Allow all origins for development; adjust in production


app.get('/', (req, res) => {
  res.send('Hello, World!');
});


import healthCheckRouter from './src/routes/health-check.routes.js';
app.use("/api/v1/health/",healthCheckRouter);

import authRouter from './src/routes/auth.routes.js';
app.use("/api/v1/auth",authRouter);


export default app;