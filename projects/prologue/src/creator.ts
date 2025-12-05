/**
 * Prologue Project Creator
 * AI-powered project creation with intelligent assistance
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { PrologueProject, PrologueTemplate, AIAgent, PrologueConfig } from './types';

export class PrologueCreator {
  private templates: Map<string, PrologueTemplate> = new Map();
  private aiAgents: Map<string, AIAgent> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeAIAgents();
  }

  /**
   * Create a new Prologue project
   */
  async createProject(projectName: string, config: PrologueProject): Promise<void> {
    console.log(`\n🎭 Creating Prologue project: ${projectName}`);
    console.log(`📋 Template: ${config.template}`);
    console.log(`🤖 AI Agent: ${config.aiAgent}`);

    const projectPath = path.resolve(process.cwd(), projectName);

    try {
      // Validate project name
      this.validateProjectName(projectName);

      // Check if directory exists
      if (await fs.pathExists(projectPath)) {
        throw new Error(`Directory '${projectName}' already exists`);
      }

      // Create project directory
      await fs.ensureDir(projectPath);

      // Initialize Git if not skipped
      if (!config.skipGit) {
        await this.initializeGit(projectPath);
      }

      // Get template configuration
      const template = this.templates.get(config.template);
      if (!template) {
        throw new Error(`Template '${config.template}' not found`);
      }

      // Create project structure
      await this.createProjectStructure(projectPath, projectName, config);

      // Generate template files
      await this.generateTemplateFiles(projectPath, template, config);

      // Setup package.json
      await this.setupPackageJson(projectPath, projectName, template, config);

      // Setup development configuration
      await this.setupDevConfig(projectPath, config);

      // Initialize AI configuration
      await this.setupAIConfig(projectPath, config);

      // Create initial content
      await this.createInitialContent(projectPath, config);

      // Install dependencies
      await this.installDependencies(projectPath);

      // Initialize AI agent
      if (config.aiEnhanced) {
        await this.initializeAIAgent(projectPath, config);
      }

      console.log(`\n✅ Prologue project '${projectName}' created successfully!`);
      console.log(`📁 Location: ${projectPath}`);

      // Display project information
      this.displayProjectInfo(projectPath, config);

    } catch (error) {
      // Clean up on failure
      if (await fs.pathExists(projectPath)) {
        await fs.remove(projectPath);
      }
      throw error;
    }
  }

  /**
   * Validate project name
   */
  private validateProjectName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Project name cannot be empty');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      throw new Error('Project name can only contain letters, numbers, hyphens, underscores, and forward slashes');
    }

    if (name.startsWith('.') || name.startsWith('-')) {
      throw new Error('Project name cannot start with a dot or hyphen');
    }
  }

  /**
   * Initialize Git repository
   */
  private async initializeGit(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const gitInit = spawn('git', ['init'], {
        cwd: projectPath,
        stdio: 'pipe'
      });

      gitInit.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Failed to initialize Git repository'));
        }
      });
    });
  }

  /**
   * Create project directory structure
   */
  private async createProjectStructure(projectPath: string, projectName: string, config: PrologueProject): Promise<void> {
    const directories = [
      'src',
      'src/components',
      'src/pages',
      'src/hooks',
      'src/utils',
      'src/styles',
      'src/assets',
      'src/config',
      'public',
      'public/images',
      'public/icons',
      'docs',
      'tests',
      'tests/unit',
      'tests/integration',
      '.prologue',
      'templates',
      'ai',
      'deploy'
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(projectPath, dir));
    }
  }

  /**
   * Generate template files
   */
  private async generateTemplateFiles(projectPath: string, template: PrologueTemplate, config: PrologueProject): Promise<void> {
    const templatePath = path.join(__dirname, 'templates', config.template);

    if (await fs.pathExists(templatePath)) {
      await this.copyTemplate(templatePath, projectPath, config);
    } else {
      await this.generateCustomTemplate(projectPath, template, config);
    }
  }

  /**
   * Copy template files
   */
  private async copyTemplate(templatePath: string, projectPath: string, config: PrologueProject): Promise<void> {
    const files = await this.getTemplateFiles(templatePath);

    for (const file of files) {
      const relativePath = path.relative(templatePath, file);
      const targetPath = path.join(projectPath, relativePath);

      await fs.ensureDir(path.dirname(targetPath));
      await fs.copy(file, targetPath);
    }
  }

  /**
   * Get all files in template directory
   */

  /**
   * Generate custom template
   */
  private async generateCustomTemplate(projectPath: string, template: PrologueTemplate, config: PrologueProject): Promise<void> {
    const templateConfig = this.getTemplateConfig(config.template);
    const templateFiles = this.getTemplateFiles(config.template);

    for (const file of templateFiles) {
      const filePath = path.join(projectPath, file);
      const content = this.generateTemplateContent(file, templateConfig, config);

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  /**
   * Get template configuration
   */
  private getTemplateConfig(templateType: string): any {
    const configs: Record<string, any> = {
      portfolio: {
        files: [
          'src/App.tsx',
          'src/components/Header.tsx',
          'src/components/Hero.tsx',
          'src/components/Projects.tsx',
          'src/components/Contact.tsx',
          'src/pages/Index.tsx',
          'src/styles/globals.css',
          'public/index.html'
        ]
      },
      game: {
        files: [
          'src/App.tsx',
          'src/components/GameCanvas.tsx',
          'src/components/GameUI.tsx',
          'src/game/Game.ts',
          'src/assets/sprites/',
          'public/index.html'
        ]
      },
      'art-gallery': {
        files: [
          'src/App.tsx',
          'src/components/Gallery.tsx',
          'src/components/Artwork.tsx',
          'src/components/ArtistProfile.tsx',
          'src/styles/gallery.css',
          'public/index.html'
        ]
      },
      'mobile-app': {
        files: [
          'src/App.tsx',
          'src/components/MobileLayout.tsx',
          'src/pages/Home.tsx',
          'src/pages/About.tsx',
          'src/styles/mobile.css',
          'public/index.html'
        ]
      },
      dashboard: {
        files: [
          'src/App.tsx',
          'src/components/Dashboard.tsx',
          'src/components/Widget.tsx',
          'src/components/Charts.tsx',
          'public/index.html'
        ]
      },
      'landing-page': {
        files: [
          'src/App.tsx',
          'src/components/Hero.tsx',
          'src/components/Features.tsx',
          'src/components/Testimonials.tsx',
          'src/components/CallToAction.tsx',
          'src/styles/landing.css',
          'public/index.html'
        ]
      },
      custom: {
        files: [
          'src/App.tsx',
          'src/components/Layout.tsx',
          'src/pages/Home.tsx',
          'src/styles/main.css',
          'public/index.html'
        ]
      }
    };

    return configs[templateType] || configs.custom;
  }

  /**
   * Get template files for template type
   */
  private getTemplateFiles(templateType: string): string[] {
    const configs = this.getTemplateConfig(templateType);
    return configs.files || [];
  }

  /**
   * Generate template content
   */
  private generateTemplateContent(file: string, templateConfig: any, config: PrologueConfig): string {
    const fileName = path.basename(file, path.extname(file));
    const relativePath = path.dirname(file);

    // Generate content based on file type and template
    if (fileName === 'App.tsx') {
      return this.generateAppContent(templateConfig, config);
    }

    if (fileName === 'index.html') {
      return this.generateIndexHtml(templateConfig, config);
    }

    if (fileName === 'package.json') {
      return this.generatePackageJsonContent(templateConfig, config);
    }

    if (fileName.endsWith('.css')) {
      return this.generateCssContent(templateConfig, config);
    }

    // Default content
    return this.generateDefaultContent(templateConfig, config);
  }

  /**
   * Generate React App component
   */
  private generateAppContent(templateConfig: any, config: PrologueConfig): string {
    const theme = config.customizations.theme || 'ocean';
    const fontFamily = config.customizations.fontFamily || 'system';

    return `import React from 'react';
import { PrologueProvider } from '../src/context/PrologueContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import '../src/styles/globals.css';

function App() {
  return (
    <PrologueProvider aiAgent="${config.aiAgent}" aiEnhanced="${config.aiEnhanced}">
      <ThemeProvider theme="${theme}" fontFamily="${fontFamily}">
        <div className="min-h-screen bg-gradient-to-br from-${theme}-50 to-${theme}-100 dark:from-${theme}-900 dark:to-${theme}-800">
          <main className="container mx-auto px-4 py-8">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                ${config.name}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Built with Prologue - AI-Powered Creative Framework
              </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Welcome to Your Project
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  This is your Prologue project. Start building something amazing!
                </p>
              </div>
            </section>
          </main>
        </div>
      </ThemeProvider>
    </PrologueProvider>
  );
}

export default App;
`;
  }

  /**
   * Generate index.html
   */
  private generateIndexHtml(templateConfig: any, config: PrologueConfig): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.name}</title>
  <meta name="description" content="${config.name} - Built with Prologue AI-Powered Creative Framework" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <meta name="prologue-version" content="1.0.0">
  <meta name="prologue-template" content="${config.template}">
  <meta name="prologue-ai-agent" content="${config.aiAgent}">
  <meta name="prologue-ai-enhanced" content="${config.aiEnhanced}">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
  }

  /**
   * Generate package.json content
   */
  private generatePackageJsonContent(templateConfig: any, config: PrologueConfig): string {
    const basePackage = {
      name: config.name,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
        test: "vitest",
        "test:ui": "vitest --ui",
        "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "type-check": "tsc --noEmit"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.8.0",
        "@prologue/core": "^1.0.0",
        "framer-motion": "^10.16.0",
        "lucide-react": "^0.294.0",
        "tailwindcss": "^3.3.0",
        "@prologue/ai": "^1.0.0",
        "@prologue/ai-visionary": "^1.0.0"
      },
      devDependencies: {
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@vitejs/plugin-react": "^4.0.0",
        "typescript": "^5.0.0",
        "vite": "^5.0.0",
        "vitest": "^0.34.0",
        "@testing-library/react": "^13.4.0",
        "eslint": "^8.45.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0",
        "postcss": "^8.4.0",
        "autoprefixer": "^10.4.0"
      }
    };

    // Merge template-specific dependencies
    if (templateConfig.dependencies) {
      Object.assign(basePackage.dependencies, templateConfig.dependencies);
    }

    if (templateConfig.devDependencies) {
      Object.assign(basePackage.devDependencies, templateConfig.devDependencies);
    }

    // Add AI-enhanced dependencies
    if (config.aiEnhanced) {
      basePackage.dependencies["@prologue/ai"] = "^1.0.0";
      basePackage.dependencies["@prologue/ai-visionary"] = "^1.0.0";
    }

    return JSON.stringify(basePackage, null, 2);
  }

  /**
   * Generate CSS content
   */
  private generateCssContent(templateConfig: any, config: PrologueConfig): string {
    const theme = config.customizations.theme || 'ocean';

    const themes: Record<string, any> = {
      ocean: {
        primary: '#0891b2',
        secondary: '#0ea5e9',
        accent: '#06b6d4',
        background: '#f0f9ff',
        text: '#1e293b'
      },
      sakura: {
        primary: '#fecaca',
        secondary: '#fbbf24',
        accent: '#f43f5e',
        background: '#fff1f2',
        text: '#1f2937'
      },
      forest: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#047857',
        background: '#f0fdf4',
        text: '#1f2937'
      },
      sunset: {
        primary: '#f97316',
        secondary: '#fb923c',
        accent: '#fed7aa',
        background: '#fff7ed',
        text: '#1f2937'
      },
      night: {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        accent: '#c084fc',
        background: '#1e1b2e',
        text: '#f3f4f6'
      }
    };

    const colors = themes[theme] || themes.ocean;

    return `@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  * {
    font-family: ${config.customizations.fontFamily || 'system-ui, sans-serif'};
  }

  body {
    @apply bg-gradient-to-br from-${colors.background} to-${colors.background} dark:from-gray-900 dark:to-gray-800;
  }
}

@layer components {
  .prologue-container {
    @apply min-h-screen;
  }

  .prologue-card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg;
  }

  .prologue-button {
    @apply px-6 py-3 rounded-lg font-medium transition-all duration-200;
  }

  .prologue-button-primary {
    @apply bg-${colors.primary} text-white hover:bg-${colors.secondary};
  }
}

@layer utilities {
  .prologue-float {
    @apply animate-float;
  }

  .prologue-fade-in {
    @apply animate-fade-in;
  }

  .prologue-slide-up {
    @apply animate-slide-up;
  }
}

/* Custom animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* AI Enhancement styles */
.prologue-ai-assist {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 50;
}

.prologue-ai-message {
  background: rgba(8, 5, 250, 0.9);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  max-width: 300px;
  animation: slide-up 0.3s ease-out;
}

.prologue-ai-typing {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid white;
  animation: typing 2s steps(40, end);
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}
`;
  }

  /**
   * Generate default content
   */
  private generateDefaultContent(templateConfig: any, config: PrologueConfig): string {
    return `// Prologue Project: ${config.name}
// Template: ${config.template}
// AI Agent: ${config.aiAgent}
// AI Enhanced: ${config.aiEnhanced}

// Add your custom code here`;
  }

  /**
   * Setup package.json
   */
  private async setupPackageJson(projectPath: string, projectName: string, template: PrologueTemplate, config: PrologueConfig): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');

    // Create package.json if it doesn't exist (from template generation)
    if (!await fs.pathExists(packageJsonPath)) {
      await this.generateTemplateFiles(projectPath, template, config);
    }
  }

  /**
   * Setup development configuration
   */
  private async setupDevConfig(projectPath: string, config: PrologueConfig): Promise<void> {
    const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          prologue: ['@prologue/core'],
        },
      },
    },
  },
});
`;

    await fs.writeFile(path.join(projectPath, 'vite.config.ts'), viteConfig);

    const tsConfig = `
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`;

    await fs.writeFile(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

    const tsNodeConfig = `
{
  "compilerOptions": {
    "composite": true,
    "esModuleInterop": true,
    "lib": ["ES2020"],
    "module": "ESNext",
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
`;

    await fs.writeFile(path.join(projectPath, 'tsconfig.node.json'), JSON.stringify(tsNodeConfig, null, 2));
  }

  /**
   * Setup AI configuration
   */
  private async setupAIConfig(projectPath: string, config: PrologueConfig): Promise<void> {
    const aiConfig = {
      defaultAgent: config.aiAgent,
      enhanced: config.aiEnhanced,
      apiKey: process.env.PROLOGUE_AI_API_KEY,
      models: {
        visionary: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
        },
        builder: {
          model: 'claude-3.5-sonnet',
          temperature: 0.3,
          maxTokens: 4000,
        },
        designer: {
          model: 'gpt-4-vision-preview',
          temperature: 0.8,
          maxTokens: 1000,
        },
      },
      context: {
        projectName: config.name,
        template: config.template,
        features: config.features,
        customizations: config.customizations,
      },
    };

    await fs.ensureDir(path.join(projectPath, '.prologue'));
    await fs.writeFile(
      path.join(projectPath, '.prologue/ai.json'),
      JSON.stringify(aiConfig, null, 2)
    );

    // Create AI context
    const contextContent = this.generateAIContext(config);
    await fs.writeFile(
      path.join(projectPath, 'src/context/PrologueContext.tsx'),
      contextContent
    );

    // Create theme context
    const themeContent = this.generateThemeContext();
    await fs.writeFile(
      path.join(projectPath, 'src/context/ThemeContext.tsx'),
      themeContent
    );
  }

  /**
   * Generate AI context component
   */
  private generateAIContext(config: PrologueConfig): string {
    return `import React, { createContext, useContext, useState } from 'react';
import { AIAgent } from '@prologue/ai';
import { PrologueProject } from '../types';

interface PrologueContextType {
  project: PrologueProject;
  aiAgent: AIAgent;
  isAIAvailable: boolean;
  isAIWorking: boolean;
  startAIChat: () => Promise<void>;
  endAIChat: () => void;
  sendAIMessage: (message: string) => Promise<string>;
  getAISuggestions: () => Promise<string[]>;
}

const PrologueContext = createContext<PrologueContextType | null>(null);

export const usePrologue = () => {
  const context = useContext(PrologueContext);
  if (!context) {
    throw new Error('usePrologue must be used within a PrologueProvider');
  }
  return context;
};

export const PrologueProvider: React.FC<{
  children: React.ReactNode;
  aiAgent?: string;
  aiEnhanced?: boolean;
}> = ({
  children,
  aiAgent = 'visionary',
  aiEnhanced = true
}) => {
  const [project, setProject] = useState<PrologueProject>({
    name: '${config.name}',
    template: '${config.template}',
    aiAgent: aiAgent,
    skipGit: ${config.skipGit},
    aiEnhanced: ${config.aiEnhanced},
    features: ${JSON.stringify(config.features)},
    customizations: ${JSON.stringify(config.customizations)}
  });

  const [aiAgent, setAIAgent] = useState<AIAgent>({
    id: aiAgent,
    name: this.getAgentName(aiAgent),
    description: this.getAgentDescription(aiAgent),
    capabilities: this.getAgentCapabilities(aiAgent),
    specialties: this.getAgentSpecialties(aiAgent),
    model: this.getAgentModel(aiAgent),
    status: 'active'
  });

  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [conversation, setConversation] = useState<any[]>([]);

  const startAIChat = async () => {
    setIsAIWorking(true);
    // AI chat logic here
    setIsAIWorking(false);
  };

  const endAIChat = () => {
    setIsAIWorking(false);
    // End chat logic here
  };

  const sendAIMessage = async (message: string): Promise<string> => {
    setIsAIWorking(true);

    // AI interaction logic here
    const response = \`I understand you want to: \${message}. Let me help you with that!\`;

    setConversation(prev => [...prev, {
      user: message,
      assistant: response,
      timestamp: new Date()
    }]);

    setIsAIWorking(false);
    return response;
  };

  const getAISuggestions = async (): Promise<string[]> => {
    // AI suggestions logic here
    return [
      'Add a hero section with a compelling headline',
      'Include a call-to-action button',
      'Add interactive animations',
      'Optimize for mobile devices',
      'Add social proof and testimonials'
    ];
  };

  const value: PrologueContextType = {
    project,
    aiAgent,
    isAIAvailable,
    isAIWorking,
    startAIChat,
    endAIChat,
    sendAIMessage,
    getAISuggestions
  };

  return (
    <PrologueContext.Provider value={value}>
      {children}
    </PrologueContext.Provider>
  );
};

export default PrologueProvider;
`;
  }

  /**
   * Get theme context component
   */
  private generateThemeContext(): string {
    return `import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  theme: string;
  fontFamily: string;
  colors: Record<string, string>;
  setTheme: (theme: string) => void;
  setFontFamily: (fontFamily: string) => void;
  updateColors: (colors: Record<string, string>) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  theme?: string;
  fontFamily?: string;
}> = ({
  children,
  theme = 'ocean',
  fontFamily = 'system'
}) => {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [currentFontFamily, setCurrentFontFamily] = useState(fontFamily);

  const themes: Record<string, Record<string, string>> = {
    ocean: {
      primary: '#0891b2',
      secondary: '#0ea5e9',
      accent: '#06b6d4',
      background: '#f0f9ff',
      text: '#1e293b'
    },
    sakura: {
      primary: '#fecaca',
      secondary: '#fbbf24',
      accent: '#f43f5e',
      background: '#fff1f2',
      text: '#1f2937'
    },
    forest: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#047857',
      background: '#f0fdf4',
      text: '#1f2937'
    },
    sunset: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fed7aa',
      background: '#fff7ed',
      text: '#1f2937'
    },
    night: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      accent: '#c084fc',
      background: '#1e1b2e',
      text: '#f3f4f6'
    }
  };

  const updateColors = (colors: Record<string, string>) => {
    const currentColors = themes[currentTheme];
    const newColors = { ...currentColors, ...colors };

    // Apply colors to CSS variables
    const root = document.documentElement;
    Object.entries(newColors).forEach(([key, value]) => {
      root.style.setProperty(\`--color-\${key}\`, value);
    });
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    fontFamily: currentFontFamily,
    colors: themes[currentTheme],
    setTheme: setCurrentTheme,
    setFontFamily: setCurrentFontFamily,
    updateColors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
`;
  }

  /**
   * Generate README content
   */
  private generateReadmeContent(config: PrologueConfig): string {
    return `# ${config.name}

Built with Prologue - AI-Powered Creative Framework

## Overview

This project was created using the Prologue CLI with AI assistance.

## Template

- **Template**: ${config.template}
- **AI Agent**: ${config.aiAgent}
- **AI Enhanced**: ${config.aiEnhanced ? 'Yes' : 'No'}

## Features

${config.features.map(feature => `- ${feature}`).join('\n')}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

## Prologue Commands

- \`prologue dev\` - Start development server
- \`prologue ai\` - Get AI assistance
- \`prologue deploy\` - Deploy your creation
- \`prologue templates\` - Browse templates

## Learn More

- [Prologue Documentation](https://docs.prologue.ai)
- [Template Gallery](https://templates.prologue.ai)
- [Community Discord](https://discord.gg/prologue)

---

Generated with ❤️ by [Prologue](https://logue.pro)
`;
  }

  /**
   * Create initial content
   */
  private async createInitialContent(projectPath: string, config: PrologueProject): Promise<void> {
    const readmePath = path.join(projectPath, 'README.md');
    const readmeContent = this.generateReadmeContent(config);

    await fs.writeFile(readmePath, readmeContent);

    // Create .gitignore
    const gitignorePath = path.join(projectPath, '.gitignore');
    const gitignoreContent = `# Dependencies
node_modules/
dist/
build/
.env.local
.env.production

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.output

# vuepress build output
.vuepress/dist

# Docus build output
.docus

# Serverless directories
.serverless/
.serverless/

# FuseBox cache
.fusebox/
dist/

# Tauri app output
src-tauri/target

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
.DS_Store
*.suo
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*

# IDE and editor files
*.sublime-project
*.sublime-workspace
*.code-workspace

# OS files
.DS_Store
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN

# Video files
*.mp4
*.webm
*.mov
*.avi
*.mkv

# Audio files
*.mp3
*.wav
*.ogg
*.m4a

# Font files
*.ttf
*.otf
*.woff
*.woff2
*.eot
*.svg
*.ico

# Image files
*.jpg
*.jpeg
*.png
*.gif
*.bmp
*.webp

# Archive files
*.zip
*.tar.gz
*.tar.xz
*.tar
*.tar.bz2
*.7z
*.rar
*.gz
*.z
*.zst

# Binary files
*.exe
*.dll
*.so
*.dylib
*.bin
*.pkg
*.dmg
*.pkg
*.app
*.exe
*.msi
*.msm
*.msp
*.msp
`;

    await fs.writeFile(gitignorePath, gitignoreContent);
  }

  /**
   * Install dependencies
   */
  private async installDependencies(projectPath: string): Promise<void> {
    console.log('📦 Installing dependencies...');

    return new Promise((resolve, reject) => {
      const npmInstall = spawn('npm', ['install'], {
        cwd: projectPath,
        stdio: 'pipe'
      });

      npmInstall.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error('Failed to install dependencies'));
        }
      });
    });
  }

  /**
   * Initialize AI agent
   */
  private async initializeAIAgent(projectPath: string, config: PrologueConfig): Promise<void> {
    if (!config.aiEnhanced) {
      return;
    }

    console.log('🤖 Initializing AI assistant...');

    // AI agent initialization logic here
    const aiDir = path.join(projectPath, 'ai');
    await fs.ensureDir(aiDir);

    // Create AI assistant files
    const aiConfig = this.createAIConfig(config);
    await fs.writeFile(path.join(aiDir, 'config.json'), JSON.stringify(aiConfig, null, 2));
  }

  /**
   * Create AI configuration
   */
  private createAIConfig(config: PrologueConfig): any {
    return {
      agent: config.aiAgent,
      enhanced: config.aiEnhanced,
      apiKey: process.env.PROLOGUE_AI_API_KEY || 'your-api-key-here',
      baseUrl: 'https://api.prologue.ai',
      version: '1.0.0',
      settings: {
        autoSuggest: true,
        learnFromUser: true,
        contextAwareness: true,
        maxContextLength: 10000,
      }
    };
  }

  /**
   * Display project information
   */
  private displayProjectInfo(projectPath: string, config: PrologueConfig): void {
    console.log(`\n📁 Project Information:`);
    console.log(`   Name: ${config.name}`);
    console.log(`   Template: ${config.template}`);
    console.log(`   AI Agent: ${config.aiAgent}`);
    console.log(`   AI Enhanced: ${config.aiEnhanced ? 'Yes' : 'No'}`);
    console.log(`   Location: ${projectPath}`);
    console.log();

    console.log('🎯 Next Steps:');
    console.log(`   1. ${chalk.cyan('cd')} ${config.name}`);
    console.log(`   2. ${chalk.cyan('prologue dev')} Start development server`);
    console.log(`   3. ${chalk.cyan('prologue ai')} Start AI assistant`);
    console.log(`   4. ${chalk.cyan('prologue deploy')} Deploy your creation`);
    console.log();

    console.log('🌟 Learn more:');
    console.log(`   📚 Documentation: https://docs.prologue.ai`);
    console.log(`   🎮 Templates: https://templates.prologue.ai`);
    console.log(`   Community: https://discord.gg/prologue`);
    console.log(`   📧 Support: https://support.prologue.ai`);
    console.log();
  }

  /**
   * Initialize templates
   */
  private initializeTemplates(): void {
    const templates: Record<string, PrologueTemplate> = {
      portfolio: {
        name: 'Portfolio Website',
        description: 'Modern portfolio with project showcase',
        category: 'web',
        tags: ['portfolio', 'personal', 'showcase'],
        aiEnhanced: true,
        files: ['src/App.tsx', 'src/components/Header.tsx', 'src/components/Hero.tsx'],
        dependencies: {
          'react-router-dom': '^6.8.0',
          'framer-motion': '^10.16.0',
          'lucide-react': '^0.294.0'
        },
        devDependencies: {
          '@types/react-router-dom': '^6.8.0'
        }
      },
      game: {
        name: 'Interactive Game',
        description: 'Web-based game with AI-generated levels',
        category: 'game',
        tags: ['game', 'interactive', 'fun'],
        aiEnhanced: true,
        files: ['src/App.tsx', 'src/components/GameCanvas.tsx', 'src/game/Game.ts'],
        dependencies: {
          'three': '^0.158.0',
          '@react-three/fiber': '^8.15.0',
          '@react-three/drei': '^9.88.0'
        }
      },
      'art-gallery': {
        name: 'Art Gallery',
        description: 'Dynamic art gallery with generative pieces',
        category: 'art',
        tags: ['art', 'gallery', 'creative'],
        aiEnhanced: true,
        files: ['src/App.tsx', 'src/components/Gallery.tsx', 'src/components/Artwork.tsx'],
        dependencies: {
          'framer-motion': '^10.16.0',
          'react-spring': '^9.0.0'
        }
      },
      'mobile-app': {
        name: 'Mobile App',
        description: 'Native mobile app with cross-platform support',
        category: 'mobile',
        tags: ['mobile', 'app', 'native'],
        aiEnhanced: true,
        files: ['src/App.tsx', 'src/components/MobileLayout.tsx', 'src/pages/Home.tsx'],
        dependencies: {
          'react-native': '^0.71.0',
          'react-native-web': '^0.19.0'
        }
      },
      dashboard: {
        name: 'Dashboard',
        description: 'Analytics dashboard with real-time data',
        category: 'data',
        tags: ['dashboard', 'analytics', 'data'],
        aiEnhanced: true,
        files: ['src/App.tsx', 'src/components/Dashboard.tsx', 'src/components/Widget.tsx'],
        dependencies: {
          'recharts': '^2.8.0',
          'react-dnd': '^16.0.0',
          'date-fns': '^2.30.0'
        }
      },
      'landing-page': {
        name: 'Landing Page',
        description: 'High-converting landing page with AI optimization',
        category: 'marketing',
        tags: ['landing', 'marketing', 'conversion'],
        aiEnhanced: true,
        files: ['src/App.tsx', 'src/components/Hero.tsx', 'src/components/CallToAction.tsx'],
        dependencies: {
          'react-scroll-parallax': '^3.0.0',
          'react-intersection-observer': '^9.4.0',
          'react-countup': '^2.8.0'
        }
      },
      custom: {
        name: 'Custom Project',
        description: 'Start from scratch with AI assistance',
        category: 'custom',
        tags: ['custom', 'flexible'],
        aiEnhanced: true,
        files: ['src/App.tsx', 'src/components/Layout.tsx', 'src/pages/Home.tsx'],
        dependencies: {}
      }
    };

    for (const [key, template] of Object.entries(templates)) {
      this.templates.set(key, template);
    }
  }

  /**
   * Initialize AI agents
   */
  private initializeAIAgents(): void {
    const agents: Record<string, AIAgent> = {
      visionary: {
        id: 'visionary',
        name: 'Visionary Director',
        description: 'Creative direction and concept development',
        capabilities: ['concept-ideation', 'storytelling', 'vision-definition', 'mood-board-generation'],
        specialties: ['brand-strategy', 'creative-direction', 'concept-development', 'narrative-design'],
        model: 'gpt-4',
        status: 'active'
      },
      builder: {
        id: 'builder',
        name: 'Rapid Builder',
        description: 'Quick prototyping and development',
        capabilities: ['rapid-prototyping', 'code-generation', 'component-creation', 'performance-optimization'],
        specialties: ['react-development', 'typescript', 'component-architecture', 'state-management'],
        model: 'claude-3.5-sonnet',
        status: 'active'
      },
      designer: {
        id: 'designer',
        name: 'Design Master',
        description: 'Visual design and UI/UX',
        capabilities: ['ui-design', 'ux-research', 'visual-design', 'accessibility', 'design-trends'],
        specialties: ['tailwind-css', 'responsive-design', 'accessibility', 'user-research'],
        model: 'gpt-4-vision-preview',
        status: 'active'
      },
      data: {
        id: 'data',
        name: 'Data Weaver',
        description: 'Data integration and visualization',
        capabilities: ['data-integration', 'data-visualization', 'api-integration', 'database-design', 'analytics'],
        specialties: ['data-engineering', 'visualization', 'api-design', 'database', 'analytics'],
        model: 'gpt-4',
        status: 'active'
      },
      security: {
        id: 'security',
        name: 'Security Guardian',
        description: 'Security and best practices',
        capabilities: ['security-audit', 'vulnerability-scanning', 'authentication', 'authorization', 'privacy-protection'],
        specialties: ['security-best-practices', 'encryption', 'authentication', 'privacy', 'compliance'],
        model: 'claude-3.5-sonnet',
        status: 'active'
      },
      deployment: {
        id: 'deployment',
        name: 'Deployment Expert',
        description: 'Deployment and optimization',
        capabilities: ['deployment-automation', 'performance-optimization', 'ci-cd-pipelines', 'monitoring', 'troubleshooting'],
        specialties: ['devops', 'cloud-deployment', 'performance', 'monitoring', 'infrastructure'],
        model: 'gpt-4',
        status: 'active'
      }
    };

    for (const [key, agent] of Object.entries(agents)) {
      this.aiAgents.set(key, agent);
    }
  }

  /**
   * Get agent name by ID
   */
  private getAgentName(agentId: string): string {
    const agent = this.aiAgents.get(agentId);
    return agent?.name || 'Unknown Agent';
  }

  /**
   * Get agent description by ID
   */
  private getAgentDescription(agentId: string): string {
    const agent = this.aiAgents.get(agentId);
    return agent?.description || 'AI Assistant';
  }

  /**
   * Get agent capabilities by ID
   */
  private getAgentCapabilities(agentId: string): string[] {
    const agent = this.aiAgents.get(agentId);
    return agent?.capabilities || [];
  }

  /**
   * Get agent specialties by ID
   */
  private getAgentSpecialties(agentId: string): string[] {
    const agent = this.aiAgents.get(agentId);
    return agent?.specialties || [];
  }

  /**
   * Get agent model by ID
   */
  private getAgentModel(agentId: string): string {
    const agent = this.aiAgents.get(agentId);
    return agent?.model || 'gpt-4';
  }
}

export const prologueCreator = new PrologueCreator();