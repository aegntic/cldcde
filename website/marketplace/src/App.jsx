import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import CategoryNav from './components/CategoryNav'
import ProductCard from './components/ProductCard'
import ProductDetails from './components/ProductDetails'
import Checkout from './components/Checkout'
import NewsletterSignup from './components/NewsletterSignup'
import AccountSidebar from './components/AccountSidebar'
import ASCIIText from './components/ASCIIText'
import HeroPanel from './components/HeroPanel'
import { products } from './data/products'

function HomePage() {
    const plugins = products.filter(p => p.category === 'Plugins').slice(0, 4)
    const mcps = products.filter(p => p.category === 'MCPs').slice(0, 4)
    const skills = products.filter(p => p.category === 'Skills').slice(0, 4)
    const prompts = products.filter(p => p.category === 'Prompts').slice(0, 4)
    const workflows = products.filter(p => p.category === 'Workflows').slice(0, 4)

    return (
        <>
            <HeroPanel />
            {/* <CategoryNav /> */}
            <main style={{ paddingBottom: 'var(--space-16)' }}>
                {/* Plugins Section */}
                {plugins.length > 0 && (
                    <section className="section-featured">
                        <div className="container">
                            <ASCIIText text="Plugins" variant="coral" size="small" />
                            <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                                {plugins.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* MCPs Section */}
                {mcps.length > 0 && (
                    <section className="section-featured">
                        <div className="container">
                            <ASCIIText text="MCPs" variant="coral" size="small" />
                            <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                                {mcps.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Skills Section */}
                {skills.length > 0 && (
                    <section className="section-popular">
                        <div className="container">
                            <ASCIIText text="Skills" variant="coral" size="small" />
                            <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                                {skills.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Prompts Section */}
                {prompts.length > 0 && (
                    <section className="section-community">
                        <div className="container">
                            <ASCIIText text="Prompts" variant="coral" size="small" />
                            <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                                {prompts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Workflows Section */}
                {workflows.length > 0 && (
                    <section className="section-popular">
                        <div className="container">
                            <ASCIIText text="Workflows" variant="coral" size="small" />
                            <div className="grid grid-2" style={{ gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
                                {workflows.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <div className="container">
                    <NewsletterSignup />
                </div>
            </main>
        </>
    )
}

function ProductPage() {
    return <ProductDetails />
}

function App() {
    return (
        <Router>
            <div className="app">
                <Header />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/checkout" element={<Checkout />} />
                </Routes>
                {/* AccountSidebar is temporarily hidden or can be added here if needed */}
                {/* <AccountSidebar /> */}
            </div>
        </Router>
    )
}

export default App
