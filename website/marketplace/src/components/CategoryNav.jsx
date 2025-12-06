import { Link } from 'react-router-dom'
import { categories } from '../data/products'
import './CategoryNav.css'

function CategoryNav() {
    return (
        <nav className="category-nav">
            <div className="category-nav-container">
                {categories.map(category => (
                    <Link
                        key={category.id}
                        to={`/category/${category.id}`}
                        className="category-tile"
                    >
                        <div className="category-image-wrapper">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="category-image"
                            />
                        </div>
                        <span className="category-name pixel-header">{category.name}</span>
                    </Link>
                ))}
            </div>
        </nav>
    )
}

export default CategoryNav
