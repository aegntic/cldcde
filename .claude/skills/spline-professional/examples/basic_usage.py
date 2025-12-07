#!/usr/bin/env python3
"""
Spline Professional - Basic Usage Example
Demonstrates core functionality and workflows
"""

import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from workflows import WorkflowConfig, WorkflowType, QualityLevel, SplineProfessionalWorkflows
    from prompts import SplineProfessionalPrompts
    from validation import SplineProfessionalValidator
    from huggingface_integration import EnhancedSplineWorkflow
except ImportError as e:
    print(f"Import error: {e}")
    print("This example requires the skill modules to be available")
    sys.exit(1)

def example_basic_workflow():
    """Example of basic workflow configuration and execution"""
    print("=== Basic Workflow Example ===")

    # Initialize workflow system
    workflows = SplineProfessionalWorkflows()

    # Create workflow configuration
    config = WorkflowConfig(
        workflow_type=WorkflowType.QUICK_CONVERSION,
        quality_level=QualityLevel.PROTOTYPE,
        input_format="PNG",
        output_formats=["GLB"],
        optimization_level=0.8
    )

    # Generate workflow plan
    plan = workflows.create_workflow_plan(config)

    print(f"Workflow Type: {plan['workflow_type']}")
    print(f"Quality Level: {plan['quality_level']}")
    print(f"Total Steps: {plan['total_steps']}")
    print(f"Estimated Time: {plan['estimated_time']}")

    print("\nWorkflow Steps:")
    for step in plan['steps']:
        validation_marker = " ✓" if step['validation_point'] else ""
        print(f"  {step['step_number']}. {step['name']}{validation_marker}")
        print(f"     {step['description']}")
        print(f"     Time: {step['estimated_time']}")
        print()

def example_prompt_system():
    """Example of prompt template system"""
    print("=== Prompt System Example ===")

    prompts = SplineProfessionalPrompts()

    # Get system prompt
    workflow_config = {
        "workflow_type": "professional_modeling",
        "quality_level": "production",
        "input_format": "PNG",
        "optimization_level": "0.9"
    }

    system_prompt = prompts.get_system_prompt(workflow_config)

    print("System Prompt Generated:")
    print("=" * 50)
    print(system_prompt[:500] + "..." if len(system_prompt) > 500 else system_prompt)
    print()

def example_validation_system():
    """Example of validation system"""
    print("=== Validation System Example ===")

    validator = SplineProfessionalValidator()

    # Sample model data for validation
    sample_model_data = {
        "mesh_data": {
            "non_manifold_edges": 0,
            "isolated_vertices": 0,
            "is_watertight": True,
            "has_valid_normals": True,
            "vertex_count": 15000
        },
        "model_stats": {
            "vertex_count": 15000,
            "file_size_mb": 7.2,
            "draw_calls": 35
        },
        "material_data": {
            "materials": [
                {
                    "name": "main_material",
                    "properties": {
                        "albedo": [1.0, 1.0, 1.0],
                        "roughness": 0.6,
                        "metallic": 0.1
                    }
                }
            ]
        },
        "export_data": {
            "format": "GLB",
            "is_valid": True,
            "has_gltf_structure": True
        },
        "original_image": {
            "dimensions": {"width": 800, "height": 600}
        },
        "generated_3d": {
            "dimensions": {"width": 810, "height": 590}
        }
    }

    # Run validation
    report = validator.run_validation(sample_model_data, {})

    print(f"Overall Status: {report.overall_status.upper()}")
    print(f"Accuracy Score: {report.accuracy_score:.2%}")
    print(f"Performance Score: {report.performance_score:.2%}")
    print(f"Quality Score: {report.quality_score:.2%}")
    print(f"Errors Found: {len(report.errors)}")

    if report.recommendations:
        print("\nRecommendations:")
        for rec in report.recommendations:
            print(f"  • {rec}")
    print()

def example_huggingface_integration():
    """Example of Hugging Face model integration"""
    print("=== Hugging Face Integration Example ===")

    # Initialize enhanced workflow
    workflow = EnhancedSplineWorkflow()

    # Show available models
    print("Available Hugging Face Models:")
    for model_type, models in workflow.hf_integration.models.items():
        print(f"\n{model_type.value.replace('_', ' ').title()}:")
        for model in models:
            print(f"  • {model.name} (Quality: {model.quality_score:.2f})")
            print(f"    {model.description}")

    # Show comprehensive analysis workflow
    print("\nComprehensive Analysis Workflow:")
    analysis_steps = [
        "1. Load image from file path",
        "2. Generate depth map using Intel DPT-Large",
        "3. Segment objects using Facebook Mask2Former",
        "4. Generate surface normal maps",
        "5. Classify materials using OpenAI CLIP",
        "6. Detect edges for shape extraction",
        "7. Detect objects for scene understanding",
        "8. Generate mesh generation strategy",
        "9. Assess quality metrics"
    ]

    for step in analysis_steps:
        print(f"  {step}")
    print()

def example_quality_comparison():
    """Example comparing different quality levels"""
    print("=== Quality Level Comparison ===")

    workflows = SplineProfessionalWorkflows()

    quality_levels = [QualityLevel.PROTOTYPE, QualityLevel.PRODUCTION, QualityLevel.ULTRA]

    print("Quality Level Comparison:")
    print("-" * 60)
    print(f"{'Level':<12} {'Time':<10} {'Vertices':<12} {'Texture':<10} {'Accuracy'}")
    print("-" * 60)

    for quality in quality_levels:
        settings = workflows.get_quality_settings(quality)

        config = WorkflowConfig(
            workflow_type=WorkflowType.PROFESSIONAL_MODELING,
            quality_level=quality,
            input_format="PNG",
            output_formats=["GLB"]
        )

        estimated_time = workflows.estimate_total_time(WorkflowType.PROFESSIONAL_MODELING)

        print(f"{quality.value:<12} {estimated_time:<10} {settings['target_vertices']:<12} "
              f"{settings['texture_resolution']:<10} {settings['accuracy_target']:.0%}")

    print()

def main():
    """Run all examples"""
    print("Spline Professional - Usage Examples")
    print("=" * 50)
    print()

    try:
        example_basic_workflow()
        example_prompt_system()
        example_validation_system()
        example_huggingface_integration()
        example_quality_comparison()

        print("All examples completed successfully!")

    except Exception as e:
        print(f"Error running examples: {str(e)}")
        print("\nNote: Some examples may require actual API keys and model access")
        print("to run completely. The structure and logic are demonstrated.")

if __name__ == "__main__":
    main()