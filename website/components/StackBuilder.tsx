import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Copy, Check, Terminal, Layers } from 'lucide-react';

interface StackItem {
    id: string;
    name: string;
    category: string;
    type: 'agent' | 'command' | 'setting' | 'hook' | 'mcp' | 'skill';
}

interface StackBuilderProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
    agent: '🤖',
    command: '⚡',
    setting: '⚙️',
    hook: '🪝',
    mcp: '🔌',
    skill: '🎨',
};

const StackBuilder: React.FC<StackBuilderProps> = ({ isOpen, onClose }) => {
    const [stack, setStack] = useState<StackItem[]>([]);
    const [copied, setCopied] = useState(false);

    // Load stack from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('cldcde_stack');
        if (saved) {
            try {
                setStack(JSON.parse(saved));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Save stack to localStorage on change
    useEffect(() => {
        localStorage.setItem('cldcde_stack', JSON.stringify(stack));
    }, [stack]);

    const removeItem = (id: string) => {
        setStack(prev => prev.filter(item => item.id !== id));
    };

    const clearStack = () => {
        setStack([]);
    };

    const generateInstallCommand = () => {
        if (stack.length === 0) return '';
        const items = stack.map(item => `${item.type}:${item.id}`).join(' ');
        return `npx cldcde-install@latest ${items}`;
    };

    const copyCommand = async () => {
        const command = generateInstallCommand();
        if (command) {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const groupedStack = stack.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
    }, {} as Record<string, StackItem[]>);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md liquid-glass z-50 flex flex-col font-term animate-slide-in">
                {/* Header */}
                <div className="h-14 bg-transparent border-b border-cyber-border flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Layers className="text-cyber-neon" size={20} />
                        <span className="text-cyber-neon font-bold tracking-widest">STACK BUILDER</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition hover:rotate-90">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {stack.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Layers className="mx-auto mb-4 opacity-30" size={48} />
                            <p className="font-mono text-sm">Your stack is empty</p>
                            <p className="text-xs mt-2 text-gray-600">
                                Add items from the marketplace to build your stack
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Grouped items */}
                            {Object.entries(groupedStack).map(([type, items]) => (
                                <div key={type} className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider">
                                        <span>{CATEGORY_ICONS[type] || '📦'}</span>
                                        <span>{type}s ({items.length})</span>
                                    </div>
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 obsidian rounded transition group"
                                        >
                                            <div>
                                                <div className="text-white font-bold text-sm">{item.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.category}</div>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer with install command */}
                {stack.length > 0 && (
                    <div className="border-t border-cyber-border bg-[#050505] p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="font-mono">{stack.length} items in stack</span>
                            <button
                                onClick={clearStack}
                                className="text-red-400/70 hover:text-red-400 transition"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="relative">
                            <div className="bg-black border border-cyber-neon/30 rounded p-3 font-mono text-xs text-cyber-neon break-all pr-12">
                                {generateInstallCommand()}
                            </div>
                            <button
                                onClick={copyCommand}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-cyber-neon transition"
                                title="Copy command"
                            >
                                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                        </div>

                        <p className="text-[10px] text-gray-600 text-center">
                            Navigate to your project root and run the generated command
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default StackBuilder;

// Export function to add items to stack (can be called from other components)
export const addToStack = (item: StackItem) => {
    const saved = localStorage.getItem('cldcde_stack');
    let stack: StackItem[] = [];
    if (saved) {
        try {
            stack = JSON.parse(saved);
        } catch {
            // Ignore
        }
    }
    // Don't add duplicates
    if (!stack.find(s => s.id === item.id)) {
        stack.push(item);
        localStorage.setItem('cldcde_stack', JSON.stringify(stack));
    }
};
