/**
 * CLDCDE Pro Dashboard - Enhanced by FrontendNinja ⚡
 */

class Dashboard {
    constructor() {
        this.repositories = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRepositories();
        this.setupRealTimeUpdates();
    }

    setupEventListeners() {
        // GitHub setup button
        document.getElementById('setup-github')?.addEventListener('click', () => {
            window.location.href = '/setup/github';
        });

        // Refresh repositories
        document.getElementById('refresh-repos')?.addEventListener('click', () => {
            this.loadRepositories(true);
        });

        // Search repositories
        document.getElementById('repo-search')?.addEventListener('input', (e) => {
            this.filterRepositories(e.target.value);
        });
    }

    async loadRepositories(force = false) {
        if (this.isLoading && !force) return;
        
        this.isLoading = true;
        const container = document.getElementById('repositories-list');
        const refreshBtn = document.getElementById('refresh-repos');
        
        if (!container) return;

        // Show loading state
        if (force) {
            refreshBtn?.classList.add('loading');
            Components.showToast('Refreshing repositories...', 'info', 2000);
        } else {
            container.innerHTML = '<div class="loading-placeholder">Loading repositories...</div>';
        }

        try {
            const response = await fetch('/api/github/repos');
            const data = await response.json();
            
            if (data.success) {
                this.repositories = data.data || [];
                this.renderRepositories();
                
                if (force) {
                    Components.showToast(`Loaded ${this.repositories.length} repositories`, 'success');
                }
            } else {
                throw new Error(data.error || 'Failed to load repositories');
            }
        } catch (error) {
            console.error('Error loading repositories:', error);
            container.innerHTML = `
                <div class="error-state">
                    <h3>Failed to load repositories</h3>
                    <p>${error.message}</p>
                    <button class="btn primary" onclick="dashboard.loadRepositories(true)">Try Again</button>
                </div>
            `;
            Components.showToast('Failed to load repositories', 'error');
        } finally {
            this.isLoading = false;
            refreshBtn?.classList.remove('loading');
        }
    }

    renderRepositories(repos = this.repositories) {
        const container = document.getElementById('repositories-list');
        if (!container) return;

        if (repos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No repositories found</h3>
                    <p>Connect your GitHub account to see your repositories</p>
                    <button class="btn primary" onclick="window.location.href='/setup/github'">
                        Setup GitHub Integration
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        repos.forEach(repo => {
            const card = Components.createRepoCard(repo);
            container.appendChild(card);
        });
    }

    filterRepositories(query) {
        if (!query.trim()) {
            this.renderRepositories();
            return;
        }

        const filtered = this.repositories.filter(repo => 
            repo.name.toLowerCase().includes(query.toLowerCase()) ||
            (repo.description && repo.description.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderRepositories(filtered);
    }

    setupRealTimeUpdates() {
        // Override WebSocket message handler for dashboard
        window.handleWebSocketMessage = (message) => {
            switch (message.type) {
                case 'RepositoryUpdate':
                    this.handleRepositoryUpdate(message.data);
                    break;
                case 'GitHubSync':
                    if (message.data.status === 'completed') {
                        this.loadRepositories(true);
                    }
                    break;
                default:
                    console.log('Dashboard received:', message);
            }
        };
    }

    handleRepositoryUpdate(data) {
        // Find and update repository in current list
        const index = this.repositories.findIndex(repo => repo.name === data.name);
        if (index !== -1) {
            this.repositories[index] = { ...this.repositories[index], ...data };
            this.renderRepositories();
            Components.showToast(`Repository ${data.name} updated`, 'info');
        }
    }

    // Manual sync trigger
    async syncRepositories() {
        try {
            const response = await fetch('/api/github/sync', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                Components.showToast('Sync started...', 'info');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            Components.showToast('Sync failed: ' + error.message, 'error');
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});

// Make dashboard globally available for debugging
window.dashboard = dashboard;