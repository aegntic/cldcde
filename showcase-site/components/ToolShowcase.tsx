'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ToolCard } from './ToolCard';
import { tools } from '@/lib/tools';

export function ToolShowcase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTools, setFilteredTools] = useState(tools);

  // Simple search implementation (RuVector integration would go here)
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query) {
      setFilteredTools(tools);
      return;
    }

    const filtered = tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredTools(filtered);
  };

  return (
    <section id="tools" className="section-full">
      <div className="container mx-auto px-6">
        <h2 className="heading-section text-center mb-12">THE COLLECTION</h2>

        {/* Search Bar */}
        <motion.div
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="wireframe-element p-6">
            <label className="label-wireframe" htmlFor="tool-search">
              SEARCH_TOOLS
            </label>
            <input
              id="tool-search"
              type="text"
              placeholder="Search by name, description, or tags..."
              className="input-noir"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <p className="body-small mt-2 text-noir-platinum/60">
              {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </motion.div>

        {/* Tools Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <ToolCard
                tool={tool}
                onClick={() => {
                  console.log('Loading tool:', tool.name);
                  // TODO: Navigate to tool details or open modal
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {filteredTools.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="body-large">No tools found matching "{searchQuery}"</p>
            <button
              onClick={() => handleSearch('')}
              className="button-noir mt-4"
            >
              CLEAR_SEARCH
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
