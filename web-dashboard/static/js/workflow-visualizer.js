// Workflow Visualizer - CLDCDE Pro - By DesignMaestro 🎨

class WorkflowVisualizer {
    constructor(container) {
        this.container = container;
        this.nodes = new Map();
        this.connections = [];
        this.activeNode = null;
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.startAnimation();
    }

    createCanvas() {
        this.canvas = document.createElement('div');
        this.canvas.className = 'workflow-canvas';
        this.canvas.innerHTML = `
            <div class="workflow-controls">
                <button class="btn btn-icon sm" data-action="zoom-in">
                    <svg width="16" height="16" fill="currentColor">
                        <path d="M10.68 11.74a6 6 0 01-7.922-8.982 6 6 0 018.982 7.922l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04zM11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                        <path d="M7.25 4.25v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2a.75.75 0 00-1.5 0z"/>
                    </svg>
                </button>
                <button class="btn btn-icon sm" data-action="zoom-out">
                    <svg width="16" height="16" fill="currentColor">
                        <path d="M10.68 11.74a6 6 0 01-7.922-8.982 6 6 0 018.982 7.922l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04zM11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                        <path d="M5.25 6.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z"/>
                    </svg>
                </button>
                <button class="btn btn-icon sm" data-action="reset-view">
                    <svg width="16" height="16" fill="currentColor">
                        <path d="M1.705 8.005a.75.75 0 010 1.5 5.975 5.975 0 001.838 3.955 5.975 5.975 0 008.954.05.75.75 0 111.06 1.06 7.475 7.475 0 01-11.222-.04 7.475 7.475 0 01-2.332-5.02.75.75 0 011.497-.005zm12.59-5.995a.75.75 0 111.06 1.06 5.975 5.975 0 011.838 3.955.75.75 0 01-1.501.04 4.475 4.475 0 00-1.397-3.055z"/>
                    </svg>
                </button>
            </div>
            <svg class="workflow-svg" width="100%" height="100%">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" 
                                fill="var(--color-border-default)" />
                    </marker>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g class="workflow-connections"></g>
                <g class="workflow-nodes"></g>
            </svg>
            <div class="workflow-overlay"></div>
        `;
        this.container.appendChild(this.canvas);

        this.svg = this.canvas.querySelector('.workflow-svg');
        this.nodesGroup = this.svg.querySelector('.workflow-nodes');
        this.connectionsGroup = this.svg.querySelector('.workflow-connections');
        this.overlay = this.canvas.querySelector('.workflow-overlay');
    }

