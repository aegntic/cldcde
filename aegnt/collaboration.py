"""
AEGNT Collaboration Hub - Inter-agent communication system
"""

import asyncio
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import json

class MessagePriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class Message:
    id: str
    sender: str
    recipient: str
    content: Dict
    priority: MessagePriority
    timestamp: datetime
    requires_response: bool = False
    response: Optional[Dict] = None

class CollaborationHub:
    """Central hub for agent collaboration and communication"""
    
    def __init__(self):
        self.agents = {}
        self.message_queue = asyncio.Queue()
        self.conversation_log = []
        self.active_collaborations = {}
        self.knowledge_graph = {}
        
    def register_agent(self, agent: Any) -> None:
        """Register an agent with the collaboration hub"""
        self.agents[agent.name] = agent
        self.knowledge_graph[agent.name] = {
            "capabilities": getattr(agent, "capabilities", []),
            "interactions": [],
            "learnings": []
        }
    
    async def send_message(self, sender: str, recipient: str, content: Dict, 
                          priority: MessagePriority = MessagePriority.MEDIUM,
                          requires_response: bool = False) -> Optional[Dict]:
        """Send a message between agents"""
        
        message = Message(
            id=f"msg_{datetime.now().timestamp()}",
            sender=sender,
            recipient=recipient,
            content=content,
            priority=priority,
            timestamp=datetime.now(),
            requires_response=requires_response
        )
        
        # Log the message
        self._log_message(message)
        
        # If it's a broadcast
        if recipient == "ALL":
            return await self._broadcast_message(message)
        
        # Direct message
        if recipient in self.agents:
            response = await self.agents[recipient].receive_message(
                self.agents[sender], 
                content
            )
            
            if requires_response:
                message.response = response
                self._log_message(message)  # Log again with response
                
            return response
        else:
            raise ValueError(f"Unknown recipient: {recipient}")
    
    async def _broadcast_message(self, message: Message) -> Dict:
        """Broadcast message to all agents"""
        responses = {}
        
        for agent_name, agent in self.agents.items():
            if agent_name != message.sender:
                try:
                    response = await agent.receive_message(
                        self.agents[message.sender],
                        message.content
                    )
                    responses[agent_name] = response
                except Exception as e:
                    responses[agent_name] = {"error": str(e)}
        
        return responses
    
    async def collaborate_on_task(self, task: Dict) -> Dict:
        """Orchestrate multi-agent collaboration on a task"""
        
        collaboration_id = f"collab_{datetime.now().timestamp()}"
        self.active_collaborations[collaboration_id] = {
            "task": task,
            "status": "active",
            "participants": [],
            "results": {}
        }
        
        try:
            # Determine which agents are needed
            required_agents = self._determine_required_agents(task)
            
            # Create collaboration context
            context = {
                "collaboration_id": collaboration_id,
                "task": task,
                "participants": required_agents
            }
            
            # Notify all required agents
            for agent_name in required_agents:
                await self.send_message(
                    "CollaborationHub",
                    agent_name,
                    {
                        "type": "collaboration_request",
                        "context": context
                    },
                    priority=MessagePriority.HIGH
                )
                self.active_collaborations[collaboration_id]["participants"].append(agent_name)
            
            # Enable real-time collaboration
            await self._enable_collaboration_channel(collaboration_id, required_agents)
            
            # Wait for collaboration to complete
            results = await self._wait_for_collaboration_results(collaboration_id)
            
            # Update collaboration status
            self.active_collaborations[collaboration_id]["status"] = "completed"
            self.active_collaborations[collaboration_id]["results"] = results
            
            return results
            
        except Exception as e:
            self.active_collaborations[collaboration_id]["status"] = "failed"
            self.active_collaborations[collaboration_id]["error"] = str(e)
            raise
    
    def _determine_required_agents(self, task: Dict) -> List[str]:
        """Determine which agents are needed for a task"""
        required = []
        
        task_type = task.get("type", "")
        
        if "deploy" in task_type or "cloudflare" in task_type:
            required.append("CloudflareAgent")
        if "database" in task_type or "supabase" in task_type:
            required.append("SupabaseAgent")
        if task.get("requires_approval", True):
            required.append("HILLM")
            
        return required
    
    async def _enable_collaboration_channel(self, collaboration_id: str, agents: List[str]) -> None:
        """Enable real-time collaboration between agents"""
        
        # Create a shared context for the collaboration
        shared_context = {
            "collaboration_id": collaboration_id,
            "agents": agents,
            "messages": [],
            "decisions": [],
            "conflicts": []
        }
        
        # Set up message routing for this collaboration
        for agent_name in agents:
            agent = self.agents[agent_name]
            
            # Inject collaboration context
            if hasattr(agent, "set_collaboration_context"):
                agent.set_collaboration_context(shared_context)
    
    async def _wait_for_collaboration_results(self, collaboration_id: str, timeout: int = 300) -> Dict:
        """Wait for collaboration to complete"""
        
        start_time = datetime.now()
        
        while (datetime.now() - start_time).seconds < timeout:
            collab = self.active_collaborations[collaboration_id]
            
            # Check if all agents have provided results
            if len(collab["results"]) == len(collab["participants"]):
                return collab["results"]
            
            # Check for conflicts that need resolution
            if "conflicts" in collab and collab["conflicts"]:
                await self._resolve_conflicts(collaboration_id, collab["conflicts"])
            
            await asyncio.sleep(1)
        
        raise TimeoutError(f"Collaboration {collaboration_id} timed out")
    
    async def _resolve_conflicts(self, collaboration_id: str, conflicts: List[Dict]) -> None:
        """Resolve conflicts between agents"""
        
        for conflict in conflicts:
            # Ask HILLM to resolve
            resolution = await self.send_message(
                "CollaborationHub",
                "HILLM",
                {
                    "type": "conflict_resolution",
                    "conflict": conflict,
                    "collaboration_id": collaboration_id
                },
                priority=MessagePriority.CRITICAL,
                requires_response=True
            )
            
            # Apply resolution
            if resolution and resolution.get("resolution"):
                await self._apply_conflict_resolution(collaboration_id, conflict, resolution["resolution"])
    
    async def _apply_conflict_resolution(self, collaboration_id: str, conflict: Dict, resolution: Dict) -> None:
        """Apply conflict resolution decision"""
        
        # Notify involved agents
        for agent_name in conflict["agents"]:
            await self.send_message(
                "CollaborationHub",
                agent_name,
                {
                    "type": "conflict_resolved",
                    "conflict": conflict,
                    "resolution": resolution
                },
                priority=MessagePriority.HIGH
            )
    
    def _log_message(self, message: Message) -> None:
        """Log message to conversation history"""
        log_entry = {
            "id": message.id,
            "timestamp": message.timestamp.isoformat(),
            "sender": message.sender,
            "recipient": message.recipient,
            "content": message.content,
            "priority": message.priority.name,
            "response": message.response
        }
        
        self.conversation_log.append(log_entry)
        
        # Update knowledge graph
        if message.sender in self.knowledge_graph:
            self.knowledge_graph[message.sender]["interactions"].append({
                "with": message.recipient,
                "timestamp": message.timestamp.isoformat(),
                "type": message.content.get("type", "unknown")
            })
    
    async def share_learning(self, agent_name: str, learning: Dict) -> None:
        """Share a learning across all agents"""
        
        # Store in knowledge graph
        if agent_name in self.knowledge_graph:
            self.knowledge_graph[agent_name]["learnings"].append({
                "timestamp": datetime.now().isoformat(),
                "learning": learning
            })
        
        # Broadcast to other agents
        await self.send_message(
            agent_name,
            "ALL",
            {
                "type": "shared_learning",
                "learning": learning
            },
            priority=MessagePriority.LOW
        )
    
    def get_agent_interactions(self, agent_name: str) -> List[Dict]:
        """Get interaction history for an agent"""
        
        interactions = []
        for entry in self.conversation_log:
            if entry["sender"] == agent_name or entry["recipient"] == agent_name:
                interactions.append(entry)
                
        return interactions
    
    def get_collaboration_history(self) -> List[Dict]:
        """Get history of all collaborations"""
        
        return [
            {
                "id": collab_id,
                "task": collab["task"],
                "status": collab["status"],
                "participants": collab["participants"],
                "results": collab.get("results", {}),
                "error": collab.get("error")
            }
            for collab_id, collab in self.active_collaborations.items()
        ]
    
    async def optimize_collaboration(self) -> Dict:
        """Analyze and optimize collaboration patterns"""
        
        analysis = {
            "total_messages": len(self.conversation_log),
            "total_collaborations": len(self.active_collaborations),
            "agent_activity": {},
            "common_patterns": [],
            "bottlenecks": [],
            "recommendations": []
        }
        
        # Analyze agent activity
        for agent_name in self.agents:
            agent_messages = [
                msg for msg in self.conversation_log 
                if msg["sender"] == agent_name or msg["recipient"] == agent_name
            ]
            
            analysis["agent_activity"][agent_name] = {
                "messages_sent": len([m for m in agent_messages if m["sender"] == agent_name]),
                "messages_received": len([m for m in agent_messages if m["recipient"] == agent_name]),
                "collaborations": len([
                    c for c in self.active_collaborations.values() 
                    if agent_name in c["participants"]
                ])
            }
        
        # Identify bottlenecks
        for agent_name, activity in analysis["agent_activity"].items():
            if activity["messages_received"] > activity["messages_sent"] * 2:
                analysis["bottlenecks"].append({
                    "agent": agent_name,
                    "issue": "Potential overload - receiving many more messages than sending"
                })
        
        # Generate recommendations
        if analysis["bottlenecks"]:
            analysis["recommendations"].append(
                "Consider load balancing or adding additional agent instances for overloaded agents"
            )
        
        return analysis