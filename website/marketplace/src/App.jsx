import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import CategoryNav from './components/CategoryNav'
import ProductCard from './components/ProductCard'
import ProductDetails from './components/ProductDetails'
import Checkout from './components/Checkout'
import NewsletterSignup from './components/NewsletterSignup'
import ASCIIText from './components/ASCIIText'
import { products } from './data/products'

function HomePage() {
    const featuredProducts = products.filter(p => p.category === 'Featured Models').slice(0, 4)
    const popularProducts = products.filter(p => p.category === 'Popular Scripts').slice(0, 4)
    const communityProducts = products.filter(p => p.category === 'Community').slice(0, 4)

    return (
        <>
            <CategoryNav />
            <main className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
                <section style={{ marginBottom: 'var(--space-12)' }}>
                    <ASCIIText text="Featured" variant="gradient" size="small" />
                    <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                        {featuredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>

                <section style={{ marginBottom: 'var(--space-12)' }}>
                    <ASCIIText text="Scripts" variant="gradient" size="small" />
                    <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                        {popularProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>

                <section style={{ marginBottom: 'var(--space-12)' }}>
                    <ASCIIText text="Community" variant="gradient" size="small" />
                    <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                        {communityProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>

                <NewsletterSignup />
            </main>
        </>
    )
}

function ProductPage() {
    return (
        <main className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
            <ProductDetails />
        </main>
    )
}

function CheckoutPage() {
    return (
        <main className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
            <Checkout />
        </main>
    )
}

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
        </Router>
    )
}

export default App
