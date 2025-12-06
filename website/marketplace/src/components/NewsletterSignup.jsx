import { useState } from 'react'
import ASCIIText from './ASCIIText'
import './NewsletterSignup.css'

function NewsletterSignup() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (email) {
            setSubmitted(true)
        }
    }

    return (
        <section className="newsletter">
            <div className="newsletter-content">
                <ASCIIText text="Sign Up" variant="coral" size="small" />
                <p className="newsletter-description">
                    Stay updated with the latest models, scripts, and community updates.
                </p>

                {submitted ? (
                    <div className="newsletter-success">
                        <span className="success-icon">✓</span>
                        <span>Thanks for subscribing!</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="newsletter-form">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="newsletter-input"
                            required
                        />
                        <button type="submit" className="btn btn-accent">
                            Sign Up
                        </button>
                    </form>
                )}
            </div>
        </section>
    )
}

export default NewsletterSignup

