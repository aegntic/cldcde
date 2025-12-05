"use client";

import {
  Calculator,
  Search,
  Database,
  ArrowRight,
} from "lucide-react";
import { JSX } from "react";

type ExampleConfig = {
  name: string;
  description: string;
  config: Record<string, any>;
  icon: JSX.Element;
};

const EXAMPLE_CONFIGS: ExampleConfig[] = [
  {
    name: "Math Service",
    description:
      "A simple Python server that can perform mathematical operations",
    icon: <Calculator className="h-4 w-4 text-gray-600" />,
    config: {
      math: {
        command: "python",
        args: ["agent/math_server.py"],
        transport: "stdio",
      },
    },
  },
  {
    name: "Web Search",
    description: "Connect to a search service via SSE",
    icon: <Search className="h-4 w-4 text-gray-600" />,
    config: {
      search: {
        url: "http://localhost:8000/search/events",
        transport: "sse",
      },
    },
  },
  {
    name: "Full Stack",
    description:
      "A combination of multiple services for comprehensive functionality",
    icon: <Database className="h-4 w-4 text-gray-600" />,
    config: {
      math: {
        command: "python",
        args: ["agent/math_server.py"],
        transport: "stdio",
      },
      search: {
        url: "http://localhost:8000/search/events",
        transport: "sse",
      },
      database: {
        command: "node",
        args: ["scripts/db_server.js"],
        transport: "stdio",
      },
    },
  },
];

interface ExampleConfigsProps {
  onSelectConfig: (config: Record<string, any>) => void;
}

export function ExampleConfigs({ onSelectConfig }: ExampleConfigsProps) {
  return (
    <div className="bg-white border rounded-md p-4">
      <div className="grid grid-cols-1 gap-3">
        {EXAMPLE_CONFIGS.map((example) => (
          <div
            key={example.name}
            className="border rounded-md p-3 hover:border-gray-500 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex">
                <div className="mt-1 mr-2">{example.icon}</div>
                <div>
                  <h4 className="font-medium">{example.name}</h4>
                  <p className="text-sm text-gray-600">{example.description}</p>
                </div>
              </div>
              <button
                onClick={() => onSelectConfig(example.config)}
                className="px-2 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 flex items-center"
              >
                Use This
                <ArrowRight className="ml-1 h-3 w-3" />
              </button>
            </div>
            <div className="mt-2">
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-24">
                {JSON.stringify(example.config, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
