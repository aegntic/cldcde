#!/usr/bin/env python3
"""
Spline Professional - Agent Prompt Templates
Defines specialized prompts for different 3D asset generation scenarios
"""

from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass

class PromptType(Enum):
    SYSTEM_CORE = "system_core"
    IMAGE_ANALYSIS = "image_analysis"
    MESH_GENERATION = "mesh_generation"
    MATERIAL_APPLICATION = "material_application"
    QUALITY_VALIDATION = "quality_validation"
    ERROR_RECOVERY = "error_recovery"

@dataclass
class PromptTemplate:
    name: str
    type: PromptType
    template: str
    variables: List[str]
    context_requirements: List[str]

class SplineProfessionalPrompts:
    """Prompt templates for Spline Professional 3D asset generation"""

    def __init__(self):
        self.templates = self._initialize_templates()

    def _initialize_templates(self) -> Dict[PromptType, List[PromptTemplate]]:
        """Initialize all prompt templates"""
        return {
            PromptType.SYSTEM_CORE: [
                PromptTemplate(
                    name="agent_identity",
                    type=PromptType.SYSTEM_CORE,
                    template=self._get_agent_identity_prompt(),
                    variables=[],
                    context_requirements=[]
                ),
                PromptTemplate(
                    name="workflow_orchestrator",
                    type=PromptType.SYSTEM_CORE,
                    template=self._get_workflow_orchestrator_prompt(),
                    variables=["workflow_type", "quality_level", "input_format"],
                    context_requirements=["workflow_config"]
                )
            ],

            PromptType.IMAGE_ANALYSIS: [
                PromptTemplate(
                    name="shape_detection",
                    type=PromptType.IMAGE_ANALYSIS,
                    template=self._get_shape_detection_prompt(),
                    variables=["image_path", "accuracy_target"],
                    context_requirements=["image_metadata"]
                ),
                PromptTemplate(
                    name="material_analysis",
                    type=PromptType.IMAGE_ANALYSIS,
                    template=self._get_material_analysis_prompt(),
                    variables=["image_path", "material_complexity"],
                    context_requirements=["color_palette", "lighting_info"]
                ),
                PromptTemplate(
                    name="depth_estimation",
                    type=PromptType.IMAGE_ANALYSIS,
                    template=self._get_depth_estimation_prompt(),
                    variables=["image_path", "depth_sensitivity"],
                    context_requirements=["perspective_analysis"]
                )
            ],

            PromptType.MESH_GENERATION: [
                PromptTemplate(
                    name="basic_meshing",
                    type=PromptType.MESH_GENERATION,
                    template=self._get_basic_meshing_prompt(),
                    variables=["shapes_detected", "target_vertices"],
                    context_requirements=["shape_data", "dimensions"]
                ),
                PromptTemplate(
                    name="mesh_optimization",
                    type=PromptType.MESH_GENERATION,
                    template=self._get_mesh_optimization_prompt(),
                    variables=["base_mesh", "optimization_target"],
                    context_requirements=["performance_requirements", "platform"]
                ),
                PromptTemplate(
                    name="topology_creation",
                    type=PromptType.MESH_GENERATION,
                    template=self._get_topology_creation_prompt(),
                    variables=["geometry_type", "animation_ready"],
                    context_requirements=["deformation_requirements"]
                )
            ],

            PromptType.MATERIAL_APPLICATION: [
                PromptTemplate(
                    name="pbr_materials",
                    type=PromptType.MATERIAL_APPLICATION,
                    template=self._get_pbr_materials_prompt(),
                    variables=["surface_analysis", "material_library"],
                    context_requirements=["lighting_scenario", "realism_level"]
                ),
                PromptTemplate(
                    name="texture_generation",
                    type=PromptType.MATERIAL_APPLICATION,
                    template=self._get_texture_generation_prompt(),
                    variables=["surface_properties", "resolution_target"],
                    context_requirements=["uv_coordinates", "texture_libraries"]
                )
            ],

            PromptType.QUALITY_VALIDATION: [
                PromptTemplate(
                    name="accuracy_check",
                    type=PromptType.QUALITY_VALIDATION,
                    template=self._get_accuracy_check_prompt(),
                    variables=["original_image", "generated_3d", "accuracy_threshold"],
                    context_requirements=["validation_metrics"]
                ),
                PromptTemplate(
                    name="performance_validation",
                    type=PromptType.QUALITY_VALIDATION,
                    template=self._get_performance_validation_prompt(),
                    variables=["model_data", "target_platform"],
                    context_requirements=["performance_benchmarks"]
                )
            ],

            PromptType.ERROR_RECOVERY: [
                PromptTemplate(
                    name="mesh_correction",
                    type=PromptType.ERROR_RECOVERY,
                    template=self._get_mesh_correction_prompt(),
                    variables=["error_type", "mesh_data"],
                    context_requirements=["error_log", "correction_strategies"]
                ),
                PromptTemplate(
                    name="material_fix",
                    type=PromptType.ERROR_RECOVERY,
                    template=self._get_material_fix_prompt(),
                    variables=["material_error", "texture_data"],
                    context_requirements=["material_analysis", "fix_options"]
                )
            ]
        }

    def _get_agent_identity_prompt(self) -> str:
        return """You are Spline Professional, an expert AI agent specialized in converting 2D images and designs into high-quality 3D assets.

## Your Expertise:
- Advanced computer vision for shape and object detection
- Professional 3D modeling and mesh generation
- Material science and PBR texture creation
- Spline integration and web 3D optimization
- Performance optimization for real-time applications

## Your Process:
1. **Analyze** - Deep analysis of input images for shapes, materials, and spatial relationships
2. **Generate** - Create optimized 3D meshes with proper topology
3. **Enhance** - Apply realistic materials and professional lighting
4. **Validate** - Ensure accuracy, performance, and quality standards
5. **Optimize** - Refine for target platforms and use cases

## Quality Standards:
- 95%+ dimensional accuracy for professional models
- Sub-3-second load times for web applications
- Mobile-friendly file sizes (<10MB for complex scenes)
- Industry-standard 3D formats and export options

## Your Specialization:
- Product visualization and e-commerce
- UI/UX 3D component generation
- Brand asset 3D conversion
- Architectural visualization
- AR/VR compatible asset creation

You combine artistic understanding with technical precision to create professional-grade 3D assets that meet real-world production requirements."""

    def _get_workflow_orchestrator_prompt(self) -> str:
        return """Execute a {workflow_type} workflow with {quality_level} quality for {input_format} input.

## Workflow Configuration:
- **Type**: {workflow_type}
- **Quality**: {quality_level}
- **Input Format**: {input_format}
- **Optimization Level**: {optimization_level}

## Execution Steps:
1. Validate input and workflow configuration
2. Execute each workflow step in sequence
3. Perform validation at designated checkpoints
4. Handle errors with automatic recovery
5. Generate comprehensive output report

## Error Handling:
- Automatic retry for failed steps (max 3 attempts)
- Fallback strategies for complex cases
- Quality degradation if necessary
- Detailed error logging and reporting

## Success Criteria:
- All validation checkpoints passed
- Output meets quality specifications
- File sizes within target limits
- Export formats generated successfully

Focus on delivering high-quality results while maintaining the specified workflow constraints."""

    def _get_shape_detection_prompt(self) -> str:
        return """Analyze the provided image to detect and identify geometric shapes and structures for 3D conversion.

## Analysis Requirements:
- **Primary Shapes**: Identify main geometric forms (circles, rectangles, polygons, curves)
- **Structural Elements**: Detect edges, corners, and key features
- **Spatial Relationships**: Understand depth, layering, and positioning
- **Style Elements**: Identify stylistic features, gradients, and visual patterns

## Detection Parameters:
- **Accuracy Target**: {accuracy_target}
- **Shape Types**: Geometric, organic, typographic, iconographic
- **Complexity**: Simple to complex multi-element compositions
- **Scale**: Various sizes from small icons to large illustrations

## Output Format:
Provide a structured analysis including:
1. Primary shapes detected with coordinates
2. Hierarchical relationships between elements
3. Estimated depth and spatial positioning
4. Material and texture properties
5. Confidence levels for each detection

Focus on creating a comprehensive understanding that will enable accurate 3D mesh generation."""

    def _get_material_analysis_prompt(self) -> str:
        return """Analyze the material properties of the input image to guide 3D material application.

## Material Analysis:
- **Surface Properties**: Identify textures, finishes, and material types
- **Color Analysis**: Extract color palettes, gradients, and color relationships
- **Lighting Interaction**: Understand how light interacts with surfaces
- **Material Complexity**: {material_complexity}

## Detection Categories:
1. **Metals**: Chrome, brushed, matte, anodized
2. **Plastics**: Glossy, matte, textured, transparent
3. **Organic**: Wood, fabric, leather, natural materials
4. **Special**: Glass, liquids, emissive, holographic

## Output Requirements:
- Primary material classification
- Surface roughness and reflectivity
- Color variations and patterns
- Suggested PBR material parameters
- Texture generation requirements

Focus on creating realistic material representations that enhance the 3D model's visual quality."""

    def _get_basic_meshing_prompt(self) -> str:
        return """Generate a 3D mesh from the detected shapes and analysis data.

## Mesh Requirements:
- **Target Vertices**: {target_vertices}
- **Shapes Detected**: {shapes_detected}
- **Topology**: Quad-based where possible, clean edge flow
- **Optimization**: Balance between detail and performance

## Generation Process:
1. Create base geometry from shape detection data
2. Add appropriate depth and volume based on visual cues
3. Maintain proper edge flow for subdivision and editing
4. Optimize vertex count while preserving visual quality

## Quality Standards:
- Clean, non-intersecting geometry
- Proper normal direction
- Efficient UV coordinate generation
- Subdivision-ready topology

Focus on creating a solid foundation that supports accurate material application and optimization."""

    def _get_pbr_materials_prompt(self) -> str:
        return """Create physically-based rendering (PBR) materials based on surface analysis.

## Material Properties:
- **Surface Analysis**: {surface_analysis}
- **Material Library**: {material_library}
- **Realism Level**: High-fidelity with accurate light interaction

## PBR Parameters:
1. **Albedo**: Base color and diffuse properties
2. **Roughness**: Surface micro-geometry and reflection characteristics
3. **Metallic**: Conductive properties and metal-like behavior
4. **Normal Maps**: Surface detail and texture information
5. **Ambient Occlusion**: Contact shadows and detail enhancement

## Material Categories:
- Metals (chrome, aluminum, copper, etc.)
- Plastics (glossy, matte, textured)
- Organic materials (wood, fabric, leather)
- Special materials (glass, liquids, emissive)

Generate realistic materials that accurately represent the original visual qualities while being optimized for real-time rendering."""

    def _get_accuracy_check_prompt(self) -> str:
        return """Validate the accuracy and quality of the generated 3D model against the original image.

## Validation Parameters:
- **Original Image**: {original_image}
- **Generated 3D**: {generated_3d}
- **Accuracy Threshold**: {accuracy_threshold}

## Quality Metrics:
1. **Dimensional Accuracy**: Shape proportion and scale verification
2. **Material Accuracy**: Color and texture fidelity
3. **Structural Integrity**: Mesh quality and topology validation
4. **Performance Metrics**: File size and optimization validation

## Validation Process:
1. Overlay comparison between 2D and 3D representations
2. Measure dimensional deviations
3. Check material application accuracy
4. Validate mesh topology and edge flow
5. Test export format compatibility

## Reporting:
Provide detailed validation report including:
- Overall accuracy score
- Specific areas requiring improvement
- Performance characteristics
- Recommendations for optimization

Ensure the model meets professional quality standards before final export."""

    def get_template(self, prompt_type: PromptType, name: str) -> Optional[PromptTemplate]:
        """Get specific template by type and name"""
        templates = self.templates.get(prompt_type, [])
        for template in templates:
            if template.name == name:
                return template
        return None

    def format_prompt(self, template: PromptTemplate, variables: Dict[str, str]) -> str:
        """Format prompt template with provided variables"""
        formatted_prompt = template.template

        for var_name, var_value in variables.items():
            placeholder = "{" + var_name + "}"
            formatted_prompt = formatted_prompt.replace(placeholder, var_value)

        return formatted_prompt

    def get_system_prompt(self, workflow_config: Dict) -> str:
        """Get complete system prompt for agent initialization"""
        identity_template = self.get_template(PromptType.SYSTEM_CORE, "agent_identity")
        workflow_template = self.get_template(PromptType.SYSTEM_CORE, "workflow_orchestrator")

        system_prompt = ""

        if identity_template:
            system_prompt += identity_template.template + "\n\n"

        if workflow_template:
            formatted_workflow = self.format_prompt(workflow_template, workflow_config)
            system_prompt += formatted_workflow

        return system_prompt

# Example usage
if __name__ == "__main__":
    prompts = SplineProfessionalPrompts()

    # Get system prompt
    workflow_config = {
        "workflow_type": "professional_modeling",
        "quality_level": "production",
        "input_format": "PNG",
        "optimization_level": "0.9"
    }

    system_prompt = prompts.get_system_prompt(workflow_config)
    print("=== SYSTEM PROMPT ===")
    print(system_prompt)