    setupEventListeners() {
        // Zoom controls
        this.canvas.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                switch (action) {
                    case 'zoom-in':
                        this.zoom(1.2);
                        break;
                    case 'zoom-out':
                        this.zoom(0.8);
                        break;
                    case 'reset-view':
                        this.resetView();
                        break;
                }
            }
        });

        // Pan functionality
        let isPanning = false;
        let startX, startY;
        
        this.svg.addEventListener('mousedown', (e) => {
            isPanning = true;
            startX = e.clientX;
            startY = e.clientY;
            this.svg.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            const viewBox = this.svg.viewBox.baseVal;
            viewBox.x -= dx * 0.5;
            viewBox.y -= dy * 0.5;
            
            startX = e.clientX;
            startY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            isPanning = false;
            this.svg.style.cursor = 'grab';
        });
    }

    addNode(id, data) {
        const node = {
            id,
            x: data.x || Math.random() * 600 + 100,
            y: data.y || Math.random() * 400 + 100,
            status: data.status || 'pending',
            label: data.label || id,
            type: data.type || 'default',
            metadata: data.metadata || {}
        };

        this.nodes.set(id, node);
        this.renderNode(node);
        return node;
    }

    renderNode(node) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'workflow-node');
        g.setAttribute('data-node-id', node.id);
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        
        // Node background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '-40');
        rect.setAttribute('y', '-25');
        rect.setAttribute('width', '80');
        rect.setAttribute('height', '50');
        rect.setAttribute('rx', '8');
        rect.setAttribute('class', `node-bg node-${node.status}`);
        g.appendChild(rect);

        // Node icon
        const icon = this.getNodeIcon(node.type);
        icon.setAttribute('x', '-12');
        icon.setAttribute('y', '-20');
        icon.setAttribute('width', '24');
        icon.setAttribute('height', '24');
        g.appendChild(icon);

        // Node label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('y', '15');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'node-label');
        text.textContent = node.label;
        g.appendChild(text);

        // Status indicator
        const statusCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        statusCircle.setAttribute('cx', '35');
        statusCircle.setAttribute('cy', '-20');
        statusCircle.setAttribute('r', '4');
        statusCircle.setAttribute('class', `node-status node-status-${node.status}`);
        g.appendChild(statusCircle);

        // Interactive hover area
        const hoverRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hoverRect.setAttribute('x', '-45');
        hoverRect.setAttribute('y', '-30');
        hoverRect.setAttribute('width', '90');
        hoverRect.setAttribute('height', '60');
        hoverRect.setAttribute('fill', 'transparent');
        hoverRect.setAttribute('class', 'node-hover-area');
        g.appendChild(hoverRect);

        // Event handlers
        g.addEventListener('mouseenter', () => this.showNodeTooltip(node));
        g.addEventListener('mouseleave', () => this.hideNodeTooltip());
        g.addEventListener('click', () => this.selectNode(node));

        this.nodesGroup.appendChild(g);
    }

    getNodeIcon(type) {
        const icons = {
            start: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
                <path d="M6.379 5.227A.25.25 0 006 5.442v5.117a.25.25 0 00.379.214l4.264-2.559a.25.25 0 000-.428L6.379 5.227z"/>
            </svg>`,
            process: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM2 3.5v10c0 .276.224.5.5.5h11a.5.5 0 00.5-.5v-10a.5.5 0 00-.5-.5h-11a.5.5 0 00-.5.5zm6.5 3.5a.5.5 0 01.5.5V9h1.5a.5.5 0 010 1H9v1.5a.5.5 0 01-1 0V10H6.5a.5.5 0 010-1H8V7.5a.5.5 0 01.5-.5z"/>
            </svg>`,
            decision: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                <path d="M5.255 8.576a.5.5 0 01.702-.07L7.5 9.781l2.043-2.285a.5.5 0 01.746.666l-2.4 2.685a.5.5 0 01-.734.02l-2-2.22a.5.5 0 01.07-.702z"/>
            </svg>`,
            end: `<svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                <path d="M5 6.5A1.5 1.5 0 016.5 5h3A1.5 1.5 0 0111 6.5v3A1.5 1.5 0 019.5 11h-3A1.5 1.5 0 015 9.5v-3z"/>
            </svg>`
        };

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.innerHTML = icons[type] || icons.process;
        return svg.firstElementChild;
    }

    addConnection(fromId, toId, options = {}) {
        const connection = {
            from: fromId,
            to: toId,
            type: options.type || 'default',
            label: options.label || '',
            animated: options.animated || false
        };

        this.connections.push(connection);
        this.renderConnection(connection);
        return connection;
    }

    renderConnection(connection) {
        const fromNode = this.nodes.get(connection.from);
        const toNode = this.nodes.get(connection.to);

        if (!fromNode || !toNode) return;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.calculatePath(fromNode, toNode);
        path.setAttribute('d', d);
        path.setAttribute('class', `workflow-connection ${connection.animated ? 'animated' : ''}`);
        path.setAttribute('marker-end', 'url(#arrowhead)');

        if (connection.animated) {
            path.style.strokeDasharray = '5, 5';
            path.style.animation = 'dash 1s linear infinite';
        }

        this.connectionsGroup.appendChild(path);

        // Add label if provided
        if (connection.label) {
            const midPoint = this.getMidPoint(fromNode, toNode);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', midPoint.x);
            text.setAttribute('y', midPoint.y - 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'connection-label');
            text.textContent = connection.label;
            this.connectionsGroup.appendChild(text);
        }
    }

    calculatePath(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate control points for smooth curves
        const curvature = Math.min(distance * 0.3, 50);
        const cx1 = from.x + dx * 0.25;
        const cy1 = from.y + curvature;
        const cx2 = to.x - dx * 0.25;
        const cy2 = to.y - curvature;

        return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
    }

    getMidPoint(from, to) {
        return {
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2
        };
    }

    updateNodeStatus(nodeId, status) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        node.status = status;
        
        const nodeElement = this.nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            const bg = nodeElement.querySelector('.node-bg');
            bg.setAttribute('class', `node-bg node-${status}`);
            
            const statusIndicator = nodeElement.querySelector('.node-status');
            statusIndicator.setAttribute('class', `node-status node-status-${status}`);

            // Add animation for status change
            nodeElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                nodeElement.style.transform = 'scale(1)';
            }, 300);
        }

        // Update connections if node is active
        if (status === 'active') {
            this.highlightNodeConnections(nodeId);
        }
    }

    highlightNodeConnections(nodeId) {
        this.connections.forEach(conn => {
            if (conn.from === nodeId || conn.to === nodeId) {
                const paths = this.connectionsGroup.querySelectorAll('path');
                paths.forEach(path => {
                    if (path.classList.contains('workflow-connection')) {
                        path.style.stroke = 'var(--color-accent-emphasis)';
                        path.style.strokeWidth = '2';
                    }
                });
            }
        });
    }

    showNodeTooltip(node) {
        const tooltip = document.createElement('div');
        tooltip.className = 'workflow-tooltip animate-fadeIn';
        tooltip.innerHTML = `
            <div class="tooltip-header">${node.label}</div>
            <div class="tooltip-content">
                <div class="tooltip-row">
                    <span class="tooltip-label">Status:</span>
                    <span class="tooltip-value status-${node.status}">${node.status}</span>
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Type:</span>
                    <span class="tooltip-value">${node.type}</span>
                </div>
                ${node.metadata.duration ? `
                    <div class="tooltip-row">
                        <span class="tooltip-label">Duration:</span>
                        <span class="tooltip-value">${node.metadata.duration}</span>
                    </div>
                ` : ''}
            </div>
        `;

        const rect = this.svg.getBoundingClientRect();
        tooltip.style.left = `${node.x + rect.left}px`;
        tooltip.style.top = `${node.y + rect.top - 80}px`;

        this.overlay.appendChild(tooltip);
    }

    hideNodeTooltip() {
        this.overlay.innerHTML = '';
    }

    selectNode(node) {
        // Remove previous selection
        this.nodesGroup.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current node
        const nodeElement = this.nodesGroup.querySelector(`[data-node-id="${node.id}"]`);
        if (nodeElement) {
            nodeElement.classList.add('selected');
            this.activeNode = node;
            
            // Emit selection event
            this.container.dispatchEvent(new CustomEvent('nodeSelected', {
                detail: { node }
            }));
        }
    }

    zoom(factor) {
        const viewBox = this.svg.viewBox.baseVal;
        const centerX = viewBox.x + viewBox.width / 2;
        const centerY = viewBox.y + viewBox.height / 2;
        
        viewBox.width /= factor;
        viewBox.height /= factor;
        viewBox.x = centerX - viewBox.width / 2;
        viewBox.y = centerY - viewBox.height / 2;
    }

    resetView() {
        this.svg.setAttribute('viewBox', '0 0 800 600');
    }

    startAnimation() {
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes dash {
                to {
                    stroke-dashoffset: -10;
                }
            }
            
            .workflow-node {
                transition: transform 0.3s ease;
                cursor: pointer;
            }
            
            .workflow-node:hover {
                transform: scale(1.05);
            }
            
            .workflow-node.selected .node-bg {
                stroke: var(--color-accent-emphasis);
                stroke-width: 2;
                filter: url(#glow);
            }
            
            .node-bg {
                fill: var(--color-canvas-subtle);
                stroke: var(--color-border-default);
                transition: all 0.3s ease;
            }
            
            .node-bg.node-active {
                fill: var(--color-accent-subtle);
                stroke: var(--color-accent-emphasis);
            }
            
            .node-bg.node-completed {
                fill: var(--color-success-subtle);
                stroke: var(--color-success-emphasis);
            }
            
            .node-bg.node-error {
                fill: var(--color-danger-subtle);
                stroke: var(--color-danger-emphasis);
            }
            
            .node-status {
                transition: all 0.3s ease;
            }
            
            .node-status-active {
                fill: var(--color-accent-emphasis);
                animation: pulse 2s infinite;
            }
            
            .node-status-completed {
                fill: var(--color-success-emphasis);
            }
            
            .node-status-error {
                fill: var(--color-danger-emphasis);
            }
            
            .workflow-connection {
                fill: none;
                stroke: var(--color-border-default);
                stroke-width: 1.5;
                transition: all 0.3s ease;
            }
            
            .workflow-connection.animated {
                stroke: var(--color-accent-emphasis);
            }
            
            .node-label {
                fill: var(--color-fg-default);
                font-size: 12px;
                font-weight: 500;
            }
            
            .connection-label {
                fill: var(--color-fg-muted);
                font-size: 11px;
                background: var(--color-canvas-default);
                padding: 2px 4px;
            }
            
            .workflow-tooltip {
                position: absolute;
                background: var(--color-canvas-overlay);
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                padding: 12px;
                box-shadow: 0 8px 24px rgba(1, 4, 9, 0.2);
                z-index: 1000;
                pointer-events: none;
            }
            
            .tooltip-header {
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--color-fg-default);
            }
            
            .tooltip-row {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 4px;
                font-size: 12px;
            }
            
            .tooltip-label {
                color: var(--color-fg-muted);
            }
            
            .tooltip-value {
                color: var(--color-fg-default);
                font-weight: 500;
            }
            
            @keyframes pulse {
                0%, 100% {
                    r: 4;
                    opacity: 1;
                }
                50% {
                    r: 6;
                    opacity: 0.6;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Public API for integration
    loadWorkflow(workflowData) {
        // Clear existing
        this.nodes.clear();
        this.connections = [];
        this.nodesGroup.innerHTML = '';
        this.connectionsGroup.innerHTML = '';

        // Load nodes
        workflowData.nodes.forEach(nodeData => {
            this.addNode(nodeData.id, nodeData);
        });

        // Load connections
        workflowData.connections.forEach(connData => {
            this.addConnection(connData.from, connData.to, connData);
        });

        // Auto-layout if positions not provided
        if (!workflowData.nodes[0].x) {
            this.autoLayout();
        }
    }

    autoLayout() {
        // Simple force-directed layout
        const nodes = Array.from(this.nodes.values());
        const iterations = 50;
        
        for (let i = 0; i < iterations; i++) {
            // Repulsion between nodes
            nodes.forEach((n1, i) => {
                nodes.forEach((n2, j) => {
                    if (i === j) return;
                    
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        const force = (150 - distance) / distance;
                        n1.x -= dx * force * 0.5;
                        n1.y -= dy * force * 0.5;
                        n2.x += dx * force * 0.5;
                        n2.y += dy * force * 0.5;
                    }
                });
            });

            // Attraction along connections
            this.connections.forEach(conn => {
                const n1 = this.nodes.get(conn.from);
                const n2 = this.nodes.get(conn.to);
                
                if (n1 && n2) {
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 100) {
                        const force = (distance - 100) / distance * 0.1;
                        n1.x += dx * force;
                        n1.y += dy * force;
                        n2.x -= dx * force;
                        n2.y -= dy * force;
                    }
                }
            });
        }

        // Re-render with new positions
        this.nodesGroup.innerHTML = '';
        this.connectionsGroup.innerHTML = '';
        
        nodes.forEach(node => this.renderNode(node));
        this.connections.forEach(conn => this.renderConnection(conn));
    }
}

// Export for use
window.WorkflowVisualizer = WorkflowVisualizer;