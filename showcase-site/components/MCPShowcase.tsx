'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MCPServerCard } from './MCPServerCard';
import { mcpServers } from '@/lib/tools';

export function MCPShowcase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const filteredServers = mcpServers.filter((server) =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleServerClick = (serverId: string) => {
    setSelectedServer(serverId);
    // In a real app, this would navigate to the server detail page
    console.log(`Clicked MCP server: ${serverId}`);
  };

  return (
    <section id="mcp-servers" className="section-full bg-noir-near-black">
      <div className="container mx-auto px-6">
        <h2 className="heading-section text-center mb-12">MCP SERVERS</h2>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="wireframe-element">
            <input
              type="text"
              placeholder="Search MCP servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-6 py-4 text-noir-platinum placeholder-noir-platinum/50 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs label-wireframe hover:text-gold-base"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Server count */}
        <div className="text-center mb-8">
          <span className="label-wireframe">
            {filteredServers.length} MCP SERVER{filteredServers.length !== 1 ? 'S' : ''} FOUND
          </span>
        </div>

        {/* Server grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <MCPServerCard
              key={server.id}
              server={server}
              onClick={() => handleServerClick(server.id)}
            />
          ))}
        </div>

        {/* No results */}
        {filteredServers.length === 0 && (
          <div className="text-center py-12">
            <p className="body-large text-noir-platinum/50">
              No MCP servers found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
