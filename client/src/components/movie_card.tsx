export const MovieCard = () => {
    return (
        <div className="card max-w-80 lg:w-96 bg-base-100 shadow-sm">
            <figure>
                <img
                    loading="lazy"
                    src="https://img.daisyui.com/images/stock/photo-1494232410401-ad00d5433cfa.webp"
                    alt="Album" />
            </figure>
            <div className="card-body gap-3">
                <h2 className="card-title">Coolie (PG)</h2>
                <div className="flex gap-2">
                    <div className="badge badge-outline badge-secondary"> <p>Action</p></div>
                    <div className="badge badge-outline badge-secondary"> <p>Comedy</p></div>
                </div>
                <div className="card-actions justify-center">
                    <button className="btn btn-primary w-full">Enter</button>
                </div>
            </div>
        </div>
    )
}