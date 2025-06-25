// apps/api/src/app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
// import projetsRoutes from './routes/projets.routes'
// import { errorHandler } from './middleware/error.middleware'

const app = express()

// Middleware de sécurité
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite par IP
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
// app.use('/api/projets', projetsRoutes)

// Error handling
// app.use(errorHandler)

export default app
