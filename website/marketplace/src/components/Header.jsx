import { useState } from 'react'
import { Link } from 'react-router-dom'
import ASCIIText from './ASCIIText'
import './Header.css'

function Header() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <ASCIIText text="CLDCDE.CC" variant="coral" size="medium" />
                </Link>

                <div className="header-search">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search for models, scripts, and tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <nav className="header-nav">
                    <Link to="/checkout" className="nav-link">Cart</Link>
                    <button className="btn btn-accent">Sign In</button>
                </nav>
            </div>
        </header>
    )
}

export default Header
