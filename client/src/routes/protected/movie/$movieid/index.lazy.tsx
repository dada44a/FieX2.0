import { useQuery } from '@tanstack/react-query';
import { createLazyFileRoute, useParams } from '@tanstack/react-router'
import React from 'react';
import { Suspense, useState } from 'react';
const MovieInfo = React.lazy(() => import('@/components/less_use/movie_info'));

export const Route = createLazyFileRoute('/protected/movie/$movieid/')({
  component: RouteComponent,
})

export const Skeleton: React.FC = () => {
  return (
    <>
      <div className='skeleton w-[200px] h-[100px] rounded-lg' />
      <div className='skeleton w-[200px] h-[100px] rounded-lg' />
      <div className='skeleton w-[200px] h-[100px] rounded-lg' />
    </>
  );
};


function RouteComponent() {
  const { movieid } = Route.useParams()
  const [tabs, setTabs] = useState(1);

  const { data, isLoading, error } = useQuery(
    {
      queryKey: ['movie'],
      queryFn: () => fetch(`http://localhost:4000/api/movies/next-3-days`).then(res => res.json())
    }
  );

  console.log(data)
  const renderCubes = (cubeNumber: number, count: number) => {
    return Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className='flex flex-col items-center justify-center w-[200px] h-[100px] rounded-lg bg-primary'>
        <h3>12:00 PM</h3>
        <p>Cube {cubeNumber}</p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen p-4">

      {/* Movie Info Section */}
      <Suspense fallback={<div>Loading movie info...</div>}>
        <MovieInfo />
      </Suspense>

      <div className='mb-50'>
        {/* Tabs */}
        <div className="tabs tabs-border">
          <input type="radio" name="my_tabs_2" className="tab" aria-label="Tab 1" defaultChecked onClick={() => setTabs(1)} />
          <input type="radio" name="my_tabs_2" className="tab" aria-label="Tab 2" onClick={() => setTabs(2)} />
          <input type="radio" name="my_tabs_2" className="tab" aria-label="Tab 3" onClick={() => setTabs(3)} />
        </div>

        {/* Tab Content */}
        <div id="content" className="mt-3 p-4 flex flex-wrap gap-4">
          {tabs === 1 &&
            <Suspense fallback={<Skeleton />}>
              {renderCubes(1, 20)}
            </Suspense>
          }
          {tabs === 2 &&
            <Suspense fallback={<Skeleton />}>
              {renderCubes(2, 5)}
            </Suspense>
          }
          {tabs === 3 &&
            <Suspense fallback={<Skeleton />}>
              {renderCubes(3, 5)}
            </Suspense>
          }
        </div>
      </div>
    </div>
  )
}
