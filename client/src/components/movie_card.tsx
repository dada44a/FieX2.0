interface Movies {
    id: number;
    title: string;
    genre: string;
    imageUrl: string;
}
export const MovieCard = ({ movie }: { movie: Movies }) => {
        return (
            <div className="card max-w-80 lg:w-96 bg-base-100 shadow-sm">
                <figure>
                    <img
                        loading="lazy"
                        src={movie.imageUrl}
                        alt={movie.title} />
                </figure>
                <div className="card-body gap-3">
                    <h2 className="card-title">{movie.title}</h2>
                    <div className="flex gap-2">
                        <div className="badge badge-outline badge-secondary"> <p>{movie.genre}</p></div>
                    </div>
                    <div className="card-actions justify-center">
                        <button className="btn btn-primary w-full">Enter</button>
                    </div>
                </div>
            </div>
        )
    }