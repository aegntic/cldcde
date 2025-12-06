import { Link } from 'react-router-dom'
import './ProductCard.css'

function StarRating({ rating }) {
    return (
        <span className="stars">
            {'★'.repeat(Math.floor(rating))}
            {'☆'.repeat(5 - Math.floor(rating))}
        </span>
    )
}

function PerformanceChart({ data }) {
    const max = Math.max(...data)
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - (value / max) * 100
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="performance-chart">
            <div className="chart-header">
                <span className="chart-title">Performance</span>
                <span className="chart-value">100</span>
            </div>
            <svg viewBox="0 0 100 60" className="chart-svg">
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <polygon
                    points={`0,60 ${points} 100,60`}
                    fill="url(#chartGradient)"
                />
            </svg>
            <div className="chart-labels">
                <span>Jan</span>
                <span>50k</span>
                <span>100k</span>
            </div>
        </div>
    )
}

function ProductCard({ product }) {
    const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length

    return (
        <article className="product-card">
            <header className="product-header">
                <h3 className="product-title pixel-header">{product.name}</h3>
                <span className="product-category">{product.category}</span>
            </header>

            <div className="product-content">
                <div className="product-image-section">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="product-image"
                    />
                </div>

                <div className="product-info-section">
                    <PerformanceChart data={product.performance.data} />

                    <div className="product-reviews">
                        <h4 className="reviews-title">User Reviews</h4>
                        <div className="reviews-summary">
                            <StarRating rating={avgRating} />
                            <span className="review-count">{product.reviews.length} reviews</span>
                        </div>
                        {product.reviews.slice(0, 3).map((review, idx) => (
                            <div key={idx} className="review-item">
                                <span className="reviewer">{review.user}</span>
                                <StarRating rating={review.rating} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="product-description">
                <h4>Description</h4>
                <p>{product.description}</p>
            </div>

            <footer className="product-footer">
                <span className="product-price">${product.price.toFixed(2)}</span>
                <Link to={`/product/${product.id}`} className="btn btn-primary">
                    Download Model
                </Link>
            </footer>
        </article>
    )
}

export default ProductCard
