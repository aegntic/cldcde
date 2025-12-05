"""
Knowledge graph implementation for storing entities and relations.
Integrates with the vector database for comprehensive knowledge management.
"""
import os
import sqlite3
import json
import uuid
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import aiosqlite
import asyncio
from datetime import datetime

class KnowledgeGraph:
    """
    Knowledge graph for storing entities, relations, and observations.
    Uses SQLite for structured data storage.
    """
    
    def __init__(self, db_path: str = None):
        """
        Initialize knowledge graph database.
        
        Args:
            db_path: Path to SQLite database file
        """
        if db_path is None:
            persist_dir = os.getenv("VECTOR_DB_DIR", str(Path.home() / ".aegntic_knowledge"))
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            db_path = str(Path(persist_dir) / "knowledge_graph.db")
        
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize the SQLite database with required tables."""
        with sqlite3.connect(self.db_path) as conn:
            # Entities table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS entities (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    entity_type TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Relations table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS relations (
                    id TEXT PRIMARY KEY,
                    from_entity TEXT NOT NULL,
                    to_entity TEXT NOT NULL,
                    relation_type TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (from_entity) REFERENCES entities (name),
                    FOREIGN KEY (to_entity) REFERENCES entities (name),
                    UNIQUE(from_entity, to_entity, relation_type)
                )
            """)
            
            # Observations table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS observations (
                    id TEXT PRIMARY KEY,
                    entity_name TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (entity_name) REFERENCES entities (name)
                )
            """)
            
            # Tasks table for task management
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    priority TEXT NOT NULL DEFAULT 'medium',
                    project TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP
                )
            """)
            
            # Context cache for documentation
            conn.execute("""
                CREATE TABLE IF NOT EXISTS context_cache (
                    library_id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    snippet_count INTEGER DEFAULT 0,
                    trust_score REAL DEFAULT 0.0,
                    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                )
            """)
            
            # Create indexes for better performance
            conn.executescript("""
                CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
                CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_entity);
                CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_entity);
                CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(relation_type);
                CREATE INDEX IF NOT EXISTS idx_observations_entity ON observations(entity_name);
                CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
                CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
                CREATE INDEX IF NOT EXISTS idx_context_expires ON context_cache(expires_at);
            """)
            
            conn.commit()
    
    async def create_entities(self, entities: List[Dict[str, Any]]) -> List[str]:
        """
        Create multiple entities in the knowledge graph.
        
        Args:
            entities: List of entity dictionaries with name, entityType, and observations
            
        Returns:
            List of created entity IDs
        """
        created_ids = []
        
        async with aiosqlite.connect(self.db_path) as conn:
            for entity_data in entities:
                entity_id = str(uuid.uuid4())
                name = entity_data["name"]
                entity_type = entity_data["entityType"]
                observations = entity_data.get("observations", [])
                
                # Insert entity
                await conn.execute("""
                    INSERT OR REPLACE INTO entities (id, name, entity_type, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                """, (entity_id, name, entity_type))
                
                # Insert observations
                for obs_content in observations:
                    obs_id = str(uuid.uuid4())
                    await conn.execute("""
                        INSERT INTO observations (id, entity_name, content)
                        VALUES (?, ?, ?)
                    """, (obs_id, name, obs_content))
                
                created_ids.append(entity_id)
            
            await conn.commit()
        
        return created_ids
    
    async def create_relations(self, relations: List[Dict[str, str]]) -> List[str]:
        """
        Create multiple relations between entities.
        
        Args:
            relations: List of relation dictionaries with from, to, and relationType
            
        Returns:
            List of created relation IDs
        """
        created_ids = []
        
        async with aiosqlite.connect(self.db_path) as conn:
            for relation_data in relations:
                relation_id = str(uuid.uuid4())
                from_entity = relation_data["from"]
                to_entity = relation_data["to"]
                relation_type = relation_data["relationType"]
                
                try:
                    await conn.execute("""
                        INSERT INTO relations (id, from_entity, to_entity, relation_type)
                        VALUES (?, ?, ?, ?)
                    """, (relation_id, from_entity, to_entity, relation_type))
                    created_ids.append(relation_id)
                except aiosqlite.IntegrityError:
                    # Relation already exists, skip
                    pass
            
            await conn.commit()
        
        return created_ids
    
    async def add_observations(self, observations: List[Dict[str, Any]]) -> List[str]:
        """
        Add observations to existing entities.
        
        Args:
            observations: List of observation dictionaries with entityName and contents
            
        Returns:
            List of created observation IDs
        """
        created_ids = []
        
        async with aiosqlite.connect(self.db_path) as conn:
            for obs_data in observations:
                entity_name = obs_data["entityName"]
                contents = obs_data["contents"]
                
                for content in contents:
                    obs_id = str(uuid.uuid4())
                    await conn.execute("""
                        INSERT INTO observations (id, entity_name, content)
                        VALUES (?, ?, ?)
                    """, (obs_id, entity_name, content))
                    created_ids.append(obs_id)
            
            await conn.commit()
        
        return created_ids
    
    async def delete_entities(self, entity_names: List[str]) -> int:
        """
        Delete entities and their associated data.
        
        Args:
            entity_names: List of entity names to delete
            
        Returns:
            Number of entities deleted
        """
        async with aiosqlite.connect(self.db_path) as conn:
            # Delete observations
            for name in entity_names:
                await conn.execute("DELETE FROM observations WHERE entity_name = ?", (name,))
            
            # Delete relations
            for name in entity_names:
                await conn.execute("""
                    DELETE FROM relations 
                    WHERE from_entity = ? OR to_entity = ?
                """, (name, name))
            
            # Delete entities
            deleted_count = 0
            for name in entity_names:
                cursor = await conn.execute("DELETE FROM entities WHERE name = ?", (name,))
                deleted_count += cursor.rowcount
            
            await conn.commit()
        
        return deleted_count
    
    async def search_nodes(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for nodes in the knowledge graph.
        
        Args:
            query: Search query
            
        Returns:
            List of matching nodes with their data
        """
        async with aiosqlite.connect(self.db_path) as conn:
            # Search entities and observations
            cursor = await conn.execute("""
                SELECT DISTINCT e.name, e.entity_type, e.created_at, e.updated_at
                FROM entities e
                LEFT JOIN observations o ON e.name = o.entity_name
                WHERE e.name LIKE ? 
                   OR e.entity_type LIKE ?
                   OR o.content LIKE ?
                ORDER BY e.updated_at DESC
                LIMIT 50
            """, (f"%{query}%", f"%{query}%", f"%{query}%"))
            
            results = []
            async for row in cursor:
                entity_name = row[0]
                
                # Get observations for this entity
                obs_cursor = await conn.execute("""
                    SELECT content FROM observations 
                    WHERE entity_name = ?
                    ORDER BY created_at DESC
                """, (entity_name,))
                
                observations = [obs_row[0] async for obs_row in obs_cursor]
                
                # Get relations for this entity
                rel_cursor = await conn.execute("""
                    SELECT from_entity, to_entity, relation_type 
                    FROM relations 
                    WHERE from_entity = ? OR to_entity = ?
                """, (entity_name, entity_name))
                
                relations = []
                async for rel_row in rel_cursor:
                    relations.append({
                        "from": rel_row[0],
                        "to": rel_row[1],
                        "type": rel_row[2]
                    })
                
                results.append({
                    "name": entity_name,
                    "entityType": row[1],
                    "observations": observations,
                    "relations": relations,
                    "createdAt": row[2],
                    "updatedAt": row[3]
                })
        
        return results
    
    async def read_graph(self) -> Dict[str, Any]:
        """
        Read the entire knowledge graph.
        
        Returns:
            Dictionary with entities and relations
        """
        async with aiosqlite.connect(self.db_path) as conn:
            # Get all entities with observations
            entities = []
            cursor = await conn.execute("""
                SELECT name, entity_type, created_at, updated_at 
                FROM entities 
                ORDER BY updated_at DESC
            """)
            
            async for row in cursor:
                entity_name = row[0]
                
                # Get observations
                obs_cursor = await conn.execute("""
                    SELECT content FROM observations 
                    WHERE entity_name = ?
                    ORDER BY created_at DESC
                """, (entity_name,))
                
                observations = [obs_row[0] async for obs_row in obs_cursor]
                
                entities.append({
                    "name": entity_name,
                    "entityType": row[1],
                    "observations": observations,
                    "createdAt": row[2],
                    "updatedAt": row[3]
                })
            
            # Get all relations
            relations = []
            rel_cursor = await conn.execute("""
                SELECT from_entity, to_entity, relation_type, created_at 
                FROM relations 
                ORDER BY created_at DESC
            """)
            
            async for row in rel_cursor:
                relations.append({
                    "from": row[0],
                    "to": row[1],
                    "relationType": row[2],
                    "createdAt": row[3]
                })
        
        return {
            "entities": entities,
            "relations": relations
        }
    
    async def open_nodes(self, names: List[str]) -> List[Dict[str, Any]]:
        """
        Open specific nodes by their names.
        
        Args:
            names: List of entity names to retrieve
            
        Returns:
            List of entity details
        """
        async with aiosqlite.connect(self.db_path) as conn:
            results = []
            
            for name in names:
                cursor = await conn.execute("""
                    SELECT name, entity_type, created_at, updated_at 
                    FROM entities 
                    WHERE name = ?
                """, (name,))
                
                row = await cursor.fetchone()
                if row:
                    # Get observations
                    obs_cursor = await conn.execute("""
                        SELECT content FROM observations 
                        WHERE entity_name = ?
                        ORDER BY created_at DESC
                    """, (name,))
                    
                    observations = [obs_row[0] async for obs_row in obs_cursor]
                    
                    # Get relations
                    rel_cursor = await conn.execute("""
                        SELECT from_entity, to_entity, relation_type 
                        FROM relations 
                        WHERE from_entity = ? OR to_entity = ?
                    """, (name, name))
                    
                    relations = []
                    async for rel_row in rel_cursor:
                        relations.append({
                            "from": rel_row[0],
                            "to": rel_row[1],
                            "type": rel_row[2]
                        })
                    
                    results.append({
                        "name": row[0],
                        "entityType": row[1],
                        "observations": observations,
                        "relations": relations,
                        "createdAt": row[2],
                        "updatedAt": row[3]
                    })
        
        return results