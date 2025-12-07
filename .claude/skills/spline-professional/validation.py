#!/usr/bin/env python3
"""
Spline Professional - Validation and Error Handling System
Comprehensive quality assurance and error recovery for 3D asset generation
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import json
import logging
from datetime import datetime

class ValidationLevel(Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class ErrorType(Enum):
    MESH_CORRUPTION = "mesh_corruption"
    MATERIAL_ERROR = "material_error"
    EXPORT_FAILURE = "export_failure"
    PERFORMANCE_ISSUE = "performance_issue"
    ACCURACY_DEVIATION = "accuracy_deviation"
    FORMAT_INCOMPATIBILITY = "format_incompatibility"

@dataclass
class ValidationRule:
    name: str
    description: str
    validation_level: ValidationLevel
    check_function: str
    parameters: Dict[str, Any]
    threshold: Optional[float] = None

@dataclass
class ValidationError:
    error_type: ErrorType
    severity: ValidationLevel
    message: str
    component: str
    timestamp: datetime
    recovery_strategy: Optional[str] = None
    retry_count: int = 0

@dataclass
class ValidationReport:
    overall_status: str  # "passed", "warning", "failed"
    accuracy_score: float
    performance_score: float
    quality_score: float
    errors: List[ValidationError]
    recommendations: List[str]
    validation_timestamp: datetime

class SplineProfessionalValidator:
    """Comprehensive validation system for 3D asset generation"""

    def __init__(self):
        self.validation_rules = self._initialize_validation_rules()
        self.error_handlers = self._initialize_error_handlers()
        self.logger = self._setup_logging()

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for validation system"""
        logger = logging.getLogger("spline_professional_validator")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _initialize_validation_rules(self) -> Dict[str, ValidationRule]:
        """Initialize all validation rules"""
        return {
            "mesh_integrity": ValidationRule(
                name="mesh_integrity",
                description="Check for mesh corruption and geometry errors",
                validation_level=ValidationLevel.CRITICAL,
                check_function="validate_mesh_integrity",
                parameters={"max_non_manifold_edges": 0, "max_isolated_vertices": 0},
                threshold=0.95
            ),

            "dimensional_accuracy": ValidationRule(
                name="dimensional_accuracy",
                description="Verify 3D model dimensions match original 2D image",
                validation_level=ValidationLevel.CRITICAL,
                check_function="validate_dimensional_accuracy",
                parameters={"tolerance_percent": 5.0},
                threshold=0.90
            ),

            "material_application": ValidationRule(
                name="material_application",
                description="Check materials are properly applied and configured",
                validation_level=ValidationLevel.WARNING,
                check_function="validate_materials",
                parameters={"required_properties": ["albedo", "roughness", "normal"]},
                threshold=0.85
            ),

            "performance_optimization": ValidationRule(
                name="performance_optimization",
                description="Validate performance characteristics for target platform",
                validation_level=ValidationLevel.WARNING,
                check_function="validate_performance",
                parameters={"max_vertices": 50000, "max_file_size_mb": 10},
                threshold=0.80
            ),

            "uv_coordinates": ValidationRule(
                name="uv_coordinates",
                description="Check UV coordinates are properly laid out",
                validation_level=ValidationLevel.WARNING,
                check_function="validate_uv_coordinates",
                parameters={"max_overlap_percent": 10.0, "min_uv_coverage": 0.8},
                threshold=0.90
            ),

            "export_format": ValidationRule(
                name="export_format",
                description="Validate export format compatibility and integrity",
                validation_level=ValidationLevel.CRITICAL,
                check_function="validate_export_format",
                parameters={"supported_formats": ["GLB", "GLTF", "OBJ", "USDZ"]},
                threshold=0.95
            ),

            "texture_resolution": ValidationRule(
                name="texture_resolution",
                description="Check texture resolutions are appropriate for quality level",
                validation_level=ValidationLevel.WARNING,
                check_function="validate_textures",
                parameters={"max_resolution": 4096, "min_resolution": 512},
                threshold=0.85
            ),

            "animation_readiness": ValidationRule(
                name="animation_readiness",
                description="Validate mesh topology for animation compatibility",
                validation_level=ValidationLevel.INFO,
                check_function="validate_animation_readiness",
                parameters={"min_edge_flow_quality": 0.7, "max_tris_per_face": 4},
                threshold=0.75
            )
        }

    def _initialize_error_handlers(self) -> Dict[ErrorType, str]:
        """Initialize error recovery strategies"""
        return {
            ErrorType.MESH_CORRUPTION: "mesh_reconstruction",
            ErrorType.MATERIAL_ERROR: "material_regeneration",
            ErrorType.EXPORT_FAILURE: "format_conversion_fallback",
            ErrorType.PERFORMANCE_ISSUE: "optimization_enhancement",
            ErrorType.ACCURACY_DEVIATION: "accuracy_improvement",
            ErrorType.FORMAT_INCOMPATIBILITY: "alternative_export"
        }

    def validate_mesh_integrity(self, mesh_data: Dict[str, Any], parameters: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate mesh integrity and geometry"""
        errors = []

        # Check for non-manifold edges
        non_manifold = mesh_data.get("non_manifold_edges", 0)
        if non_manifold > parameters["max_non_manifold_edges"]:
            errors.append(f"Too many non-manifold edges: {non_manifold}")

        # Check for isolated vertices
        isolated_vertices = mesh_data.get("isolated_vertices", 0)
        if isolated_vertices > parameters["max_isolated_vertices"]:
            errors.append(f"Isolated vertices detected: {isolated_vertices}")

        # Check mesh is watertight
        is_watertight = mesh_data.get("is_watertight", True)
        if not is_watertight:
            errors.append("Mesh is not watertight")

        # Check normals
        has_valid_normals = mesh_data.get("has_valid_normals", True)
        if not has_valid_normals:
            errors.append("Invalid or missing normals")

        return len(errors) == 0, errors

    def validate_dimensional_accuracy(self, original_image: Dict, generated_3d: Dict, parameters: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate dimensional accuracy against original image"""
        errors = []

        # Compare primary dimensions
        original_dims = original_image.get("dimensions", {})
        model_dims = generated_3d.get("dimensions", {})
        tolerance = parameters["tolerance_percent"]

        for dim in ["width", "height"]:
            if dim in original_dims and dim in model_dims:
                original_val = original_dims[dim]
                model_val = model_dims[dim]
                deviation = abs(original_val - model_val) / original_val * 100

                if deviation > tolerance:
                    errors.append(f"{dim} deviation: {deviation:.1f}% (max: {tolerance}%)")

        # Check aspect ratio
        original_aspect = original_dims.get("width", 1) / original_dims.get("height", 1)
        model_aspect = model_dims.get("width", 1) / model_dims.get("height", 1)
        aspect_deviation = abs(original_aspect - model_aspect)

        if aspect_deviation > 0.1:  # 10% aspect ratio tolerance
            errors.append(f"Aspect ratio deviation: {aspect_deviation:.2f}")

        return len(errors) == 0, errors

    def validate_materials(self, material_data: Dict[str, Any], parameters: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate material application and properties"""
        errors = []

        required_properties = parameters["required_properties"]
        applied_materials = material_data.get("materials", [])

        for material in applied_materials:
            material_name = material.get("name", "unnamed")
            properties = material.get("properties", {})

            # Check required properties
            for prop in required_properties:
                if prop not in properties:
                    errors.append(f"Material '{material_name}' missing required property: {prop}")

            # Validate property ranges
            if "roughness" in properties:
                roughness = properties["roughness"]
                if not (0.0 <= roughness <= 1.0):
                    errors.append(f"Invalid roughness value in material '{material_name}': {roughness}")

            if "metallic" in properties:
                metallic = properties["metallic"]
                if not (0.0 <= metallic <= 1.0):
                    errors.append(f"Invalid metallic value in material '{material_name}': {metallic}")

        return len(errors) == 0, errors

    def validate_performance(self, model_data: Dict[str, Any], parameters: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate performance characteristics"""
        errors = []

        # Check vertex count
        vertex_count = model_data.get("vertex_count", 0)
        max_vertices = parameters["max_vertices"]
        if vertex_count > max_vertices:
            errors.append(f"Vertex count too high: {vertex_count} (max: {max_vertices})")

        # Check file size
        file_size_mb = model_data.get("file_size_mb", 0)
        max_file_size = parameters["max_file_size_mb"]
        if file_size_mb > max_file_size:
            errors.append(f"File size too large: {file_size_mb}MB (max: {max_file_size}MB)")

        # Check draw calls
        draw_calls = model_data.get("draw_calls", 0)
        if draw_calls > 100:  # Reasonable limit for web performance
            errors.append(f"Too many draw calls: {draw_calls}")

        return len(errors) == 0, errors

    def validate_export_format(self, export_data: Dict[str, Any], parameters: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate export format and integrity"""
        errors = []

        export_format = export_data.get("format", "")
        supported_formats = parameters["supported_formats"]

        if export_format not in supported_formats:
            errors.append(f"Unsupported export format: {export_format}")

        # Check file integrity
        is_valid = export_data.get("is_valid", False)
        if not is_valid:
            errors.append("Exported file is corrupted or invalid")

        # Check required format-specific properties
        if export_format in ["GLB", "GLTF"]:
            if not export_data.get("has_gltf_structure", False):
                errors.append("Missing GLTF structure")

        return len(errors) == 0, errors

    def run_validation(self, model_data: Dict[str, Any], workflow_config: Dict[str, Any]) -> ValidationReport:
        """Run comprehensive validation on generated 3D model"""
        errors = []
        scores = {"accuracy": 0.0, "performance": 0.0, "quality": 0.0}
        passed_rules = 0
        total_rules = 0

        # Run all validation rules
        for rule_name, rule in self.validation_rules.items():
            total_rules += 1
            rule_passed = True
            rule_errors = []

            try:
                # Get validation function
                validation_func = getattr(self, rule.check_function, None)
                if not validation_func:
                    self.logger.warning(f"Validation function not found: {rule.check_function}")
                    continue

                # Prepare validation data
                if rule_name == "dimensional_accuracy":
                    is_valid, rule_errors = validation_func(
                        model_data.get("original_image", {}),
                        model_data.get("generated_3d", {}),
                        rule.parameters
                    )
                elif rule_name == "mesh_integrity":
                    is_valid, rule_errors = validation_func(
                        model_data.get("mesh_data", {}),
                        rule.parameters
                    )
                elif rule_name == "material_application":
                    is_valid, rule_errors = validation_func(
                        model_data.get("material_data", {}),
                        rule.parameters
                    )
                elif rule_name == "performance_optimization":
                    is_valid, rule_errors = validation_func(
                        model_data.get("model_stats", {}),
                        rule.parameters
                    )
                elif rule_name == "export_format":
                    is_valid, rule_errors = validation_func(
                        model_data.get("export_data", {}),
                        rule.parameters
                    )
                else:
                    # Generic validation call
                    is_valid, rule_errors = validation_func(model_data, rule.parameters)

                if is_valid:
                    passed_rules += 1
                else:
                    rule_passed = False

                # Create validation errors
                for error_msg in rule_errors:
                    error = ValidationError(
                        error_type=self._get_error_type_from_rule(rule_name),
                        severity=rule.validation_level,
                        message=error_msg,
                        component=rule_name,
                        timestamp=datetime.now()
                    )
                    errors.append(error)

            except Exception as e:
                self.logger.error(f"Validation rule '{rule_name}' failed: {str(e)}")
                rule_passed = False
                errors.append(ValidationError(
                    error_type=ErrorType.MESH_CORRUPTION,
                    severity=ValidationLevel.CRITICAL,
                    message=f"Validation error: {str(e)}",
                    component=rule_name,
                    timestamp=datetime.now()
                ))

            # Update scores based on rule importance
            if rule_passed:
                if rule_name in ["dimensional_accuracy", "mesh_integrity"]:
                    scores["accuracy"] += rule.threshold or 0.9
                elif rule_name in ["performance_optimization", "export_format"]:
                    scores["performance"] += rule.threshold or 0.8
                else:
                    scores["quality"] += rule.threshold or 0.85

        # Calculate final scores
        if total_rules > 0:
            for score_type in scores:
                scores[score_type] = scores[score_type] / total_rules

        # Determine overall status
        critical_errors = [e for e in errors if e.severity == ValidationLevel.CRITICAL]
        if critical_errors:
            overall_status = "failed"
        elif errors:
            overall_status = "warning"
        else:
            overall_status = "passed"

        # Generate recommendations
        recommendations = self._generate_recommendations(errors, scores)

        return ValidationReport(
            overall_status=overall_status,
            accuracy_score=scores["accuracy"],
            performance_score=scores["performance"],
            quality_score=scores["quality"],
            errors=errors,
            recommendations=recommendations,
            validation_timestamp=datetime.now()
        )

    def _get_error_type_from_rule(self, rule_name: str) -> ErrorType:
        """Map validation rule to error type"""
        mapping = {
            "mesh_integrity": ErrorType.MESH_CORRUPTION,
            "dimensional_accuracy": ErrorType.ACCURACY_DEVIATION,
            "material_application": ErrorType.MATERIAL_ERROR,
            "export_format": ErrorType.EXPORT_FAILURE,
            "performance_optimization": ErrorType.PERFORMANCE_ISSUE
        }
        return mapping.get(rule_name, ErrorType.MESH_CORRUPTION)

    def _generate_recommendations(self, errors: List[ValidationError], scores: Dict[str, float]) -> List[str]:
        """Generate improvement recommendations based on validation results"""
        recommendations = []

        if scores["accuracy"] < 0.9:
            recommendations.append("Improve dimensional accuracy through refined shape detection")
            recommendations.append("Consider manual adjustment of critical dimensions")

        if scores["performance"] < 0.8:
            recommendations.append("Optimize mesh topology for better performance")
            recommendations.append("Reduce texture resolution or implement texture atlasing")

        if scores["quality"] < 0.85:
            recommendations.append("Enhance material application and PBR properties")
            recommendations.append("Improve UV layout and texture mapping")

        # Specific error-based recommendations
        critical_errors = [e for e in errors if e.severity == ValidationLevel.CRITICAL]
        if critical_errors:
            recommendations.append("Address critical errors before proceeding to final export")

        return recommendations

    def format_validation_report(self, report: ValidationReport) -> str:
        """Format validation report for display"""
        formatted = f"""
# Spline Professional - Validation Report

## Overall Status: {report.overall_status.upper()}
- **Accuracy Score**: {report.accuracy_score:.2%}
- **Performance Score**: {report.performance_score:.2%}
- **Quality Score**: {report.quality_score:.2%}
- **Validation Time**: {report.validation_timestamp.strftime('%Y-%m-%d %H:%M:%S')}

## Errors Found ({len(report.errors)})
"""

        if report.errors:
            for error in report.errors:
                formatted += f"- **{error.severity.value.upper()}** [{error.component}]: {error.message}\n"

        formatted += "\n## Recommendations\n"
        for rec in report.recommendations:
            formatted += f"- {rec}\n"

        return formatted

# Example usage
if __name__ == "__main__":
    validator = SplineProfessionalValidator()

    # Sample model data
    sample_model_data = {
        "mesh_data": {
            "non_manifold_edges": 0,
            "isolated_vertices": 0,
            "is_watertight": True,
            "has_valid_normals": True
        },
        "model_stats": {
            "vertex_count": 25000,
            "file_size_mb": 8.5,
            "draw_calls": 45
        },
        "material_data": {
            "materials": [
                {
                    "name": "main_material",
                    "properties": {
                        "albedo": [1.0, 1.0, 1.0],
                        "roughness": 0.7,
                        "metallic": 0.0
                    }
                }
            ]
        },
        "export_data": {
            "format": "GLB",
            "is_valid": True,
            "has_gltf_structure": True
        }
    }

    # Run validation
    report = validator.run_validation(sample_model_data, {})
    print(validator.format_validation_report(report))