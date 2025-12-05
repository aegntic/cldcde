"""
Task management system for planning and workflow orchestration.
Integrates with knowledge graph for persistent task storage.
"""
import os
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import aiosqlite
from pathlib import Path

class TaskManager:
    """
    Task management system with planning and execution tracking.
    """
    
    def __init__(self, db_path: str = None):
        """
        Initialize task manager.
        
        Args:
            db_path: Path to SQLite database file
        """
        if db_path is None:
            persist_dir = os.getenv("VECTOR_DB_DIR", str(Path.home() / ".aegntic_knowledge"))
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            db_path = str(Path(persist_dir) / "knowledge_graph.db")
        
        self.db_path = db_path
    
    async def create_tasks(self, tasks: List[Dict[str, Any]]) -> List[str]:
        """
        Create multiple tasks.
        
        Args:
            tasks: List of task dictionaries with content, status, priority, etc.
            
        Returns:
            List of created task IDs
        """
        created_ids = []
        
        async with aiosqlite.connect(self.db_path) as conn:
            for task_data in tasks:
                task_id = task_data.get("id", str(uuid.uuid4()))
                content = task_data["content"]
                status = task_data.get("status", "pending")
                priority = task_data.get("priority", "medium")
                project = task_data.get("project")
                
                await conn.execute("""
                    INSERT OR REPLACE INTO tasks 
                    (id, content, status, priority, project, updated_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (task_id, content, status, priority, project))
                
                created_ids.append(task_id)
            
            await conn.commit()
        
        return created_ids
    
    async def update_task_status(self, task_id: str, status: str) -> bool:
        """
        Update task status.
        
        Args:
            task_id: Task ID to update
            status: New status (pending, in_progress, completed, cancelled)
            
        Returns:
            True if task was updated, False if not found
        """
        async with aiosqlite.connect(self.db_path) as conn:
            # Set completed_at if status is completed
            if status == "completed":
                cursor = await conn.execute("""
                    UPDATE tasks 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (status, task_id))
            else:
                cursor = await conn.execute("""
                    UPDATE tasks 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP, completed_at = NULL
                    WHERE id = ?
                """, (status, task_id))
            
            await conn.commit()
            return cursor.rowcount > 0
    
    async def get_tasks(self, status: Optional[str] = None, 
                       project: Optional[str] = None,
                       limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get tasks with optional filtering.
        
        Args:
            status: Filter by status
            project: Filter by project
            limit: Maximum number of tasks to return
            
        Returns:
            List of task dictionaries
        """
        query = "SELECT * FROM tasks WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if project:
            query += " AND project = ?"
            params.append(project)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(query, params)
            columns = [description[0] for description in cursor.description]
            
            tasks = []
            async for row in cursor:
                task_dict = dict(zip(columns, row))
                tasks.append(task_dict)
        
        return tasks
    
    async def delete_tasks(self, task_ids: List[str]) -> int:
        """
        Delete multiple tasks.
        
        Args:
            task_ids: List of task IDs to delete
            
        Returns:
            Number of tasks deleted
        """
        async with aiosqlite.connect(self.db_path) as conn:
            deleted_count = 0
            for task_id in task_ids:
                cursor = await conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
                deleted_count += cursor.rowcount
            
            await conn.commit()
        
        return deleted_count
    
    async def get_task_summary(self) -> Dict[str, Any]:
        """
        Get task summary statistics.
        
        Returns:
            Dictionary with task counts by status and other metrics
        """
        async with aiosqlite.connect(self.db_path) as conn:
            # Count by status
            cursor = await conn.execute("""
                SELECT status, COUNT(*) as count 
                FROM tasks 
                GROUP BY status
            """)
            
            status_counts = {}
            async for row in cursor:
                status_counts[row[0]] = row[1]
            
            # Count by priority
            cursor = await conn.execute("""
                SELECT priority, COUNT(*) as count 
                FROM tasks 
                GROUP BY priority
            """)
            
            priority_counts = {}
            async for row in cursor:
                priority_counts[row[0]] = row[1]
            
            # Recent activity
            cursor = await conn.execute("""
                SELECT COUNT(*) as count 
                FROM tasks 
                WHERE updated_at >= datetime('now', '-7 days')
            """)
            
            recent_activity = (await cursor.fetchone())[0]
            
            # Total tasks
            cursor = await conn.execute("SELECT COUNT(*) FROM tasks")
            total_tasks = (await cursor.fetchone())[0]
        
        return {
            "total_tasks": total_tasks,
            "status_counts": status_counts,
            "priority_counts": priority_counts,
            "recent_activity": recent_activity
        }
    
    async def sequential_thinking(self, thought: str, thought_number: int = 1,
                                total_thoughts: int = 5, 
                                next_thought_needed: bool = True,
                                is_revision: bool = False,
                                revises_thought: Optional[int] = None,
                                branch_from_thought: Optional[int] = None,
                                branch_id: Optional[str] = None,
                                needs_more_thoughts: bool = False) -> Dict[str, Any]:
        """
        Process sequential thinking steps and store them as tasks.
        
        Args:
            thought: Current thinking step
            thought_number: Current thought number
            total_thoughts: Total estimated thoughts needed
            next_thought_needed: Whether another thought step is needed
            is_revision: Whether this revises previous thinking
            revises_thought: Which thought number is being reconsidered
            branch_from_thought: Which thought number is the branching point
            branch_id: Identifier for the current branch
            needs_more_thoughts: If more thoughts are needed
            
        Returns:
            Thinking session summary
        """
        # Create a thinking session task
        session_id = str(uuid.uuid4())
        
        thinking_data = {
            "thought": thought,
            "thought_number": thought_number,
            "total_thoughts": total_thoughts,
            "next_thought_needed": next_thought_needed,
            "is_revision": is_revision,
            "revises_thought": revises_thought,
            "branch_from_thought": branch_from_thought,
            "branch_id": branch_id,
            "needs_more_thoughts": needs_more_thoughts,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
        # Store as a task for persistence
        await self.create_tasks([{
            "id": f"thinking_{session_id}_{thought_number}",
            "content": f"Thinking Step {thought_number}: {thought}",
            "status": "completed" if not next_thought_needed else "in_progress",
            "priority": "medium",
            "project": f"thinking_session_{session_id}"
        }])
        
        return {
            "thoughtNumber": thought_number,
            "totalThoughts": total_thoughts,
            "nextThoughtNeeded": next_thought_needed,
            "branches": [branch_id] if branch_id else [],
            "thoughtHistoryLength": thought_number,
            "sessionId": session_id,
            "metadata": thinking_data
        }