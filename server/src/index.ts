import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { prettyJSON } from 'hono/pretty-json'
import seatRoutes from './routes/seat.routes.js'
import screenRoutes from './routes/screen.routes.js'
import movieRoutes from './routes/movie.routes.js'
import userRoutes from './routes/user.routes.js'
import showRoutes from './routes/show.routes.js'
import ticketRoutes from './routes/ticket.routes.js'
import { cors } from 'hono/cors'


export const app = new Hono()

app.use('*', prettyJSON())
app.use('*', cors())

// routes
app.route('/api/seats', seatRoutes)
app.route('/api/screens', screenRoutes)
app.route('/api/movies', movieRoutes)
app.route('/api/users', userRoutes)
app.route('/api/shows', showRoutes)
app.route('/api/tickets', ticketRoutes)

app.get('/', (c) => {
  return c.json({ message: 'Hello, World!' })
})




serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
