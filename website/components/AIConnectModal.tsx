import React, { useState, useEffect } from 'react';
import { X, Key, Wifi, WifiOff, Check, AlertCircle, Loader2, Eye, EyeOff, Terminal, ChevronDown, Globe, RefreshCw } from 'lucide-react';
import { aiService, AIProvider, PROVIDERS, ConnectionState, OpenRouterModel } from '../services/aiService';

interface AIConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnected?: () => void;
}

const AIConnectModal: React.FC<AIConnectModalProps> = ({ isOpen, onClose, onConnected }) => {
    const [provider, setProvider] = useState<AIProvider>('openai');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [customBaseUrl, setCustomBaseUrl] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>(aiService.getState());

    // OpenRouter dynamic model loading
    const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [keyValidated, setKeyValidated] = useState(false);
    const [modelFilter, setModelFilter] = useState('');

    useEffect(() => {
        const unsubscribe = aiService.subscribe(setConnectionState);
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Reset model and validation state when provider changes
        const config = PROVIDERS[provider];
        setModel(config.defaultModel);
        setKeyValidated(false);
        setOpenRouterModels([]);
        setModelFilter('');
    }, [provider]);

    if (!isOpen) return null;

    const currentConfig = PROVIDERS[provider];

    // Validate OpenRouter key and fetch models
    const handleValidateOpenRouterKey = async () => {
        if (!apiKey.trim()) {
            setError('Please enter your API key');
            return;
        }

        setIsLoadingModels(true);
        setError(null);

        // Validate the key first
        const validation = await aiService.validateOpenRouterKey(apiKey);

        if (!validation.valid) {
            setError(validation.error || 'Invalid API key');
            setIsLoadingModels(false);
            return;
        }

        // Fetch available models
        const models = await aiService.fetchOpenRouterModels(apiKey);

        if (models.length === 0) {
            setError('Failed to fetch models. Please check your API key.');
            setIsLoadingModels(false);
            return;
        }

        setOpenRouterModels(models);
        setKeyValidated(true);
        setModel(models[0]?.id || 'openai/gpt-4o');
        setIsLoadingModels(false);
    };

    const handleConnect = async () => {
        if (!apiKey.trim()) {
            setError('Please enter your API key');
            return;
        }

        // For OpenRouter, require key validation first
        if (provider === 'openrouter' && !keyValidated) {
            await handleValidateOpenRouterKey();
            return;
        }

        if (provider === 'custom' && !customBaseUrl.trim()) {
            setError('Please enter the base URL for custom endpoint');
            return;
        }

        setIsConnecting(true);
        setError(null);

        const success = await aiService.connect(
            provider,
            apiKey,
            model || currentConfig.defaultModel,
            provider === 'custom' ? customBaseUrl : undefined
        );

        setIsConnecting(false);

        if (success) {
            onConnected?.();
            onClose();
        } else {
            setError(aiService.getState().error || 'Connection failed');
        }
    };

    const handleDemoMode = () => {
        aiService.enableDemoMode();
        onConnected?.();
        onClose();
    };

    const handleDisconnect = () => {
        aiService.disconnect();
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

    const getProviderLink = (provider: AIProvider): string => {
        switch (provider) {
            case 'openai': return 'https://platform.openai.com/api-keys';
            case 'anthropic': return 'https://console.anthropic.com/settings/keys';
            case 'openrouter': return 'https://openrouter.ai/keys';
            case 'groq': return 'https://console.groq.com/keys';
            case 'zai':
            case 'zai_coding':
            case 'zai_china':
                return 'https://z.ai/usercenter/apikeys';
            default: return '#';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative liquid-glass rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-cyber-neon" size={24} />
                        <h2 className="text-xl font-bold font-term text-white">CONNECT AI</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Connection Status */}
                <div className="flex items-center gap-2 mb-6 p-3 bg-black/40 rounded border border-neutral-800">
                    {getStatusIcon()}
                    <span className={`font-mono text-sm ${getStatusColor()}`}>
                        {connectionState.isConnected
                            ? `${PROVIDERS[connectionState.provider].name} (${connectionState.model})`
                            : 'Disconnected'
                        }
                    </span>
                </div>

                {/* Connected View */}
                {connectionState.isConnected && connectionState.model !== 'demo' ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded">
                            <Check className="text-green-400" size={20} />
                            <span className="text-green-400 font-mono text-sm">
                                Connected to {PROVIDERS[connectionState.provider].name}
                            </span>
                        </div>

                        <button
                            onClick={handleDisconnect}
                            className="w-full py-3 border border-red-500/50 text-red-400 font-mono text-sm rounded hover:bg-red-500/10 transition"
                        >
                            DISCONNECT & CLEAR
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Provider Selection */}
                        <div className="space-y-4 mb-4">
                            <label className="block">
                                <span className="text-gray-400 text-sm font-mono mb-2 block">
                                    AI PROVIDER
                                </span>
                                <div className="relative">
                                    <select
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value as AIProvider)}
                                        className="w-full bg-black border border-neutral-700 rounded py-3 px-4 text-white font-mono text-sm appearance-none focus:outline-none focus:border-cyber-neon transition cursor-pointer"
                                    >
                                        <option value="openai">OpenAI (GPT-4o, GPT-4)</option>
                                        <option value="anthropic">Anthropic (Claude 3.5)</option>
                                        <option value="groq">Groq (Llama 3, FREE tier)</option>
                                        <option value="openrouter">OpenRouter (400+ models)</option>
                                        <option value="zai">Zhipu AI (GLM-4)</option>
                                        <option value="zai_coding">Zhipu CodeGeeX (Code)</option>
                                        <option value="zai_china">Zhipu AI (China Direct)</option>
                                        <option value="custom">Custom Endpoint</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                                </div>
                            </label>
                        </div>

                        {/* Custom Base URL (for custom provider) */}
                        {provider === 'custom' && (
                            <div className="space-y-4 mb-4">
                                <label className="block">
                                    <span className="text-gray-400 text-sm font-mono mb-2 block">
                                        BASE URL
                                    </span>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            value={customBaseUrl}
                                            onChange={(e) => setCustomBaseUrl(e.target.value)}
                                            placeholder="https://your-api.com/v1"
                                            className="w-full bg-black border border-neutral-700 rounded py-3 px-10 text-white font-mono text-sm focus:outline-none focus:border-cyber-neon transition"
                                        />
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* API Key Input */}
                        <div className="space-y-4 mb-4">
                            <label className="block">
                                <span className="text-gray-400 text-sm font-mono mb-2 block">
                                    API KEY
                                    {currentConfig.keyPrefix && (
                                        <span className="text-gray-600 ml-2">({currentConfig.keyPrefix}...)</span>
                                    )}
                                </span>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={currentConfig.keyPrefix ? `${currentConfig.keyPrefix}...` : 'API key'}
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
                        </div>

                        {/* Model Selection - OpenRouter dynamic models */}
                        {provider === 'openrouter' && keyValidated && openRouterModels.length > 0 && (
                            <div className="space-y-4 mb-4">
                                <label className="block">
                                    <span className="text-gray-400 text-sm font-mono mb-2 flex items-center justify-between">
                                        <span>MODEL ({openRouterModels.length} available)</span>
                                        <button
                                            type="button"
                                            onClick={handleValidateOpenRouterKey}
                                            className="text-cyber-blue hover:text-white transition flex items-center gap-1"
                                            disabled={isLoadingModels}
                                        >
                                            <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} />
                                            Refresh
                                        </button>
                                    </span>
                                    {/* Search filter */}
                                    <input
                                        type="text"
                                        value={modelFilter}
                                        onChange={(e) => setModelFilter(e.target.value)}
                                        placeholder="Filter models..."
                                        className="w-full bg-black border border-neutral-700 rounded py-2 px-3 text-white font-mono text-xs focus:outline-none focus:border-cyber-neon transition mb-2"
                                    />
                                    <div className="relative">
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full bg-black border border-neutral-700 rounded py-3 px-4 text-white font-mono text-sm appearance-none focus:outline-none focus:border-cyber-neon transition cursor-pointer"
                                        >
                                            {openRouterModels
                                                .filter(m =>
                                                    m.id.toLowerCase().includes(modelFilter.toLowerCase()) ||
                                                    m.name.toLowerCase().includes(modelFilter.toLowerCase())
                                                )
                                                .slice(0, 100) // Limit to 100 for performance
                                                .map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name} {m.pricing.prompt === '0' ? '(FREE)' : `($${parseFloat(m.pricing.prompt) * 1000000}/M)`}
                                                    </option>
                                                ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Model Selection - Standard providers */}
                        {provider !== 'openrouter' && currentConfig.models.length > 1 && (
                            <div className="space-y-4 mb-4">
                                <label className="block">
                                    <span className="text-gray-400 text-sm font-mono mb-2 block">
                                        MODEL
                                    </span>
                                    <div className="relative">
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full bg-black border border-neutral-700 rounded py-3 px-4 text-white font-mono text-sm appearance-none focus:outline-none focus:border-cyber-neon transition cursor-pointer"
                                        >
                                            {currentConfig.models.map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                                    </div>
                                </label>
                            </div>
                        )}

                        <p className="text-xs text-gray-500 font-mono mb-4">
                            Key stored locally in your browser. Never sent to our servers.
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded mb-4">
                                <AlertCircle className="text-red-400 shrink-0" size={16} />
                                <span className="text-red-400 font-mono text-xs">{error}</span>
                            </div>
                        )}

                        {/* Loading Models indicator for OpenRouter */}
                        {isLoadingModels && (
                            <div className="flex items-center gap-2 p-3 bg-cyber-blue/10 border border-cyber-blue/30 rounded mb-4">
                                <Loader2 className="text-cyber-blue animate-spin" size={16} />
                                <span className="text-cyber-blue font-mono text-xs">Validating key & fetching models...</span>
                            </div>
                        )}

                        {/* Connect Button */}
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting || isLoadingModels || !apiKey.trim()}
                            className="w-full py-3 bg-cyber-neon text-black font-bold font-mono text-sm rounded hover:bg-white hover:shadow-neon transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    CONNECTING...
                                </>
                            ) : isLoadingModels ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    LOADING MODELS...
                                </>
                            ) : provider === 'openrouter' && !keyValidated ? (
                                <>
                                    <Key size={16} />
                                    VALIDATE KEY & LOAD MODELS
                                </>
                            ) : (
                                <>
                                    <Wifi size={16} />
                                    CONNECT TO {currentConfig.name.toUpperCase()}
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
                        href={getProviderLink(provider)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyber-blue hover:text-white font-mono"
                    >
                        Get an API key from {currentConfig.name} →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AIConnectModal;
