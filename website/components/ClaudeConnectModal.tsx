import React, { useState, useEffect } from 'react';
import { X, Key, Wifi, WifiOff, Check, AlertCircle, Loader2, Eye, EyeOff, Terminal } from 'lucide-react';
import { claudeCodeService, ConnectionMode } from '../services/claudeCodeService';

interface ClaudeConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnected?: () => void;
}

const ClaudeConnectModal: React.FC<ClaudeConnectModalProps> = ({ isOpen, onClose, onConnected }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState(claudeCodeService.getState());

    useEffect(() => {
        const unsubscribe = claudeCodeService.subscribe(setConnectionState);
        return unsubscribe;
    }, []);

    if (!isOpen) return null;

    const handleConnect = async () => {
        if (!apiKey.trim()) {
            setError('Please enter your API key');
            return;
        }

        setIsConnecting(true);
        setError(null);

        const success = await claudeCodeService.connectWithApiKey(apiKey);

        setIsConnecting(false);

        if (success) {
            onConnected?.();
            onClose();
        } else {
            setError(claudeCodeService.getState().error || 'Connection failed');
        }
    };

    const handleDemoMode = () => {
        claudeCodeService.enableDemoMode();
        onConnected?.();
        onClose();
    };

    const handleDisconnect = () => {
        claudeCodeService.disconnect();
        setApiKey('');
    };

    const getStatusColor = () => {
        if (connectionState.isConnected) return 'text-green-400';
        if (connectionState.error) return 'text-red-400';
        return 'text-gray-400';
    };

    const getStatusIcon = () => {
        if (connectionState.isConnected) return <Wifi size={18} className="text-green-400" />;
        if (connectionState.error) return <AlertCircle size={18} className="text-red-400" />;
        return <WifiOff size={18} className="text-gray-400" />;
    };

    const getModeLabel = (mode: ConnectionMode) => {
        switch (mode) {
            case 'api_key': return 'Connected via API Key';
            case 'local_cli': return 'Connected to Local CLI';
            case 'demo': return 'Demo Mode';
            default: return 'Disconnected';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative liquid-glass rounded-lg w-full max-w-md p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-cyber-neon" size={24} />
                        <h2 className="text-xl font-bold font-term text-white">CONNECT TO CLAUDE</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Connection Status */}
                <div className="flex items-center gap-2 mb-6 p-3 bg-black/40 rounded border border-neutral-800">
                    {getStatusIcon()}
                    <span className={`font-mono text-sm ${getStatusColor()}`}>
                        {getModeLabel(connectionState.mode)}
                    </span>
                </div>

                {/* Connected View */}
                {connectionState.isConnected && connectionState.mode !== 'demo' ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded">
                            <Check className="text-green-400" size={20} />
                            <span className="text-green-400 font-mono text-sm">
                                Live connection active
                            </span>
                        </div>

                        <button
                            onClick={handleDisconnect}
                            className="w-full py-3 border border-red-500/50 text-red-400 font-mono text-sm rounded hover:bg-red-500/10 transition"
                        >
                            DISCONNECT & CLEAR KEY
                        </button>
                    </div>
                ) : (
                    <>
                        {/* API Key Input */}
                        <div className="space-y-4 mb-6">
                            <label className="block">
                                <span className="text-gray-400 text-sm font-mono mb-2 block">
                                    ANTHROPIC API KEY
                                </span>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-ant-api03-..."
                                        className="w-full bg-black border border-neutral-700 rounded py-3 px-10 text-white font-mono text-sm focus:outline-none focus:border-cyber-neon transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                                    >
                                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </label>

                            <p className="text-xs text-gray-500 font-mono">
                                Key is stored locally in your browser. Never sent to our servers.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded mb-4">
                                <AlertCircle className="text-red-400" size={16} />
                                <span className="text-red-400 font-mono text-xs">{error}</span>
                            </div>
                        )}

                        {/* Connect Button */}
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting || !apiKey.trim()}
                            className="w-full py-3 bg-cyber-neon text-black font-bold font-mono text-sm rounded hover:bg-white hover:shadow-neon transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    CONNECTING...
                                </>
                            ) : (
                                <>
                                    <Wifi size={16} />
                                    CONNECT
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-neutral-700" />
                            <span className="text-gray-500 text-xs font-mono">OR</span>
                            <div className="flex-1 h-px bg-neutral-700" />
                        </div>

                        {/* Demo Mode */}
                        <button
                            onClick={handleDemoMode}
                            className="w-full py-3 border border-neutral-700 text-gray-400 font-mono text-sm rounded hover:border-cyber-neon hover:text-cyber-neon transition"
                        >
                            USE DEMO MODE
                        </button>

                        <p className="text-center text-xs text-gray-600 font-mono mt-2">
                            Demo mode uses mock responses
                        </p>
                    </>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-neutral-800">
                    <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyber-blue hover:text-white font-mono"
                    >
                        Get an API key from Anthropic Console →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ClaudeConnectModal;
