import { createFileRoute } from '@tanstack/react-router'
import React, { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import CardSkeleton from '@/components/card_skeleton'

// Lazy load the MovieCard component
const MovieCard = React.lazy(() =>
  import('@/components/movie_card').then((module) => ({ default: module.MovieCard }))
)

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['next-three-movies'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/movies/next-three`)
      if (!res.ok) throw new Error('Failed to fetch movies')
      const json = await res.json()
      return Array.isArray(json.movies) ? json.movies : []
    },
  })

  const movies = data || []

  return (
    <>
      {/* Hero Section */}
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">
              Find. <span className="text-primary">Select. Watch</span>
            </h1>
            <p className="py-6">
              Discover films that fit your mood, check detailed showtimes, reserve your seats quickly, 
              and enjoy the convenience of planning your movie night without any hassle. Smooth, modern, 
              and designed for every movie lover.
            </p>
          </div>
        </div>
      </div>

      {/* On Air Section */}
      <section className="mx-10 min-h-screen">
        <h1 className="text-4xl font-bold">#On Air</h1>
        <div className="py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {isLoading &&
            Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)
          }

          {isError && <p className="text-red-500">Failed to load movies</p>}

          {!isLoading && !isError && movies.length === 0 && (
            <p>No movies found.</p>
          )}

          {!isLoading &&
            movies.map((movie:any) => (
              <Suspense key={movie.id} fallback={<CardSkeleton />}>
                <MovieCard movie={movie} />
              </Suspense>
            ))}
        </div>
      </section>

      {/* Upcoming Section */}
      <section className="mx-10 min-h-screen">
        <h1 className="text-4xl font-bold">#Upcoming</h1>
        <div className="py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {isLoading &&
            Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)}

          {isError && <p className="text-red-500">Failed to load movies</p>}

          {!isLoading &&
            movies.map((movie:any) => (
              <Suspense key={movie.id} fallback={<CardSkeleton />}>
                <MovieCard movie={movie} />
              </Suspense>
            ))}
        </div>
      </section>
    </>
  )
}
