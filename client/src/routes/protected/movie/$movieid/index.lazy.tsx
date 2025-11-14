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
  const { movieid } = Route.useParams();
  const [tabs, setTabs] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['movie', movieid],
    queryFn: () =>
      fetch(`http://localhost:4000/api/shows/${movieid}/next-three`).then(res => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading movie data</div>;

  // Get dates from the shows object
  const showDates = data?.shows ? Object.keys(data.shows) : [];

  return (
    <div className="min-h-screen p-4">
      {/* Movie Info Section */}
      <Suspense fallback={<div>Loading movie info...</div>}>
        <MovieInfo movie={data?.movieDetails} />
      </Suspense>

      <div className="mb-50">
        {/* Tabs */}
        <div className="tabs tabs-border">
          {showDates.map((date, idx) => (
            <input
              key={date}
              type="radio"
              name="my_tabs_2"
              className="tab"
              aria-label={`Tab ${idx + 1}`}
              defaultChecked={idx === 0}
              onClick={() => setTabs(idx + 1)}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div id="content" className="mt-3 p-4 flex flex-wrap gap-4">
          {showDates.map((date, idx) => {
            if (tabs !== idx + 1) return null;

            const showsForDate = data.shows[date];
            return (
              <Suspense key={date} fallback={<Skeleton />}>
                {showsForDate.map((show:any) => (
                  <div
                    key={show.showId}
                    className="flex flex-col items-center justify-center w-[200px] h-[100px] rounded-lg bg-primary text-white"
                  >
                    <h3>{show.showDate}</h3>
                    <p>{show.title}</p>
                    <small>Screen {show.screenId}</small>
                  </div>
                ))}
              </Suspense>
            );
          })}
        </div>
      </div>
    </div>
  );
}
