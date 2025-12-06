import { useState } from 'react'
import { products } from '../data/products'
import './Checkout.css'

function Checkout() {
    const [cartItems] = useState([products[0], products[1]])
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        address: '',
        city: '',
        zip: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
    })

    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0)
    const tax = subtotal * 0.1
    const total = subtotal + tax

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        alert('Purchase completed! Thank you for your order.')
    }

    return (
        <div className="checkout">
            <h1 className="checkout-title pixel-header glow-text">Checkout</h1>

            <div className="checkout-layout">
                <div className="checkout-forms">
                    <section className="checkout-section">
                        <h2>Cart Summary</h2>
                        <div className="cart-items">
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-item">
                                    <img src={item.image} alt={item.name} className="cart-item-image" />
                                    <div className="cart-item-info">
                                        <span className="cart-item-name">{item.name}</span>
                                        <span className="cart-item-category">{item.category}</span>
                                    </div>
                                    <span className="cart-item-price">${item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="checkout-section">
                        <h2>Billing Details</h2>
                        <form onSubmit={handleSubmit} className="billing-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="address">Address</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="123 Main Street"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row form-row-2">
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="San Francisco"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="zip">ZIP Code</label>
                                    <input
                                        type="text"
                                        id="zip"
                                        name="zip"
                                        value={formData.zip}
                                        onChange={handleChange}
                                        placeholder="94102"
                                        required
                                    />
                                </div>
                            </div>
                        </form>
                    </section>

                    <section className="checkout-section">
                        <h2>Payment Method</h2>
                        <div className="payment-icons">
                            <span className="payment-icon">VISA</span>
                            <span className="payment-icon">MC</span>
                            <span className="payment-icon">AMEX</span>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="cardNumber">Card Number</label>
                                <input
                                    type="text"
                                    id="cardNumber"
                                    name="cardNumber"
                                    value={formData.cardNumber}
                                    onChange={handleChange}
                                    placeholder="4242 4242 4242 4242"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row form-row-3">
                            <div className="form-group">
                                <label htmlFor="expiry">Expiry</label>
                                <input
                                    type="text"
                                    id="expiry"
                                    name="expiry"
                                    value={formData.expiry}
                                    onChange={handleChange}
                                    placeholder="MM/YY"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cvv">CVV</label>
                                <input
                                    type="text"
                                    id="cvv"
                                    name="cvv"
                                    value={formData.cvv}
                                    onChange={handleChange}
                                    placeholder="123"
                                    required
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="checkout-sidebar">
                    <div className="order-summary">
                        <h2>Order Summary</h2>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            onClick={handleSubmit}
                        >
                            Complete Purchase
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default Checkout
