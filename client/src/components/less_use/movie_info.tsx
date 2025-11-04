const movie = {
  id: 1,
  title: "The Great Adventure",
  genre: "Action",
  releaseDate: "2025-11-15",
  description:
    "An epic journey of courage and friendship, set in breathtaking landscapes.",
  imageLink: "/placeholder-poster.jpg", // use a local image or placeholder URL
};

export default function movie_info() {
  return (
     <div className="grid grid-cols-1 lg:grid-cols-3 h-[500px] gap-4 my-20">
            {/* Poster */}
            <div className="rounded-lg overflow-hidden shadow-lg flex items-start justify-center">
              <img
                loading='lazy'
                src={movie.imageLink}
                alt={movie.title}
                className="w-[300px] h-[500px] object-cover"
              />
            </div>
    
            {/* Movie Info */}
            <div className="lg:col-span-2 flex flex-col p-3 gap-4">
              <p className="text-3xl font-semibold">{movie.title}</p>
    
              <div className="flex gap-2">
                <p className="badge badge-error">{movie.genre}</p>
              </div>
    
              <div className="flex gap-4">
                <p className="text-gray-400">Release: {movie.releaseDate}</p>
              </div>
    
              <p>{movie.description}</p>
            </div>
          </div>
    
  )
}
