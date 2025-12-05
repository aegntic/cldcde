"""
Unified MCP tools that combine memory, task management, context, and RAG functionality.
"""
import json
from typing import List, Dict, Any, Optional
from mcp.server.fastmcp import FastMCP, Context

def register_unified_tools(mcp: FastMCP):
    """Register all unified MCP tools."""
    
    # ============================================
    # MEMORY/KNOWLEDGE GRAPH TOOLS
    # ============================================
    
    @mcp.tool()
    async def create_entities(ctx: Context, entities: List[Dict[str, Any]]) -> str:
        """
        Create multiple new entities in the knowledge graph.
        
        Each entity should have:
        - name: The name of the entity
        - entityType: The type of the entity
        - observations: An array of observation contents
        
        Args:
            ctx: The MCP server provided context
            entities: List of entity dictionaries
            
        Returns:
            JSON string with created entity IDs
        """
        try:
            knowledge_graph = ctx.request_context.lifespan_context.knowledge_graph
            created_ids = await knowledge_graph.create_entities(entities)
            
            return json.dumps({
                "success": True,
                "created_entities": len(entities),
                "entity_ids": created_ids
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def create_relations(ctx: Context, relations: List[Dict[str, str]]) -> str:
        """
        Create multiple new relations between entities in the knowledge graph.
        
        Each relation should have:
        - from: The name of the entity where the relation starts
        - to: The name of the entity where the relation ends
        - relationType: The type of the relation
        
        Args:
            ctx: The MCP server provided context
            relations: List of relation dictionaries
            
        Returns:
            JSON string with created relation IDs
        """
        try:
            knowledge_graph = ctx.request_context.lifespan_context.knowledge_graph
            created_ids = await knowledge_graph.create_relations(relations)
            
            return json.dumps({
                "success": True,
                "created_relations": len(relations),
                "relation_ids": created_ids
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def add_observations(ctx: Context, observations: List[Dict[str, Any]]) -> str:
        """
        Add new observations to existing entities in the knowledge graph.
        
        Each observation should have:
        - entityName: The name of the entity to add observations to
        - contents: An array of observation contents to add
        
        Args:
            ctx: The MCP server provided context
            observations: List of observation dictionaries
            
        Returns:
            JSON string with created observation IDs
        """
        try:
            knowledge_graph = ctx.request_context.lifespan_context.knowledge_graph
            created_ids = await knowledge_graph.add_observations(observations)
            
            return json.dumps({
                "success": True,
                "created_observations": len(created_ids),
                "observation_ids": created_ids
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def read_graph(ctx: Context) -> str:
        """
        Read the entire knowledge graph.
        
        Args:
            ctx: The MCP server provided context
            
        Returns:
            JSON string with all entities and relations
        """
        try:
            knowledge_graph = ctx.request_context.lifespan_context.knowledge_graph
            graph_data = await knowledge_graph.read_graph()
            
            return json.dumps(graph_data, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def search_nodes(ctx: Context, query: str) -> str:
        """
        Search for nodes in the knowledge graph based on a query.
        
        Args:
            ctx: The MCP server provided context
            query: The search query to match against entity names, types, and observations
            
        Returns:
            JSON string with matching nodes
        """
        try:
            knowledge_graph = ctx.request_context.lifespan_context.knowledge_graph
            results = await knowledge_graph.search_nodes(query)
            
            return json.dumps({
                "success": True,
                "query": query,
                "results": results,
                "count": len(results)
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def open_nodes(ctx: Context, names: List[str]) -> str:
        """
        Open specific nodes in the knowledge graph by their names.
        
        Args:
            ctx: The MCP server provided context
            names: An array of entity names to retrieve
            
        Returns:
            JSON string with entity details
        """
        try:
            knowledge_graph = ctx.request_context.lifespan_context.knowledge_graph
            results = await knowledge_graph.open_nodes(names)
            
            return json.dumps({
                "success": True,
                "requested": names,
                "results": results,
                "found": len(results)
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    # ============================================
    # TASK MANAGEMENT TOOLS
    # ============================================
    
    @mcp.tool()
    async def create_tasks(ctx: Context, tasks: List[Dict[str, Any]]) -> str:
        """
        Create multiple tasks for planning and tracking work.
        
        Each task should have:
        - content: Description of the task
        - status: Task status (pending, in_progress, completed, cancelled)
        - priority: Task priority (low, medium, high)
        - project: Optional project name
        
        Args:
            ctx: The MCP server provided context
            tasks: List of task dictionaries
            
        Returns:
            JSON string with created task IDs
        """
        try:
            task_manager = ctx.request_context.lifespan_context.task_manager
            created_ids = await task_manager.create_tasks(tasks)
            
            return json.dumps({
                "success": True,
                "created_tasks": len(tasks),
                "task_ids": created_ids
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def update_task_status(ctx: Context, task_id: str, status: str) -> str:
        """
        Update the status of a specific task.
        
        Args:
            ctx: The MCP server provided context
            task_id: ID of the task to update
            status: New status (pending, in_progress, completed, cancelled)
            
        Returns:
            JSON string with update result
        """
        try:
            task_manager = ctx.request_context.lifespan_context.task_manager
            updated = await task_manager.update_task_status(task_id, status)
            
            return json.dumps({
                "success": updated,
                "task_id": task_id,
                "status": status,
                "message": "Task updated successfully" if updated else "Task not found"
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def get_tasks(ctx: Context, status: Optional[str] = None, 
                       project: Optional[str] = None, limit: int = 100) -> str:
        """
        Get tasks with optional filtering.
        
        Args:
            ctx: The MCP server provided context
            status: Optional status filter (pending, in_progress, completed, cancelled)
            project: Optional project filter
            limit: Maximum number of tasks to return
            
        Returns:
            JSON string with task list
        """
        try:
            task_manager = ctx.request_context.lifespan_context.task_manager
            tasks = await task_manager.get_tasks(status, project, limit)
            
            return json.dumps({
                "success": True,
                "filters": {
                    "status": status,
                    "project": project,
                    "limit": limit
                },
                "tasks": tasks,
                "count": len(tasks)
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def get_task_summary(ctx: Context) -> str:
        """
        Get task summary statistics.
        
        Args:
            ctx: The MCP server provided context
            
        Returns:
            JSON string with task statistics
        """
        try:
            task_manager = ctx.request_context.lifespan_context.task_manager
            summary = await task_manager.get_task_summary()
            
            return json.dumps({
                "success": True,
                "summary": summary
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def sequential_thinking(ctx: Context, thought: str, thought_number: int = 1,
                                total_thoughts: int = 5, next_thought_needed: bool = True,
                                is_revision: bool = False, revises_thought: Optional[int] = None,
                                branch_from_thought: Optional[int] = None, 
                                branch_id: Optional[str] = None,
                                needs_more_thoughts: bool = False) -> str:
        """
        Process sequential thinking steps for dynamic problem-solving.
        
        Args:
            ctx: The MCP server provided context
            thought: Your current thinking step
            thought_number: Current thought number
            total_thoughts: Estimated total thoughts needed
            next_thought_needed: Whether another thought step is needed
            is_revision: Whether this revises previous thinking
            revises_thought: Which thought number is being reconsidered
            branch_from_thought: Which thought number is the branching point
            branch_id: Identifier for the current branch
            needs_more_thoughts: If more thoughts are needed
            
        Returns:
            JSON string with thinking session data
        """
        try:
            task_manager = ctx.request_context.lifespan_context.task_manager
            result = await task_manager.sequential_thinking(
                thought, thought_number, total_thoughts, next_thought_needed,
                is_revision, revises_thought, branch_from_thought, branch_id, needs_more_thoughts
            )
            
            return json.dumps(result, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    # ============================================
    # DOCUMENTATION CONTEXT TOOLS
    # ============================================
    
    @mcp.tool()
    async def resolve_library_id(ctx: Context, library_name: str) -> str:
        """
        Resolve a package/product name to a Context7-compatible library ID.
        
        Args:
            ctx: The MCP server provided context
            library_name: Library name to search for and retrieve a library ID
            
        Returns:
            JSON string with library information and resolved ID
        """
        try:
            context_manager = ctx.request_context.lifespan_context.context_manager
            result = await context_manager.resolve_library_id(library_name)
            
            return json.dumps({
                "success": True,
                "library_name": library_name,
                "resolved": result
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def get_library_docs(ctx: Context, library_id: str, 
                             tokens: int = 10000, topic: Optional[str] = None) -> str:
        """
        Fetch up-to-date documentation for a library.
        
        Args:
            ctx: The MCP server provided context
            library_id: Context7-compatible library ID (e.g., '/org/project')
            tokens: Maximum number of tokens of documentation to retrieve
            topic: Topic to focus documentation on (e.g., 'hooks', 'routing')
            
        Returns:
            JSON string with documentation content
        """
        try:
            context_manager = ctx.request_context.lifespan_context.context_manager
            result = await context_manager.get_library_docs(library_id, tokens, topic)
            
            return json.dumps({
                "success": True,
                "library_id": library_id,
                "documentation": result
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def get_context_cache_stats(ctx: Context) -> str:
        """
        Get documentation cache statistics and management info.
        
        Args:
            ctx: The MCP server provided context
            
        Returns:
            JSON string with cache statistics
        """
        try:
            context_manager = ctx.request_context.lifespan_context.context_manager
            stats = await context_manager.get_cache_stats()
            
            return json.dumps({
                "success": True,
                "cache_stats": stats
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)
    
    @mcp.tool()
    async def clear_expired_context_cache(ctx: Context) -> str:
        """
        Clear expired documentation cache entries.
        
        Args:
            ctx: The MCP server provided context
            
        Returns:
            JSON string with cleanup results
        """
        try:
            context_manager = ctx.request_context.lifespan_context.context_manager
            cleared_count = await context_manager.clear_expired_cache()
            
            return json.dumps({
                "success": True,
                "cleared_entries": cleared_count,
                "message": f"Cleared {cleared_count} expired cache entries"
            }, indent=2)
        except Exception as e:
            return json.dumps({
                "success": False,
                "error": str(e)
            }, indent=2)