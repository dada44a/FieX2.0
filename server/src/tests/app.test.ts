import { describe, it, expect } from 'vitest'

// Base URL of your running Hono server
const BASE_URL = 'http://localhost:3000'

const routesToTest = [
  { method: 'GET', path: '/' },

  // Movies
  { method: 'GET', path: '/api/movies' },
  { method: 'POST', path: '/api/movies', body: { title: 'Test Movie', duration: 120 } },
  { method: 'GET', path: '/api/movies/1' },
  { method: 'PUT', path: '/api/movies/1', body: { title: 'Updated Movie' } },
  { method: 'DELETE', path: '/api/movies/1' },

  // Screens
  { method: 'GET', path: '/api/screens' },
  { method: 'POST', path: '/api/screens', body: { name: 'Screen 1', capacity: 100 } },
  { method: 'GET', path: '/api/screens/1' },
  { method: 'PUT', path: '/api/screens/1', body: { name: 'Updated Screen' } },
  { method: 'DELETE', path: '/api/screens/1' },
  { method: 'GET', path: '/api/screens/1/seats' },

  // Seats
  { method: 'GET', path: '/api/seats' },
  { method: 'POST', path: '/api/seats', body: { row: 'A', number: 1, screenId: 1 } },
  { method: 'GET', path: '/api/seats/1' },
  { method: 'PUT', path: '/api/seats/1', body: { row: 'B' } },
  { method: 'PATCH', path: '/api/seats/1/status', body: { isBooked: true } },
  { method: 'DELETE', path: '/api/seats/1' },
  { method: 'POST', path: '/api/seats/bulk', body: [{ row: 'C', number: 1, screenId: 1 }] },

  // Shows
  { method: 'GET', path: '/api/shows' },
  { method: 'POST', path: '/api/shows', body: { movieId: 1, screenId: 1, adminId: 1, showDate: '2025-10-31', showTime: '18:00' } },
  { method: 'GET', path: '/api/shows/1' },
  { method: 'PUT', path: '/api/shows/1', body: { showTime: '19:00' } },
  { method: 'DELETE', path: '/api/shows/1' },
  { method: 'GET', path: '/api/shows/next-3-days' },

  // Users
  { method: 'GET', path: '/api/users' },
  { method: 'POST', path: '/api/users', body: { clerkId: 'C123', name: 'Test User', points: 0 } },
  { method: 'GET', path: '/api/users/C123' },
  { method: 'PUT', path: '/api/users/C123/role', body: { role: 'admin' } },
  { method: 'DELETE', path: '/api/users/C123' },

  // Tickets
  { method: 'GET', path: '/api/tickets' },
  { method: 'POST', path: '/api/tickets', body: { showId: 1, customerId: 'C123', seatId: 1 } },
  { method: 'GET', path: '/api/tickets/1' },
]

describe('Test all Hono routes with Fetch API', () => {
  for (const route of routesToTest) {
    it(`${route.method} ${route.path}`, async () => {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        body: route.body ? JSON.stringify(route.body) : undefined,
      })

      expect(res.status).toBeTypeOf('number')
      expect(res.status).toBeLessThan(600)

      const json = await res.json().catch(() => null)
      if (json) expect(json).toHaveProperty('message')
    })
  }
})
