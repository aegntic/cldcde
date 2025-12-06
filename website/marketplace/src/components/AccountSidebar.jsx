import { useState } from 'react'
import './AccountSidebar.css'

function AccountSidebar() {
    const [settings, setSettings] = useState({
        downloads: true,
        accountSettings: false,
        support: true
    })

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const user = {
        name: 'Faypot',
        avatar: 'F',
        plan: 'Pro'
    }

    return (
        <aside className="account-sidebar">
            <div className="sidebar-user">
                <div className="user-avatar">{user.avatar}</div>
                <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-plan">{user.plan} Plan</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-item">
                    <div className="nav-item-content">
                        <span className="nav-icon">📥</span>
                        <span className="nav-label">My Downloads</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '65%' }}></div>
                    </div>
                </div>

                <div className="nav-item">
                    <div className="nav-item-content">
                        <span className="nav-icon">⚙️</span>
                        <span className="nav-label">Account Settings</span>
                    </div>
                    <button
                        className={`toggle ${settings.accountSettings ? 'active' : ''}`}
                        onClick={() => toggleSetting('accountSettings')}
                        aria-label="Toggle account settings"
                    >
                        <span className="toggle-thumb"></span>
                    </button>
                </div>

                <div className="nav-item">
                    <div className="nav-item-content">
                        <span className="nav-icon">💬</span>
                        <span className="nav-label">Support</span>
                    </div>
                    <button
                        className={`toggle ${settings.support ? 'active' : ''}`}
                        onClick={() => toggleSetting('support')}
                        aria-label="Toggle support"
                    >
                        <span className="toggle-thumb"></span>
                    </button>
                </div>
            </nav>

            <button className="btn btn-outline logout-btn">
                Log Out
            </button>
        </aside>
    )
}

export default AccountSidebar
