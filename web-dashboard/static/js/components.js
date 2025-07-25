/**
 * CLDCDE Pro - Frontend Components Library
 * Elite development team implementation by FrontendNinja ⚡
 */

// Component Registry
const Components = {
    // Loading States
    createLoader: (size = 'md') => {
        const loader = document.createElement('div');
        loader.className = `loader loader-${size}`;
        loader.innerHTML = `
            <div class="loader-spinner">
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="15.708 15.708">
                        <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
                    </circle>
                </svg>
            </div>
        `;
        return loader;
    },

    // Repository Card Component
    createRepoCard: (repo) => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.innerHTML = `
            <div class="repo-header">
                <a href="${repo.html_url}" class="repo-name" target="_blank">
                    <svg class="repo-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5A1 1 0 014.5 1.5h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
                    </svg>
                    ${repo.name}
                </a>
                ${repo.private ? '<span class="repo-badge private">Private</span>' : '<span class="repo-badge public">Public</span>'}
            </div>
            <p class="repo-description">${repo.description || 'No description available'}</p>
            <div class="repo-stats">
                ${repo.language ? `<span class="repo-language"><span class="language-dot" style="background-color: ${repo.language_color}"></span>${repo.language}</span>` : ''}
                <span class="repo-stars">⭐ ${repo.stargazers_count}</span>
                <span class="repo-forks">🔀 ${repo.forks_count}</span>
                <span class="repo-updated">Updated ${repo.updated_at}</span>
            </div>
        `;
        return card;
    },

    // Toast Notification System
    showToast: (message, type = 'info', duration = 3000) => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to toast container or create one
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
        
        return toast;
    },

    // Enhanced Button Component
    createButton: (text, options = {}) => {
        const btn = document.createElement('button');
        btn.className = `btn ${options.variant || 'primary'} ${options.size || 'md'}`;
        btn.innerHTML = `
            ${options.icon ? `<span class="btn-icon">${options.icon}</span>` : ''}
            <span class="btn-text">${text}</span>
            ${options.loading ? '<span class="btn-loader"></span>' : ''}
        `;
        
        if (options.loading) btn.disabled = true;
        if (options.onClick) btn.onclick = options.onClick;
        
        return btn;
    }
};