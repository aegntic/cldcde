import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Command, Search, ArrowRight, Zap, Package, Settings, Terminal, X } from 'lucide-react';
import { MOCK_PRODUCTS } from '../constants';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSDK: () => void;
    onOpenStack: () => void;
    addToCart: (product: any) => void;
}

interface CommandItem {
    id: string;
    label: string;
    description: string;
    category: 'action' | 'product' | 'navigation';
    action: () => void;
    icon: React.ReactNode;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onOpenSDK,
    onOpenStack,
    addToCart
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Build command list
    const commands = useMemo<CommandItem[]>(() => {
        const actions: CommandItem[] = [
            {
                id: 'open-sdk',
                label: 'Launch SDK Demo',
                description: 'Open the interactive SDK panel',
                category: 'action',
                action: () => { onOpenSDK(); onClose(); },
                icon: <Terminal size={16} />
            },
            {
                id: 'open-stack',
                label: 'Open Stack Builder',
                description: 'View and manage your component stack',
                category: 'action',
                action: () => { onOpenStack(); onClose(); },
                icon: <Package size={16} />
            },
            {
                id: 'scroll-top',
                label: 'Go to Top',
                description: 'Scroll to the top of the page',
                category: 'navigation',
                action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); onClose(); },
                icon: <ArrowRight size={16} className="rotate-[-90deg]" />
            },
        ];

        const productCommands: CommandItem[] = MOCK_PRODUCTS.map(product => ({
            id: `product-${product.id}`,
            label: product.name,
            description: `$${product.price} - ${product.category}`,
            category: 'product',
            action: () => { addToCart(product); onClose(); },
            icon: <Zap size={16} />
        }));

        return [...actions, ...productCommands];
    }, [onOpenSDK, onOpenStack, onClose, addToCart]);

    // Filter commands based on query
    const filteredCommands = useMemo(() => {
        if (!query) return commands;
        const lower = query.toLowerCase();
        return commands.filter(cmd =>
            cmd.label.toLowerCase().includes(lower) ||
            cmd.description.toLowerCase().includes(lower)
        );
    }, [commands, query]);

    // Reset selection when filtered results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard handling
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(i => Math.max(i - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    // Global Cmd+K listener
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                }
                // Opening is handled by parent
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Palette */}
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 animate-scale-in">
                <div className="liquid-glass rounded-lg overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-cyber-border">
                        <Command className="text-cyber-blue shrink-0" size={18} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-gray-600"
                        />
                        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded text-[10px] text-gray-500 font-mono">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {filteredCommands.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 font-mono text-sm">
                                No results found
                            </div>
                        ) : (
                            <div className="py-2">
                                {filteredCommands.map((cmd, index) => (
                                    <button
                                        key={cmd.id}
                                        onClick={cmd.action}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${index === selectedIndex
                                            ? 'bg-cyber-blue/10 text-white'
                                            : 'text-gray-400 hover:bg-white/5'
                                            }`}
                                    >
                                        <span className={`shrink-0 ${index === selectedIndex ? 'text-cyber-blue' : 'text-gray-500'}`}>
                                            {cmd.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono font-medium text-sm truncate">{cmd.label}</div>
                                            <div className="text-xs text-gray-600 truncate">{cmd.description}</div>
                                        </div>
                                        {index === selectedIndex && (
                                            <ArrowRight className="text-cyber-blue shrink-0" size={14} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-cyber-border text-[10px] text-gray-600 font-mono">
                        <div className="flex items-center gap-4">
                            <span><kbd className="bg-neutral-800 px-1 py-0.5 rounded">↑↓</kbd> Navigate</span>
                            <span><kbd className="bg-neutral-800 px-1 py-0.5 rounded">↵</kbd> Select</span>
                        </div>
                        <span>{filteredCommands.length} results</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommandPalette;
