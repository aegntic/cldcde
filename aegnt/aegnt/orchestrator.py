"""
AEGNT Deployment Orchestrator
"""

import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import json

from .agents import CloudflareAgent, SupabaseAgent, HILLM, AgentStatus
from .collaboration import CollaborationHub

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class DeploymentTask:
    id: str
    agent: str
    description: str
    status: TaskStatus
    dependencies: List[str]
    result: Optional[Dict] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class DeploymentOrchestrator:
    """Orchestrates multi-agent deployments"""
    
    def __init__(self):
        self.cloudflare = CloudflareAgent()
        self.supabase = SupabaseAgent()
        self.hillm = HILLM()
        self.collaboration_hub = CollaborationHub()
        
        self.tasks: Dict[str, DeploymentTask] = {}
        self.deployment_log = []
        
    async def deploy_project(self, config: Dict) -> Dict:
        """Deploy a complete project using all agents"""
        
        # Register agents with collaboration hub
        self.collaboration_hub.register_agent(self.cloudflare)
        self.collaboration_hub.register_agent(self.supabase)
        self.collaboration_hub.register_agent(self.hillm)
        
        # Start deployment
        deployment_id = f"deploy_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.log_event("deployment_started", {"deployment_id": deployment_id, "config": config})
        
        try:
            # Phase 1: HILLM Assessment
            assessment = await self._hillm_assessment(config)
            if not assessment["approved"]:
                raise Exception(f"HILLM rejected deployment: {assessment['reason']}")
            
            # Phase 2: Prepare Infrastructure
            await self._prepare_infrastructure(config)
            
            # Phase 3: Deploy Services
            deployment_results = await self._deploy_services(config)
            
            # Phase 4: Integration Testing
            test_results = await self._run_integration_tests(deployment_results)
            
            # Phase 5: Final Approval
            final_approval = await self._get_final_approval(deployment_results, test_results)
            
            if final_approval["approved"]:
                self.log_event("deployment_completed", {
                    "deployment_id": deployment_id,
                    "results": deployment_results,
                    "duration": self._calculate_duration()
                })
                
                return {
                    "status": "success",
                    "deployment_id": deployment_id,
                    "services": deployment_results,
                    "tests": test_results
                }
            else:
                raise Exception(f"Final approval denied: {final_approval['reason']}")
                
        except Exception as e:
            self.log_event("deployment_failed", {
                "deployment_id": deployment_id,
                "error": str(e)
            })
            
            # Rollback if needed
            await self._rollback_deployment(deployment_id)
            
            return {
                "status": "failed",
                "deployment_id": deployment_id,
                "error": str(e)
            }
    
    async def _hillm_assessment(self, config: Dict) -> Dict:
        """Get HILLM assessment of deployment plan"""
        self.log_event("hillm_assessment_started", {})
        
        assessment_request = {
            "type": "deployment_assessment",
            "config": config,
            "environment": config.get("environment", "production"),
            "estimated_impact": self._estimate_impact(config)
        }
        
        assessment = await self.hillm.review(assessment_request)
        
        self.log_event("hillm_assessment_completed", assessment)
        return assessment
    
    async def _prepare_infrastructure(self, config: Dict) -> None:
        """Prepare infrastructure in parallel"""
        self.log_event("infrastructure_preparation_started", {})
        
        # Create preparation tasks
        tasks = []
        
        if config.get("frontend"):
            tasks.append(self._create_task(
                "prepare_frontend",
                "cloudflare",
                "Prepare frontend deployment",
                []
            ))
            
        if config.get("backend"):
            tasks.append(self._create_task(
                "prepare_backend",
                "cloudflare",
                "Prepare backend Worker",
                []
            ))
            
        if config.get("database"):
            tasks.append(self._create_task(
                "prepare_database",
                "supabase",
                "Prepare database schema",
                []
            ))
            
        if config.get("auth"):
            tasks.append(self._create_task(
                "prepare_auth",
                "supabase",
                "Configure authentication",
                ["prepare_database"]
            ))
        
        # Execute tasks
        await self._execute_tasks(tasks)
        
        self.log_event("infrastructure_preparation_completed", {})
    
    async def _deploy_services(self, config: Dict) -> Dict:
        """Deploy all services"""
        self.log_event("service_deployment_started", {})
        
        results = {}
        
        # Deploy database first
        if config.get("database"):
            schema_config = config["database"]
            db_result = await self.supabase.create_schema(schema_config)
            results["database"] = db_result
            
            # Let agents communicate
            await self.collaboration_hub.broadcast({
                "type": "database_deployed",
                "url": db_result.get("connection_string"),
                "schema": schema_config
            })
        
        # Deploy backend
        if config.get("backend"):
            # CloudflareAgent asks SupabaseAgent for connection details
            connection_info = await self.cloudflare.communicate(
                self.supabase,
                {"type": "query", "data": "connection_details"}
            )
            
            backend_config = {
                **config["backend"],
                "environment": {
                    "SUPABASE_URL": connection_info["data"]["url"],
                    "SUPABASE_ANON_KEY": connection_info["data"]["anon_key"]
                }
            }
            
            backend_result = await self.cloudflare.deploy_worker(backend_config)
            results["backend"] = backend_result
        
        # Deploy frontend
        if config.get("frontend"):
            frontend_config = {
                **config["frontend"],
                "environment": {
                    "REACT_APP_API_URL": results.get("backend", {}).get("worker_url", "")
                }
            }
            
            frontend_result = await self._deploy_frontend(frontend_config)
            results["frontend"] = frontend_result
        
        self.log_event("service_deployment_completed", results)
        return results
    
    async def _deploy_frontend(self, config: Dict) -> Dict:
        """Deploy frontend (simulation)"""
        await asyncio.sleep(2)
        return {
            "status": "success",
            "url": f"https://{config.get('name', 'app')}.pages.dev",
            "deployment_id": "pages_123456"
        }
    
    async def _run_integration_tests(self, deployment_results: Dict) -> Dict:
        """Run integration tests"""
        self.log_event("integration_tests_started", {})
        
        tests = [
            {
                "name": "Frontend loads",
                "type": "http_check",
                "url": deployment_results.get("frontend", {}).get("url"),
                "expected_status": 200
            },
            {
                "name": "API responds",
                "type": "http_check", 
                "url": f"{deployment_results.get('backend', {}).get('worker_url')}/health",
                "expected_status": 200
            },
            {
                "name": "Database connection",
                "type": "database_check",
                "query": "SELECT 1"
            }
        ]
        
        test_results = []
        for test in tests:
            result = await self._run_test(test)
            test_results.append(result)
            
            # If test fails, ask HILLM what to do
            if not result["passed"]:
                decision = await self.hillm.review({
                    "type": "test_failure",
                    "test": test,
                    "result": result,
                    "context": deployment_results
                })
                
                if not decision["approved"]:
                    raise Exception(f"Test failed and HILLM rejected continuation: {test['name']}")
        
        self.log_event("integration_tests_completed", test_results)
        return {"tests": test_results, "passed": all(t["passed"] for t in test_results)}
    
    async def _run_test(self, test: Dict) -> Dict:
        """Run a single test (simulation)"""
        await asyncio.sleep(0.5)
        
        # Simulate test results
        passed = True  # In real implementation, would actually run the test
        
        return {
            "name": test["name"],
            "type": test["type"],
            "passed": passed,
            "duration_ms": 150,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _get_final_approval(self, deployment_results: Dict, test_results: Dict) -> Dict:
        """Get final HILLM approval"""
        self.log_event("final_approval_requested", {})
        
        approval_request = {
            "type": "final_deployment_approval",
            "deployment_results": deployment_results,
            "test_results": test_results,
            "metrics": self._calculate_metrics(deployment_results, test_results)
        }
        
        approval = await self.hillm.review(approval_request)
        
        self.log_event("final_approval_received", approval)
        return approval
    
    async def _rollback_deployment(self, deployment_id: str) -> None:
        """Rollback a failed deployment"""
        self.log_event("rollback_started", {"deployment_id": deployment_id})
        
        # In real implementation, would rollback each service
        await asyncio.sleep(2)
        
        self.log_event("rollback_completed", {"deployment_id": deployment_id})
    
    def _create_task(self, task_id: str, agent: str, description: str, dependencies: List[str]) -> DeploymentTask:
        """Create a deployment task"""
        task = DeploymentTask(
            id=task_id,
            agent=agent,
            description=description,
            status=TaskStatus.PENDING,
            dependencies=dependencies
        )
        self.tasks[task_id] = task
        return task
    
    async def _execute_tasks(self, tasks: List[DeploymentTask]) -> None:
        """Execute tasks with dependency management"""
        # Simple implementation - in production would be more sophisticated
        for task in tasks:
            # Check dependencies
            deps_complete = all(
                self.tasks.get(dep_id, {}).status == TaskStatus.COMPLETED
                for dep_id in task.dependencies
            )
            
            if deps_complete:
                task.status = TaskStatus.IN_PROGRESS
                task.started_at = datetime.now()
                
                # Execute task (simulation)
                await asyncio.sleep(1)
                
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.now()
    
    def _estimate_impact(self, config: Dict) -> Dict:
        """Estimate deployment impact"""
        return {
            "users_affected": config.get("user_count", 0),
            "downtime_minutes": 0 if config.get("zero_downtime", True) else 5,
            "cost_increase": config.get("estimated_cost_delta", 0),
            "complexity": "MEDIUM"  # Would calculate based on config
        }
    
    def _calculate_metrics(self, deployment_results: Dict, test_results: Dict) -> Dict:
        """Calculate deployment metrics"""
        return {
            "services_deployed": len(deployment_results),
            "tests_passed": sum(1 for t in test_results["tests"] if t["passed"]),
            "total_tests": len(test_results["tests"]),
            "deployment_time": self._calculate_duration(),
            "health_score": 0.95  # Would calculate based on results
        }
    
    def _calculate_duration(self) -> float:
        """Calculate deployment duration"""
        if self.deployment_log:
            start = self.deployment_log[0]["timestamp"]
            end = self.deployment_log[-1]["timestamp"]
            return (end - start).total_seconds()
        return 0.0
    
    def log_event(self, event_type: str, data: Dict) -> None:
        """Log deployment event"""
        event = {
            "timestamp": datetime.now(),
            "type": event_type,
            "data": data
        }
        self.deployment_log.append(event)
        
        # Also print for visibility
        print(f"[{event['timestamp'].strftime('%H:%M:%S')}] {event_type}: {json.dumps(data, indent=2)}")
    
    async def get_deployment_status(self, deployment_id: str) -> Dict:
        """Get current deployment status"""
        return {
            "deployment_id": deployment_id,
            "tasks": {
                task_id: {
                    "status": task.status.value,
                    "agent": task.agent,
                    "description": task.description,
                    "started_at": task.started_at.isoformat() if task.started_at else None,
                    "completed_at": task.completed_at.isoformat() if task.completed_at else None
                }
                for task_id, task in self.tasks.items()
            },
            "agent_status": {
                "cloudflare": self.cloudflare.status.value,
                "supabase": self.supabase.status.value,
                "hillm": self.hillm.status.value
            }
        }