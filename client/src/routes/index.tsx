import { createFileRoute } from '@tanstack/react-router'
// import { MovieCard } from '@/components/movie_card'
import React, { Suspense } from 'react'
import CardSkeleton from '@/components/card_skeleton'
const MovieCard = React.lazy(() => import('@/components/movie_card').then(module => ({ default: module.MovieCard })))

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <>
      {/* Hero Section */}
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Find. <span className='text-primary'>Select. Watch</span></h1>
            <p className="py-6">
              Discover films that fit your mood, check detailed showtimes, reserve your seats quickly, and enjoy the convenience of planning your movie night without any hassle. Smooth, modern, and designed for every movie lover
            </p>
          </div>
        </div>
      </div>

      {/* On Air */}
      <section className='mx-10 min-h-screen'>
        <h1 className='text-4xl font-bold'>#On Air</h1>
        {/* movie list */}
        <div className='py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10'>
          {/* rendering and lazy loading */}
          {Array.from({ length: 5 }).map((_, index) => (
            <Suspense key={index} fallback={<CardSkeleton />}>
              <MovieCard key={index} />
            </Suspense>
          ))}
        </div>
      </section>

      {/* Upcoming Movies */}
      <section className='mx-10 min-h-screen'>
        <h1 className='text-4xl font-bold'>#Upcoming</h1>
        {/* movie list */}
        <div className='py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-10'>
          {/* rendering and lazy loading */}
          {Array.from({ length: 5 }).map((_, index) => (
            <Suspense key={index} fallback={<CardSkeleton />}>
              <MovieCard key={index} />
            </Suspense>
          ))}
        </div>
        
      </section>

      
    </>
  )
}
