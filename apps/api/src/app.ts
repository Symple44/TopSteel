// apps/api/src/app.ts
import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
// import projetsRoutes from './routes/projets.routes'
// import { errorHandler } from './middleware/error.middleware'

const app: Application = express()

// Middleware de sécurité
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
// app.use('/api/projets', projetsRoutes)

// Error handling
// app.use(errorHandler)

export default app