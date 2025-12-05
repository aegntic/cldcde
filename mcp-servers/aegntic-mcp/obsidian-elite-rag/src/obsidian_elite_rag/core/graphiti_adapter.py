#!/usr/bin/env python3

"""
Graphiti Knowledge Graph Adapter
Integrates Graphiti knowledge graph capabilities with the elite RAG system
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import json
from pathlib import Path

try:
    from neo4j import GraphDatabase
    from graphiti import Graphiti
    from graphiti.core import Entity, Relationship
except ImportError:
    Graphiti = None
    GraphDatabase = None

from .rag_engine import Document

logger = logging.getLogger(__name__)

@dataclass
class GraphEntity:
    """Represents an entity in the knowledge graph"""
    name: str
    entity_type: str
    description: str
    properties: Dict[str, Any]
    source_doc_id: str

@dataclass
class GraphRelationship:
    """Represents a relationship between entities"""
    source: str
    target: str
    relationship_type: str
    properties: Dict[str, Any]
    confidence: float

class GraphitiAdapter:
    """Adapter for Graphiti knowledge graph functionality"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.enabled = config.get('enabled', False) and Graphiti is not None

        if self.enabled:
            self.neo4j_uri = config['neo4j_uri']
            self.neo4j_user = config['neo4j_user']
            self.neo4j_password = config['neo4j_password']
            self.database = config.get('database', 'neo4j')

            # Initialize Neo4j driver
            self.driver = GraphDatabase.driver(
                self.neo4j_uri,
                auth=(self.neo4j_user, self.neo4j_password)
            )

            # Initialize Graphiti
            self.graphiti = Graphiti(self.driver, database=self.database)

            logger.info("Graphiti adapter initialized successfully")
        else:
            self.driver = None
            self.graphiti = None
            logger.warning("Graphiti adapter disabled - dependencies not available or not configured")

    async def initialize_database(self):
        """Initialize the knowledge graph database"""
        if not self.enabled:
            return

        try:
            # Create constraints for entity types
            constraints = [
                "CREATE CONSTRAINT entity_name_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE",
                "CREATE INDEX entity_type_idx IF NOT EXISTS FOR (e:Entity) ON (e.type)",
                "CREATE INDEX relationship_type_idx IF NOT EXISTS FOR ()-[r]-() ON (r.type)",
                "CREATE INDEX entity_source_idx IF NOT EXISTS FOR (e:Entity) ON (e.source_doc_id)"
            ]

            with self.driver.session(database=self.database) as session:
                for constraint in constraints:
                    try:
                        session.run(constraint)
                    except Exception as e:
                        logger.debug(f"Constraint already exists or failed: {e}")

            logger.info("Graphiti database initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Graphiti database: {e}")
            raise

    async def extract_entities_and_relationships(self, document: Document) -> Tuple[List[GraphEntity], List[GraphRelationship]]:
        """Extract entities and relationships from a document"""
        if not self.enabled:
            return [], []

        try:
            # Use Graphiti to extract knowledge
            entities = []
            relationships = []

            # Extract entities based on configuration
            entity_config = self.config.get('entity_extraction', {})

            if entity_config.get('extract_concepts', True):
                concepts = await self._extract_concepts(document)
                entities.extend(concepts)

            if entity_config.get('extract_people', True):
                people = await self._extract_people(document)
                entities.extend(people)

            if entity_config.get('extract_organizations', True):
                orgs = await self._extract_organizations(document)
                entities.extend(orgs)

            if entity_config.get('extract_locations', True):
                locations = await self._extract_locations(document)
                entities.extend(locations)

            if entity_config.get('extract_events', True):
                events = await self._extract_events(document)
                entities.extend(events)

            # Extract relationships
            if entity_config.get('extract_relationships', True):
                relationships = await self._extract_relationships(document, entities)

            logger.info(f"Extracted {len(entities)} entities and {len(relationships)} relationships from {document.doc_id}")
            return entities, relationships

        except Exception as e:
            logger.error(f"Failed to extract entities from {document.doc_id}: {e}")
            return [], []

    async def _extract_concepts(self, document: Document) -> List[GraphEntity]:
        """Extract conceptual entities from document"""
        concepts = []

        # Simple concept extraction using keyword patterns and NLP
        import re

        # Find technical terms, acronyms, and important concepts
        content = document.content

        # Find terms in quotes or emphasis
        quoted_terms = re.findall(r'"([^"]+)"', content)
        emphasized_terms = re.findall(r'\*([^*]+)\*', content)
        bracket_terms = re.findall(r'\[([^\]]+)\]', content)

        # Find technical terms (camelCase, PascalCase)
        tech_terms = re.findall(r'\b[A-Z][a-zA-Z]*(?:[A-Z][a-zA-Z]*)*\b', content)

        all_terms = set(quoted_terms + emphasized_terms + bracket_terms + tech_terms)

        for term in all_terms:
            if len(term) > 2 and term.lower() not in ['this', 'that', 'the', 'and', 'for', 'with']:
                concepts.append(GraphEntity(
                    name=term,
                    entity_type="concept",
                    description=f"Concept extracted from {document.metadata.get('title', 'document')}",
                    properties={
                        "source_title": document.metadata.get('title', ''),
                        "extraction_method": "pattern_matching",
                        "extraction_timestamp": datetime.now().isoformat()
                    },
                    source_doc_id=document.doc_id
                ))

        return concepts

    async def _extract_people(self, document: Document) -> List[GraphEntity]:
        """Extract person names from document"""
        people = []

        # Simple person name extraction
        import re

        # Find capitalized names (simple heuristic)
        content = document.content
        name_patterns = re.findall(r'\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', content)

        for name in name_patterns:
            if len(name.split()) >= 2 and not any(word in name.lower() for word in ['this', 'that', 'these', 'those']):
                people.append(GraphEntity(
                    name=name,
                    entity_type="person",
                    description=f"Person mentioned in {document.metadata.get('title', 'document')}",
                    properties={
                        "source_title": document.metadata.get('title', ''),
                        "extraction_timestamp": datetime.now().isoformat()
                    },
                    source_doc_id=document.doc_id
                ))

        return people

    async def _extract_organizations(self, document: Document) -> List[GraphEntity]:
        """Extract organization names from document"""
        organizations = []

        import re

        content = document.content

        # Common organization patterns
        org_patterns = [
            r'\b([A-Z][a-zA-Z]+ (?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited|Co|Technologies|Systems|Solutions))\b',
            r'\b((?:Apple|Google|Microsoft|Amazon|Meta|OpenAI|Anthropic|GitHub|Netflix|Tesla|IBM|Oracle|Salesforce|Adobe|Intel|NVIDIA|AMD|Cisco|VMware|Docker|Kubernetes|Redis|PostgreSQL|MySQL|MongoDB|Elasticsearch|Apache|Linux|Ubuntu|Debian|Red Hat|Canonical))\b'
        ]

        for pattern in org_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                organizations.append(GraphEntity(
                    name=match,
                    entity_type="organization",
                    description=f"Organization mentioned in {document.metadata.get('title', 'document')}",
                    properties={
                        "source_title": document.metadata.get('title', ''),
                        "extraction_timestamp": datetime.now().isoformat()
                    },
                    source_doc_id=document.doc_id
                ))

        return organizations

    async def _extract_locations(self, document: Document) -> List[GraphEntity]:
        """Extract location names from document"""
        locations = []

        import re

        content = document.content

        # Simple location patterns
        location_patterns = [
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*, [A-Z]{2})\b',  # City, State
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b'  # Capitalized words (filtered later)
        ]

        for pattern in location_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                # Simple filtering to avoid too many false positives
                if len(match.split()) <= 3 and len(match) > 2:
                    locations.append(GraphEntity(
                        name=match,
                        entity_type="location",
                        description=f"Location mentioned in {document.metadata.get('title', 'document')}",
                        properties={
                            "source_title": document.metadata.get('title', ''),
                            "extraction_timestamp": datetime.now().isoformat()
                        },
                        source_doc_id=document.doc_id
                    ))

        return locations

    async def _extract_events(self, document: Document) -> List[GraphEntity]:
        """Extract event names from document"""
        events = []

        import re

        content = document.content

        # Event patterns
        event_patterns = [
            r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:\s+(?:meeting|conference|summit|workshop|launch|release|deadline|milestone)))\b',
            r'\b((?:meeting|conference|summit|workshop|launch|release|deadline|milestone)[^(]*\d{4})\b',
            r'\b([A-Z][a-zA-Z]+ (?:Conference|Summit|Workshop|Meeting|Launch|Release|Event))\b'
        ]

        for pattern in event_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                events.append(GraphEntity(
                    name=match.strip(),
                    entity_type="event",
                    description=f"Event mentioned in {document.metadata.get('title', 'document')}",
                    properties={
                        "source_title": document.metadata.get('title', ''),
                        "extraction_timestamp": datetime.now().isoformat()
                    },
                    source_doc_id=document.doc_id
                ))

        return events

    async def _extract_relationships(self, document: Document, entities: List[GraphEntity]) -> List[GraphRelationship]:
        """Extract relationships between entities"""
        relationships = []

        import re

        content = document.content.lower()
        entity_names = [entity.name.lower() for entity in entities]

        # Relationship patterns
        relationship_patterns = {
            "related_to": ["related to", "connected to", "associated with", "linked to"],
            "part_of": ["part of", "belongs to", "component of", "subset of"],
            "mentions": ["mentions", "refers to", "talks about", "discusses"],
            "examples_of": ["example of", "instance of", "type of", "kind of"],
            "works_for": ["works at", "employed by", "member of", "joined"],
            "located_in": ["located in", "based in", "operates in", "serves"],
            "created_by": ["created by", "developed by", "built by", "authored by"]
        }

        for rel_type, patterns in relationship_patterns.items():
            for pattern in patterns:
                # Find sentences containing the pattern
                sentences = re.split(r'[.!?]+', content)
                for sentence in sentences:
                    if pattern in sentence:
                        # Find entities mentioned in this sentence
                        mentioned_entities = []
                        for i, entity_name in enumerate(entity_names):
                            if entity_name in sentence:
                                mentioned_entities.append(i)

                        # Create relationships between mentioned entities
                        for i in range(len(mentioned_entities)):
                            for j in range(i + 1, len(mentioned_entities)):
                                source_idx = mentioned_entities[i]
                                target_idx = mentioned_entities[j]

                                # Simple confidence based on proximity
                                confidence = 0.7
                                if entities[source_idx].name.lower() in sentence and entities[target_idx].name.lower() in sentence:
                                    confidence += 0.2

                                relationships.append(GraphRelationship(
                                    source=entities[source_idx].name,
                                    target=entities[target_idx].name,
                                    relationship_type=rel_type,
                                    properties={
                                        "source_doc_id": document.doc_id,
                                        "source_title": document.metadata.get('title', ''),
                                        "extraction_pattern": pattern,
                                        "extraction_timestamp": datetime.now().isoformat()
                                    },
                                    confidence=min(confidence, 1.0)
                                ))

        return relationships

    async def add_entities_and_relationships(self, entities: List[GraphEntity], relationships: List[GraphRelationship]):
        """Add entities and relationships to the knowledge graph"""
        if not self.enabled:
            return

        try:
            with self.driver.session(database=self.database) as session:
                # Add entities
                for entity in entities:
                    await self._add_entity(session, entity)

                # Add relationships
                for relationship in relationships:
                    await self._add_relationship(session, relationship)

            logger.info(f"Added {len(entities)} entities and {len(relationships)} relationships to knowledge graph")

        except Exception as e:
            logger.error(f"Failed to add entities and relationships to knowledge graph: {e}")
            raise

    async def _add_entity(self, session, entity: GraphEntity):
        """Add a single entity to the knowledge graph"""
        query = """
        MERGE (e:Entity {name: $name})
        ON CREATE SET
            e.type = $type,
            e.description = $description,
            e.properties = $properties,
            e.source_doc_id = $source_doc_id,
            e.created_at = timestamp()
        ON MATCH SET
            e.description = coalesce(e.description, $description),
            e.properties = CASE
                WHEN e.properties IS NULL THEN $properties
                ELSE apoc.map.merge(e.properties, $properties)
            END,
            e.updated_at = timestamp()
        """

        await session.run(query, {
            "name": entity.name,
            "type": entity.entity_type,
            "description": entity.description,
            "properties": json.dumps(entity.properties),
            "source_doc_id": entity.source_doc_id
        })

    async def _add_relationship(self, session, relationship: GraphRelationship):
        """Add a single relationship to the knowledge graph"""
        query = """
        MATCH (source:Entity {name: $source})
        MATCH (target:Entity {name: $target})
        MERGE (source)-[r:RELATIONSHIP {type: $type}]->(target)
        ON CREATE SET
            r.properties = $properties,
            r.confidence = $confidence,
            r.created_at = timestamp()
        ON MATCH SET
            r.properties = CASE
                WHEN r.properties IS NULL THEN $properties
                ELSE apoc.map.merge(r.properties, $properties)
            END,
            r.confidence = greatest(r.confidence, $confidence),
            r.updated_at = timestamp(),
            r.frequency = coalesce(r.frequency, 0) + 1
        """

        await session.run(query, {
            "source": relationship.source,
            "target": relationship.target,
            "type": relationship.relationship_type,
            "properties": json.dumps(relationship.properties),
            "confidence": relationship.confidence
        })

    async def search_entities(self, query: str, entity_types: Optional[List[str]] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Search for entities in the knowledge graph"""
        if not self.enabled:
            return []

        try:
            with self.driver.session(database=self.database) as session:
                if entity_types:
                    query_cypher = """
                    MATCH (e:Entity)
                    WHERE e.type IN $entity_types AND (
                        toLower(e.name) CONTAINS toLower($query) OR
                        toLower(e.description) CONTAINS toLower($query)
                    )
                    RETURN e.name as name, e.type as type, e.description as description,
                           e.properties as properties, e.source_doc_id as source_doc_id
                    ORDER BY CASE
                        WHEN toLower(e.name) STARTS WITH toLower($query) THEN 1
                        WHEN toLower(e.name) CONTAINS toLower($query) THEN 2
                        ELSE 3
                    END
                    LIMIT $limit
                    """
                    result = await session.run(query_cypher, {
                        "query": query,
                        "entity_types": entity_types,
                        "limit": limit
                    })
                else:
                    query_cypher = """
                    MATCH (e:Entity)
                    WHERE toLower(e.name) CONTAINS toLower($query) OR
                          toLower(e.description) CONTAINS toLower($query)
                    RETURN e.name as name, e.type as type, e.description as description,
                           e.properties as properties, e.source_doc_id as source_doc_id
                    ORDER BY CASE
                        WHEN toLower(e.name) STARTS WITH toLower($query) THEN 1
                        WHEN toLower(e.name) CONTAINS toLower($query) THEN 2
                        ELSE 3
                    END
                    LIMIT $limit
                    """
                    result = await session.run(query_cypher, {
                        "query": query,
                        "limit": limit
                    })

                entities = []
                async for record in result:
                    entities.append({
                        "name": record["name"],
                        "type": record["type"],
                        "description": record["description"],
                        "properties": json.loads(record["properties"]) if record["properties"] else {},
                        "source_doc_id": record["source_doc_id"]
                    })

                return entities

        except Exception as e:
            logger.error(f"Failed to search entities: {e}")
            return []

    async def get_related_entities(self, entity_name: str, relationship_types: Optional[List[str]] = None, max_depth: int = 2) -> List[Dict[str, Any]]:
        """Get entities related to a given entity"""
        if not self.enabled:
            return []

        try:
            with self.driver.session(database=self.database) as session:
                if relationship_types:
                    query_cypher = """
                    MATCH (e:Entity {name: $entity_name})
                    CALL apoc.path.expandConfig(e, {
                        relationshipFilter: $relationship_types,
                        maxLevel: $max_depth,
                        uniqueness: 'RELATIONSHIP_GLOBAL'
                    })
                    YIELD path
                    UNWIND nodes(path) as node
                    WITH DISTINCT node
                    RETURN node.name as name, node.type as type, node.description as description,
                           node.properties as properties, node.source_doc_id as source_doc_id
                    LIMIT 50
                    """
                    result = await session.run(query_cypher, {
                        "entity_name": entity_name,
                        "relationship_types": "|".join([f"RELATIONSHIP[{rel_type}]" for rel_type in relationship_types]),
                        "max_depth": max_depth
                    })
                else:
                    query_cypher = """
                    MATCH (e:Entity {name: $entity_name})
                    MATCH (e)-[:RELATIONSHIP*1..$max_depth]-(related)
                    WITH DISTINCT related
                    RETURN related.name as name, related.type as type, related.description as description,
                           related.properties as properties, related.source_doc_id as source_doc_id
                    ORDER BY length(shortestPath((e)-[:RELATIONSHIP]-(related)))
                    LIMIT 50
                    """
                    result = await session.run(query_cypher, {
                        "entity_name": entity_name,
                        "max_depth": max_depth
                    })

                related_entities = []
                async for record in result:
                    related_entities.append({
                        "name": record["name"],
                        "type": record["type"],
                        "description": record["description"],
                        "properties": json.loads(record["properties"]) if record["properties"] else {},
                        "source_doc_id": record["source_doc_id"]
                    })

                return related_entities

        except Exception as e:
            logger.error(f"Failed to get related entities for {entity_name}: {e}")
            return []

    async def get_entity_context(self, entity_name: str) -> Dict[str, Any]:
        """Get rich context for an entity including relationships and related documents"""
        if not self.enabled:
            return {}

        try:
            with self.driver.session(database=self.database) as session:
                # Get entity details
                entity_query = """
                MATCH (e:Entity {name: $entity_name})
                OPTIONAL MATCH (e)-[r:RELATIONSHIP]-(related)
                RETURN e.name as name, e.type as type, e.description as description,
                       e.properties as properties, e.source_doc_id as source_doc_id,
                       collect(DISTINCT {
                           related_name: related.name,
                           related_type: related.type,
                           relationship_type: r.type,
                           relationship_properties: r.properties,
                           confidence: r.confidence
                       }) as relationships
                """

                result = await session.run(entity_query, {"entity_name": entity_name})
                record = await result.single()

                if not record:
                    return {}

                # Get related documents
                doc_query = """
                MATCH (e:Entity {name: $entity_name})
                MATCH (doc:Document)
                WHERE doc.doc_id = e.source_doc_id OR
                      exists((doc)-[:CONTAINS]->(e))
                RETURN DISTINCT doc.doc_id as doc_id, doc.title as title, doc.content as content
                """

                doc_result = await session.run(doc_query, {"entity_name": entity_name})
                documents = []
                async for doc_record in doc_result:
                    documents.append({
                        "doc_id": doc_record["doc_id"],
                        "title": doc_record["title"],
                        "content": doc_record["content"][:500] + "..." if doc_record["content"] and len(doc_record["content"]) > 500 else doc_record["content"]
                    })

                return {
                    "entity": {
                        "name": record["name"],
                        "type": record["type"],
                        "description": record["description"],
                        "properties": json.loads(record["properties"]) if record["properties"] else {},
                        "source_doc_id": record["source_doc_id"]
                    },
                    "relationships": record["relationships"],
                    "related_documents": documents
                }

        except Exception as e:
            logger.error(f"Failed to get entity context for {entity_name}: {e}")
            return {}

    def close(self):
        """Close the database connection"""
        if self.driver:
            self.driver.close()
            logger.info("Graphiti adapter connection closed")