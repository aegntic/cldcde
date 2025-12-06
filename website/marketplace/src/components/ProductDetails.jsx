import { useParams } from 'react-router-dom'
import { products } from '../data/products'
import './ProductDetails.css'

function StarRating({ rating }) {
    return (
        <span className="stars">
            {'★'.repeat(Math.floor(rating))}
            {'☆'.repeat(5 - Math.floor(rating))}
        </span>
    )
}

function ProductDetails() {
    const { id } = useParams()
    const product = products.find(p => p.id === id) || products[0]
    const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length

    return (
        <div className="product-details">
            <header className="details-header">
                <h1 className="details-title pixel-header glow-text">{product.name}</h1>
                <span className="details-category">{product.category}</span>
            </header>

            <div className="details-layout">
                <div className="details-main">
                    <div className="details-image-container">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="details-image"
                        />
                    </div>

                    <section className="details-section">
                        <h2>Description</h2>
                        <p>{product.description}</p>
                    </section>

                    {product.features && (
                        <section className="details-section">
                            <h2>Features</h2>
                            <ul className="features-list">
                                {product.features.map((feature, idx) => (
                                    <li key={idx}>{feature}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {product.installation && (
                        <section className="details-section">
                            <h2>Installation</h2>
                            <ol className="installation-list">
                                {product.installation.map((step, idx) => (
                                    <li key={idx}><code>{step}</code></li>
                                ))}
                            </ol>
                        </section>
                    )}
                </div>

                <aside className="details-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-price">
                            <span className="price-value">${product.price.toFixed(2)}</span>
                            <span className="price-label">one-time purchase</span>
                        </div>

                        <button className="btn btn-primary btn-full">
                            Download Model
                        </button>

                        <button className="btn btn-outline btn-full" style={{ marginTop: 'var(--space-3)' }}>
                            Add to Cart
                        </button>

                        <div className="sidebar-stats">
                            <div className="stat-item">
                                <span className="stat-value">{product.downloads?.toLocaleString() || '10,000+'}</span>
                                <span className="stat-label">Downloads</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{avgRating.toFixed(1)}</span>
                                <span className="stat-label">Rating</span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h3>User Reviews</h3>
                        <div className="reviews-overall">
                            <StarRating rating={avgRating} />
                            <span>{product.reviews.length} reviews</span>
                        </div>

                        {product.reviews.map((review, idx) => (
                            <div key={idx} className="review-row">
                                <div className="review-avatar">{review.user[0]}</div>
                                <div className="review-info">
                                    <span className="review-name">{review.user}</span>
                                    <StarRating rating={review.rating} />
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default ProductDetails
