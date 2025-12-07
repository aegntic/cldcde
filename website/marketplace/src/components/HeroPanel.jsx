import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './HeroPanel.css'

function HeroPanel() {
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigate()

    const handleSearch = (e) => {
        e.preventDefault()
        // Implement search logic or navigation
        console.log('Searching for:', searchQuery)
    }

    const handleCategoryClick = (category) => {
        // Navigate to category or scroll to section
        const element = document.getElementById(category.toLowerCase())
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className="hero-panel">
            <img
                src="/images/hero-full.png"
                alt="Claude Code Marketplace Hero"
                className="hero-panel-image"
            />

            <div className="hero-panel-overlay">
                {/* Search Overlay */}
                <form onSubmit={handleSearch} className="hero-search-form">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for models, scripts, and tools..."
                        className="hero-search-input"
                    />
                </form>

                {/* Category Click Zones (Approximate positioning based on image) */}
                <div className="hero-categories-overlay">
                    <div className="hero-cat-zone" onClick={() => handleCategoryClick('Plugins')} title="Plugins"></div>
                    <div className="hero-cat-zone" onClick={() => handleCategoryClick('MCPs')} title="MCPs"></div>
                    <div className="hero-cat-zone" onClick={() => handleCategoryClick('Skills')} title="Skills"></div>
                    <div className="hero-cat-zone" onClick={() => handleCategoryClick('Prompts')} title="Prompts"></div>
                    <div className="hero-cat-zone" onClick={() => handleCategoryClick('Workflows')} title="Workflows"></div>
                </div>
            </div>
        </div>
    )
}

export default HeroPanel
