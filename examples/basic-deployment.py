#!/usr/bin/env python3
"""
Basic deployment example using AEGNT
"""

import asyncio
from aegnt import DeploymentOrchestrator

async def deploy_simple_app():
    """Deploy a simple web application"""
    
    # Initialize orchestrator
    orchestrator = DeploymentOrchestrator()
    
    # Define deployment configuration
    config = {
        "name": "my-awesome-app",
        "environment": "production",
        "frontend": {
            "type": "react",
            "name": "my-awesome-app-frontend",
            "build_command": "npm run build",
            "output_directory": "build"
        },
        "backend": {
            "type": "worker",
            "name": "my-awesome-app-api",
            "script": """
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (url.pathname === '/api/hello') {
      return new Response(JSON.stringify({ message: 'Hello from AEGNT!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
""",
            "size": 1024  # bytes
        },
        "database": {
            "tables": [
                {
                    "name": "users",
                    "columns": [
                        {"name": "id", "type": "UUID", "primary_key": True},
                        {"name": "email", "type": "TEXT", "not_null": True},
                        {"name": "name", "type": "TEXT"},
                        {"name": "created_at", "type": "TIMESTAMPTZ", "default": "NOW()"}
                    ]
                },
                {
                    "name": "posts",
                    "columns": [
                        {"name": "id", "type": "UUID", "primary_key": True},
                        {"name": "user_id", "type": "UUID", "not_null": True, "references": "users(id)"},
                        {"name": "title", "type": "TEXT", "not_null": True},
                        {"name": "content", "type": "TEXT"},
                        {"name": "published", "type": "BOOLEAN", "default": False},
                        {"name": "created_at", "type": "TIMESTAMPTZ", "default": "NOW()"}
                    ]
                }
            ]
        },
        "auth": {
            "providers": ["email", "google", "github"],
            "require_email_verification": True
        }
    }
    
    # Deploy the project
    print("🚀 Starting deployment with AEGNT...")
    result = await orchestrator.deploy_project(config)
    
    if result["status"] == "success":
        print("\n✅ Deployment successful!")
        print(f"Frontend: {result['services']['frontend']['url']}")
        print(f"Backend: {result['services']['backend']['worker_url']}")
        print(f"Database: Connected to Supabase")
    else:
        print(f"\n❌ Deployment failed: {result['error']}")
    
    return result

async def check_deployment_status(orchestrator, deployment_id):
    """Check the status of a deployment"""
    
    status = await orchestrator.get_deployment_status(deployment_id)
    
    print("\n📊 Deployment Status:")
    print(f"ID: {deployment_id}")
    
    print("\n📋 Tasks:")
    for task_id, task_info in status["tasks"].items():
        print(f"  {task_id}: {task_info['status']} - {task_info['description']}")
    
    print("\n🤖 Agent Status:")
    for agent, agent_status in status["agent_status"].items():
        print(f"  {agent}: {agent_status}")

if __name__ == "__main__":
    # Run the deployment
    asyncio.run(deploy_simple_app())