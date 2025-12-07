/**
 * Prevention and Safety Validation System
 * FPEF-compliant security validation, conflict prevention, and safety mechanisms
 */

const chalk = require('chalk');
const { EventEmitter } = require('events');

class PreventionSafetyValidator extends EventEmitter {
  constructor(consensusValidator, qualityAssurance, fpefFramework) {
    super();
    this.consensusValidator = consensusValidator;
    this.qualityAssurance = qualityAssurance;
    this.fpefFramework = fpefFramework;

    this.securityChecks = new Map();
    this.safetyValidations = new Map();
    this.conflictDetectors = new Map();
    this.duplicateDetector = null;
    this.complianceChecker = null;
    this.safetyMetrics = new Map();

    this.threatLevels = {
      LOW: { score: 0.0-0.2, color: 'green', action: 'monitor' },
      MEDIUM: { score: 0.2-0.5, color: 'yellow', action: 'review' },
      HIGH: { score: 0.5-0.8, color: 'red', action: 'block' },
      CRITICAL: { score: 0.8-1.0, color: 'magenta', action: 'immediate_block' }
    };

    this.initializeSecurityChecks();
    this.initializeConflictDetectors();
    this.setupDuplicateDetection();
    this.setupComplianceChecking();
  }

  /**
   * Initialize security validation checks
   */
  initializeSecurityChecks() {
    // Code security checks
    this.securityChecks.set('code_security', {
      name: 'Code Security Analysis',
      description: 'Analyze code for security vulnerabilities and malicious patterns',
      check: this.performCodeSecurityCheck.bind(this),
      severity: 'HIGH'
    });

    // Dependency security checks
    this.securityChecks.set('dependency_security', {
      name: 'Dependency Security Validation',
      description: 'Validate dependencies for known vulnerabilities',
      check: this.performDependencySecurityCheck.bind(this),
      severity: 'MEDIUM'
    });

    // Data security checks
    this.securityChecks.set('data_security', {
      name: 'Data Security Assessment',
      description: 'Assess data handling and privacy compliance',
      check: this.performDataSecurityCheck.bind(this),
      severity: 'HIGH'
    });

    // Access control checks
    this.securityChecks.set('access_control', {
      name: 'Access Control Validation',
      description: 'Validate access control mechanisms',
      check: this.performAccessControlCheck.bind(this),
      severity: 'MEDIUM'
    });

    // Network security checks
    this.securityChecks.set('network_security', {
      name: 'Network Security Analysis',
      description: 'Analyze network communication security',
      check: this.performNetworkSecurityCheck.bind(this),
      severity: 'MEDIUM'
    });

    // Input validation checks
    this.securityChecks.set('input_validation', {
      name: 'Input Validation Assessment',
      description: 'Assess input validation and sanitization',
      check: this.performInputValidationCheck.bind(this),
      severity: 'HIGH'
    });
  }

  /**
   * Initialize conflict detection mechanisms
   */
  initializeConflictDetectors() {
    // Functionality conflict detector
    this.conflictDetectors.set('functionality', {
      name: 'Functionality Conflict Detector',
      description: 'Detect conflicts in resource functionality',
      detect: this.detectFunctionalityConflicts.bind(this)
    });

    // Dependency conflict detector
    this.conflictDetectors.set('dependencies', {
      name: 'Dependency Conflict Detector',
      description: 'Detect dependency conflicts and incompatibilities',
      detect: this.detectDependencyConflicts.bind(this)
    });

    // Resource conflict detector
    this.conflictDetectors.set('resources', {
      name: 'Resource Conflict Detector',
      description: 'Detect resource usage conflicts',
      detect: this.detectResourceConflicts.bind(this)
    });

    // Interface conflict detector
    this.conflictDetectors.set('interfaces', {
      name: 'Interface Conflict Detector',
      description: 'Detect API and interface conflicts',
      detect: this.detectInterfaceConflicts.bind(this)
    });

    // Version conflict detector
    this.conflictDetectors.set('versions', {
      name: 'Version Conflict Detector',
      description: 'Detect version compatibility conflicts',
      detect: this.detectVersionConflicts.bind(this)
    });
  }

  /**
   * Setup duplicate detection
   */
  setupDuplicateDetection() {
    this.duplicateDetector = {
      algorithms: {
        exact: this.exactDuplicateDetection.bind(this),
        fuzzy: this.fuzzyDuplicateDetection.bind(this),
        semantic: this.semanticDuplicateDetection.bind(this),
        functional: this.functionalDuplicateDetection.bind(this)
      },

      detect: this.performDuplicateDetection.bind(this)
    };
  }

  /**
   * Setup compliance checking
   */
  setupComplianceChecking() {
    this.complianceChecker = {
      frameworks: {
        'FPEF': this.checkFPEFCompliance.bind(this),
        'GDPR': this.checkGDPRCompliance.bind(this),
        'OWASP': this.checkOWASPCompliance.bind(this),
        'SOC2': this.checkSOC2Compliance.bind(this)
      },

      check: this.performComplianceCheck.bind(this)
    };
  }

  /**
   * Execute comprehensive prevention and safety validation
   */
  async executePreventionSafetyValidation(resourceIds = null, options = {}) {
    const {
      securityChecks = ['code_security', 'dependency_security', 'data_security'],
      conflictDetectors = ['functionality', 'dependencies', 'interfaces'],
      duplicateDetection = true,
      complianceFrameworks = ['FPEF', 'OWASP'],
      strictMode = false
    } = options;

    const resourcesToValidate = resourceIds || Array.from(this.consensusValidator.resources.keys());

    console.log(chalk.magenta('🛡️ Starting Prevention & Safety Validation'));
    console.log(chalk.gray(`Resources: ${resourcesToValidate.length}`));
    console.log(chalk.gray(`Security Checks: ${securityChecks.join(', ')}`));
    console.log(chalk.gray(`Conflict Detectors: ${conflictDetectors.join(', ')}`));
    console.log(chalk.gray(`Compliance: ${complianceFrameworks.join(', ')}`));
    console.log(chalk.gray(`Strict Mode: ${strictMode}\n`));

    const validationResults = new Map();
    let totalSecurityViolations = 0;
    let totalConflicts = 0;
    let totalDuplicates = 0;
    let totalComplianceIssues = 0;

    for (const resourceId of resourcesToValidate) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      console.log(chalk.cyan(`🔍 Validating: ${resource.name}`));

      const resourceValidation = {
        resourceId,
        resourceName: resource.name,
        securityResults: {},
        conflictResults: {},
        duplicateResults: null,
        complianceResults: {},
        overallSafetyScore: 0,
        threatLevel: 'LOW',
        recommendations: [],
        blocked: false
      };

      // Security validation
      for (const checkName of securityChecks) {
        const check = this.securityChecks.get(checkName);
        if (!check) continue;

        try {
          const result = await check.check(resource);
          resourceValidation.securityResults[checkName] = result;

          if (result.violations && result.violations.length > 0) {
            totalSecurityViolations += result.violations.length;
            console.log(chalk.red(`  ❌ Security issue in ${check.name}: ${result.violations.length} violations`));
          } else {
            console.log(chalk.green(`  ✅ ${check.name}: Passed`));
          }
        } catch (error) {
          console.error(chalk.red(`    ❌ Error in ${check.name}: ${error.message}`));
          resourceValidation.securityResults[checkName] = {
            passed: false,
            error: error.message,
            violations: []
          };
        }
      }

      // Conflict detection
      for (const detectorName of conflictDetectors) {
        const detector = this.conflictDetectors.get(detectorName);
        if (!detector) continue;

        try {
          const conflicts = await detector.detect(resource, resourcesToValidate);
          resourceValidation.conflictResults[detectorName] = conflicts;

          if (conflicts.length > 0) {
            totalConflicts += conflicts.length;
            console.log(chalk.yellow(`  ⚠️ Conflicts detected in ${detector.name}: ${conflicts.length}`));
          } else {
            console.log(chalk.green(`  ✅ ${detector.name}: No conflicts`));
          }
        } catch (error) {
          console.error(chalk.red(`    ❌ Error in ${detector.name}: ${error.message}`));
          resourceValidation.conflictResults[detectorName] = [];
        }
      }

      // Duplicate detection
      if (duplicateDetection) {
        try {
          const duplicates = await this.duplicateDetector.detect(resource, resourcesToValidate);
          resourceValidation.duplicateResults = duplicates;

          if (duplicates.length > 0) {
            totalDuplicates += duplicates.length;
            console.log(chalk.yellow(`  ⚠️ Duplicates detected: ${duplicates.length}`));
          } else {
            console.log(chalk.green(`  ✅ No duplicates found`));
          }
        } catch (error) {
          console.error(chalk.red(`    ❌ Error in duplicate detection: ${error.message}`));
          resourceValidation.duplicateResults = [];
        }
      }

      // Compliance checking
      for (const framework of complianceFrameworks) {
        const checker = this.complianceChecker.frameworks[framework];
        if (!checker) continue;

        try {
          const compliance = await checker(resource);
          resourceValidation.complianceResults[framework] = compliance;

          if (compliance.issues && compliance.issues.length > 0) {
            totalComplianceIssues += compliance.issues.length;
            console.log(chalk.yellow(`  ⚠️ Compliance issues in ${framework}: ${compliance.issues.length}`));
          } else {
            console.log(chalk.green(`  ✅ ${framework} compliance: Passed`));
          }
        } catch (error) {
          console.error(chalk.red(`    ❌ Error in ${framework} compliance: ${error.message}`));
          resourceValidation.complianceResults[framework] = {
            compliant: false,
            issues: [{ type: 'error', message: error.message }]
          };
        }
      }

      // Calculate overall safety score
      resourceValidation.overallSafetyScore = this.calculateSafetyScore(resourceValidation);
      resourceValidation.threatLevel = this.determineThreatLevel(resourceValidation.overallSafetyScore);
      resourceValidation.recommendations = this.generateRecommendations(resourceValidation);
      resourceValidation.blocked = strictMode && this.shouldBlockResource(resourceValidation);

      if (resourceValidation.blocked) {
        console.log(chalk.red(`    🚫 RESOURCE BLOCKED - Threat Level: ${resourceValidation.threatLevel}`));
      }

      // Store validation metrics
      this.updateSafetyMetrics(resourceId, resourceValidation);

      validationResults.set(resourceId, resourceValidation);
    }

    console.log(chalk.green(`\n✅ Safety validation complete`));
    console.log(chalk.gray(`Security violations: ${totalSecurityViolations}`));
    console.log(chalk.gray(`Conflicts detected: ${totalConflicts}`));
    console.log(chalk.gray(`Duplicates found: ${totalDuplicates}`));
    console.log(chalk.gray(`Compliance issues: ${totalComplianceIssues}\n`));

    return {
      results: validationResults,
      summary: this.generateSafetySummary(validationResults),
      statistics: {
        totalSecurityViolations,
        totalConflicts,
        totalDuplicates,
        totalComplianceIssues,
        resourcesBlocked: Array.from(validationResults.values()).filter(r => r.blocked).length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Perform code security check
   */
  async performCodeSecurityCheck(resource) {
    const violations = [];
    const code = resource.code || '';

    // Dangerous function patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, type: 'code_injection', severity: 'CRITICAL' },
      { pattern: /exec\s*\(/, type: 'code_injection', severity: 'CRITICAL' },
      { pattern: /system\s*\(/, type: 'command_injection', severity: 'HIGH' },
      { pattern: /shell_exec\s*\(/, type: 'command_injection', severity: 'HIGH' },
      { pattern: /\$\(.*\)/, type: 'command_injection', severity: 'HIGH' },
      { pattern: /document\.write\s*\(/, type: 'xss', severity: 'MEDIUM' },
      { pattern: /innerHTML\s*=/, type: 'xss', severity: 'MEDIUM' },
      { pattern: /outerHTML\s*=/, type: 'xss', severity: 'MEDIUM' },
      { pattern: /SQL\s*=\s*["'].*\+/, type: 'sql_injection', severity: 'HIGH' },
      { pattern: /query\s*\(\s*["'].*\+/, type: 'sql_injection', severity: 'HIGH' }
    ];

    for (const { pattern, type, severity } of dangerousPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          type,
          severity,
          pattern: pattern.source,
          occurrences: matches.length,
          description: `Potential ${type.replace('_', ' ')} vulnerability detected`
        });
      }
    }

    // Check for hardcoded secrets
    const secretPatterns = [
      { pattern: /password\s*=\s*["'][^"']+["']/, type: 'hardcoded_password' },
      { pattern: /api_key\s*=\s*["'][^"']+["']/, type: 'hardcoded_api_key' },
      { pattern: /secret\s*=\s*["'][^"']+["']/, type: 'hardcoded_secret' },
      { pattern: /token\s*=\s*["'][^"']+["']/, type: 'hardcoded_token' }
    ];

    for (const { pattern, type } of secretPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          type,
          severity: 'HIGH',
          pattern: pattern.source,
          occurrences: matches.length,
          description: `Hardcoded ${type.replace('_', ' ')} detected`
        });
      }
    }

    // Check for insecure protocols
    const insecureProtocols = ['http://', 'ftp://', 'telnet://', 'ws://'];
    for (const protocol of insecureProtocols) {
      if (code.includes(protocol)) {
        violations.push({
          type: 'insecure_protocol',
          severity: 'MEDIUM',
          pattern: protocol,
          occurrences: (code.match(new RegExp(protocol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
          description: `Insecure protocol ${protocol} detected`
        });
      }
    }

    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length;
    const highViolations = violations.filter(v => v.severity === 'HIGH').length;

    return {
      passed: criticalViolations === 0 && highViolations <= 2,
      violations,
      score: Math.max(0, 1 - (criticalViolations * 0.3 + highViolations * 0.1 + violations.length * 0.05)),
      recommendations: this.generateSecurityRecommendations(violations)
    };
  }

  /**
   * Perform dependency security check
   */
  async performDependencySecurityCheck(resource) {
    const violations = [];
    const dependencies = resource.dependencies || [];

    // Known vulnerable packages (simplified database)
    const knownVulnerabilities = {
      'lodash': { versions: '<4.17.21', severity: 'HIGH', cve: 'CVE-2021-23337' },
      'request': { versions: '<2.88.2', severity: 'HIGH', cve: 'CVE-2023-28155' },
      'express': { versions: '<4.17.3', severity: 'MEDIUM', cve: 'CVE-2022-24999' },
      'axios': { versions: '<0.21.2', severity: 'MEDIUM', cve: 'CVE-2021-3749' }
    };

    for (const dep of dependencies) {
      const depName = typeof dep === 'string' ? dep.split('@')[0] : dep.name;
      const depVersion = typeof dep === 'string' ? dep.split('@')[1] : dep.version;

      if (knownVulnerabilities[depName]) {
        const vuln = knownVulnerabilities[depName];
        violations.push({
          type: 'vulnerable_dependency',
          severity: vuln.severity,
          dependency: depName,
          version: depVersion,
          cve: vuln.cve,
          description: `Dependency ${depName}@${depVersion} has known vulnerabilities`
        });
      }

      // Check for suspicious package names
      if (depName.includes('typo') || depName.length < 3) {
        violations.push({
          type: 'suspicious_package',
          severity: 'MEDIUM',
          dependency: depName,
          description: `Suspicious package name: ${depName}`
        });
      }
    }

    return {
      passed: violations.filter(v => v.severity === 'HIGH').length === 0,
      violations,
      score: Math.max(0, 1 - violations.length * 0.1),
      recommendations: this.generateDependencyRecommendations(violations)
    };
  }

  /**
   * Perform data security check
   */
  async performDataSecurityCheck(resource) {
    const violations = [];
    const text = (resource.code + ' ' + (resource.description || '')).toLowerCase();

    // Check for data handling issues
    const dataSecurityIssues = [
      { pattern: /clear.*text|plain.*text/, type: 'unencrypted_data', severity: 'HIGH' },
      { pattern: /store.*password|save.*password/, type: 'password_storage', severity: 'HIGH' },
      { pattern: /email.*validation|validate.*email/, type: 'data_collection', severity: 'LOW' },
      { pattern: /collect.*personal|store.*personal/, type: 'personal_data', severity: 'MEDIUM' },
      { pattern: /pii|personally.*identifiable/, type: 'pii_handling', severity: 'HIGH' }
    ];

    for (const { pattern, type, severity } of dataSecurityIssues) {
      if (pattern.test(text)) {
        violations.push({
          type,
          severity,
          pattern: pattern.source,
          description: `Potential ${type.replace('_', ' ')} security issue`
        });
      }
    }

    // Check for logging sensitive data
    if (text.includes('console.log') || text.includes('print')) {
      const sensitivePatterns = ['password', 'token', 'secret', 'key', 'auth'];
      for (const pattern of sensitivePatterns) {
        if (text.includes(`console.log("${pattern}`) || text.includes(`console.log('${pattern}`)) {
          violations.push({
            type: 'sensitive_logging',
            severity: 'MEDIUM',
            description: `Sensitive data ${pattern} potentially logged`
          });
        }
      }
    }

    return {
      passed: violations.filter(v => v.severity === 'HIGH').length === 0,
      violations,
      score: Math.max(0, 1 - violations.length * 0.15),
      recommendations: this.generateDataSecurityRecommendations(violations)
    };
  }

  /**
   * Perform access control check
   */
  async performAccessControlCheck(resource) {
    const violations = [];
    const code = resource.code || '';

    // Check for access control patterns
    const accessControlPatterns = [
      { pattern: /admin.*=.*true|root.*=.*true/, type: 'hardcoded_admin', severity: 'HIGH' },
      { pattern: /if\s*\(\s*user\s*==\s*["']admin["']\s*\)/, type: 'weak_auth', severity: 'MEDIUM' },
      { pattern: /bypass|skip.*auth|disable.*auth/, type: 'auth_bypass', severity: 'CRITICAL' },
      { pattern: /no.*auth|without.*auth/, type: 'missing_auth', severity: 'HIGH' }
    ];

    for (const { pattern, type, severity } of accessControlPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          type,
          severity,
          pattern: pattern.source,
          occurrences: matches.length,
          description: `Potential ${type.replace('_', ' ')} vulnerability`
        });
      }
    }

    // Check for authentication mechanisms
    if (!code.includes('auth') && !code.includes('login') && !code.includes('authenticate')) {
      violations.push({
        type: 'no_authentication',
        severity: 'MEDIUM',
        description: 'No authentication mechanism detected'
      });
    }

    return {
      passed: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
      score: Math.max(0, 1 - violations.length * 0.12),
      recommendations: this.generateAccessControlRecommendations(violations)
    };
  }

  /**
   * Perform network security check
   */
  async performNetworkSecurityCheck(resource) {
    const violations = [];
    const code = resource.code || '';

    // Check for network security issues
    const networkSecurityPatterns = [
      { pattern: /ssl.*verify.*false|tls.*verify.*false/, type: 'ssl_verification_disabled', severity: 'HIGH' },
      { pattern: /no.*ssl|disable.*ssl/, type: 'ssl_disabled', severity: 'HIGH' },
      { pattern: /curl.*-k|wget.*--no-check-certificate/, type: 'certificate_validation_disabled', severity: 'MEDIUM' },
      { pattern: /allow.*all|0\.0\.0\.0/, type: 'open_access', severity: 'MEDIUM' }
    ];

    for (const { pattern, type, severity } of networkSecurityPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          type,
          severity,
          pattern: pattern.source,
          occurrences: matches.length,
          description: `Network ${type.replace('_', ' ')} issue detected`
        });
      }
    }

    // Check for exposed ports or services
    if (code.includes('listen(0)') || code.includes('0.0.0.0')) {
      violations.push({
        type: 'exposed_service',
        severity: 'MEDIUM',
        description: 'Service potentially exposed to all interfaces'
      });
    }

    return {
      passed: violations.filter(v => v.severity === 'HIGH').length === 0,
      violations,
      score: Math.max(0, 1 - violations.length * 0.1),
      recommendations: this.generateNetworkSecurityRecommendations(violations)
    };
  }

  /**
   * Perform input validation check
   */
  async performInputValidationCheck(resource) {
    const violations = [];
    const code = resource.code || '';

    // Check for input validation patterns
    const inputValidationPatterns = [
      { pattern: /\$_GET|\$_POST|\$_REQUEST/, type: 'direct_user_input', severity: 'HIGH' },
      { pattern: /request\.body\.|req\.body\.|params\[/, type: 'unvalidated_input', severity: 'MEDIUM' },
      { pattern: /innerHTML.*\+|outerHTML.*\+/, type: 'unescaped_output', severity: 'HIGH' },
      { pattern: /sql.*\+|query.*\+/, type: 'unescaped_query', severity: 'CRITICAL' }
    ];

    for (const { pattern, type, severity } of inputValidationPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          type,
          severity,
          pattern: pattern.source,
          occurrences: matches.length,
          description: `Input ${type.replace('_', ' ')} vulnerability`
        });
      }
    }

    // Check for validation mechanisms
    const validationPatterns = [
      /validate|sanitize|escape|encode|filter/,
      /joi|yup|zod|validator/,
      /html.*escape|html.*encode/
    ];

    const hasValidation = validationPatterns.some(pattern => pattern.test(code));
    if (!hasValidation && violations.length > 0) {
      violations.push({
        type: 'no_input_validation',
        severity: 'HIGH',
        description: 'No input validation mechanisms detected'
      });
    }

    return {
      passed: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
      score: Math.max(0, 1 - violations.length * 0.15),
      recommendations: this.generateInputValidationRecommendations(violations)
    };
  }

  /**
   * Detect functionality conflicts
   */
  async detectFunctionalityConflicts(resource, allResourceIds) {
    const conflicts = [];
    const resourceFeatures = resource.features || [];

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource || otherResource.type !== resource.type) continue;

      const otherFeatures = otherResource.features || [];

      // Check for feature overlap
      const commonFeatures = resourceFeatures.filter(f => otherFeatures.includes(f));
      if (commonFeatures.length > resourceFeatures.length * 0.7) {
        conflicts.push({
          type: 'feature_overlap',
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          overlapPercentage: commonFeatures.length / resourceFeatures.length,
          commonFeatures,
          description: `High feature overlap (${(commonFeatures.length / resourceFeatures.length * 100).toFixed(1)}%)`
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect dependency conflicts
   */
  async detectDependencyConflicts(resource, allResourceIds) {
    const conflicts = [];
    const resourceDeps = resource.dependencies || [];

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource) continue;

      const otherDeps = otherResource.dependencies || [];

      // Check for version conflicts
      for (const dep of resourceDeps) {
        const depName = typeof dep === 'string' ? dep.split('@')[0] : dep.name;
        const depVersion = typeof dep === 'string' ? dep.split('@')[1] : dep.version;

        for (const otherDep of otherDeps) {
          const otherDepName = typeof otherDep === 'string' ? otherDep.split('@')[0] : otherDep.name;
          const otherDepVersion = typeof otherDep === 'string' ? otherDep.split('@')[1] : otherDep.version;

          if (depName === otherDepName && depVersion !== otherDepVersion) {
            conflicts.push({
              type: 'version_conflict',
              resourceId: otherResourceId,
              resourceName: otherResource.name,
              dependency: depName,
              versions: [depVersion, otherDepVersion],
              description: `Version conflict for ${depName}: ${depVersion} vs ${otherDepVersion}`
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect resource conflicts
   */
  async detectResourceConflicts(resource, allResourceIds) {
    const conflicts = [];

    // Check for naming conflicts
    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource) continue;

      if (resource.name === otherResource.name) {
        conflicts.push({
          type: 'name_conflict',
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          description: 'Identical resource names detected'
        });
      }

      // Check for identifier conflicts
      if (resource.identifier && resource.identifier === otherResource.identifier) {
        conflicts.push({
          type: 'identifier_conflict',
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          identifier: resource.identifier,
          description: 'Identical resource identifiers detected'
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect interface conflicts
   */
  async detectInterfaceConflicts(resource, allResourceIds) {
    const conflicts = [];
    const resourceMethods = resource.methods || resource.api?.methods || [];

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource) continue;

      const otherMethods = otherResource.methods || otherResource.api?.methods || [];

      // Check for method signature conflicts
      for (const method of resourceMethods) {
        for (const otherMethod of otherMethods) {
          if (method.name === otherMethod.name && method.signature !== otherMethod.signature) {
            conflicts.push({
              type: 'method_signature_conflict',
              resourceId: otherResourceId,
              resourceName: otherResource.name,
              method: method.name,
              signatures: [method.signature, otherMethod.signature],
              description: `Method ${method.name} has conflicting signatures`
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect version conflicts
   */
  async detectVersionConflicts(resource, allResourceIds) {
    const conflicts = [];

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource || otherResource.name !== resource.name) continue;

      if (resource.version !== otherResource.version) {
        conflicts.push({
          type: 'version_mismatch',
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          versions: [resource.version, otherResource.version],
          description: `Same resource with different versions detected`
        });
      }
    }

    return conflicts;
  }

  /**
   * Perform duplicate detection
   */
  async performDuplicateDetection(resource, allResourceIds) {
    const duplicates = [];
    const algorithms = this.duplicateDetector.algorithms;

    for (const [algorithmName, algorithm] of Object.entries(algorithms)) {
      try {
        const algorithmResults = await algorithm(resource, allResourceIds);
        for (const duplicate of algorithmResults) {
          if (!duplicates.find(d => d.resourceId === duplicate.resourceId)) {
            duplicates.push({
              ...duplicate,
              detectedBy: [algorithmName]
            });
          } else {
            const existing = duplicates.find(d => d.resourceId === duplicate.resourceId);
            existing.detectedBy.push(algorithmName);
          }
        }
      } catch (error) {
        console.error(chalk.red(`    ❌ Error in ${algorithmName} duplicate detection: ${error.message}`));
      }
    }

    return duplicates;
  }

  /**
   * Exact duplicate detection
   */
  async exactDuplicateDetection(resource, allResourceIds) {
    const duplicates = [];

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource) continue;

      // Check for exact code match
      if (resource.code && otherResource.code && resource.code === otherResource.code) {
        duplicates.push({
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          type: 'exact_code_duplicate',
          confidence: 1.0
        });
      }
    }

    return duplicates;
  }

  /**
   * Fuzzy duplicate detection
   */
  async fuzzyDuplicateDetection(resource, allResourceIds) {
    const duplicates = [];

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource) continue;

      const similarity = this.calculateStringSimilarity(
        resource.description || '',
        otherResource.description || ''
      );

      if (similarity > 0.9) {
        duplicates.push({
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          type: 'fuzzy_duplicate',
          confidence: similarity,
          similarity
        });
      }
    }

    return duplicates;
  }

  /**
   * Semantic duplicate detection
   */
  async semanticDuplicateDetection(resource, allResourceIds) {
    // Simplified semantic detection - in real implementation would use embeddings
    const duplicates = [];

    const resourceKeywords = this.extractKeywords(resource.description || '');

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource) continue;

      const otherKeywords = this.extractKeywords(otherResource.description || '');
      const keywordOverlap = this.calculateKeywordOverlap(resourceKeywords, otherKeywords);

      if (keywordOverlap > 0.8) {
        duplicates.push({
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          type: 'semantic_duplicate',
          confidence: keywordOverlap,
          keywordOverlap
        });
      }
    }

    return duplicates;
  }

  /**
   * Functional duplicate detection
   */
  async functionalDuplicateDetection(resource, allResourceIds) {
    const duplicates = [];

    for (const otherResourceId of allResourceIds) {
      if (otherResourceId === resource.id) continue;

      const otherResource = this.consensusValidator.resources.get(otherResourceId);
      if (!otherResource || otherResource.type !== resource.type) continue;

      const functionalityScore = this.calculateFunctionalSimilarity(resource, otherResource);

      if (functionalityScore > 0.85) {
        duplicates.push({
          resourceId: otherResourceId,
          resourceName: otherResource.name,
          type: 'functional_duplicate',
          confidence: functionalityScore,
          functionalityScore
        });
      }
    }

    return duplicates;
  }

  /**
   * Calculate string similarity
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    return [...new Set(words)];
  }

  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'];
    return stopWords.includes(word);
  }

  /**
   * Calculate keyword overlap
   */
  calculateKeywordOverlap(keywords1, keywords2) {
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];

    return union.length > 0 ? intersection.length / union.length : 0;
  }

  /**
   * Calculate functional similarity
   */
  calculateFunctionalSimilarity(resource1, resource2) {
    let similarity = 0;
    let factors = 0;

    // Compare features
    const features1 = resource1.features || [];
    const features2 = resource2.features || [];
    const featureOverlap = this.calculateKeywordOverlap(features1, features2);
    similarity += featureOverlap;
    factors++;

    // Compare types
    if (resource1.type === resource2.type) {
      similarity += 1;
    }
    factors++;

    // Compare descriptions
    const descSimilarity = this.calculateStringSimilarity(
      resource1.description || '',
      resource2.description || ''
    );
    similarity += descSimilarity;
    factors++;

    return similarity / factors;
  }

  /**
   * Perform compliance check
   */
  async performComplianceCheck(resource, frameworks) {
    const complianceResults = {};

    for (const framework of frameworks) {
      const checker = this.complianceChecker.frameworks[framework];
      if (!checker) continue;

      try {
        complianceResults[framework] = await checker(resource);
      } catch (error) {
        complianceResults[framework] = {
          compliant: false,
          issues: [{ type: 'error', message: error.message }]
        };
      }
    }

    return complianceResults;
  }

  /**
   * Check FPEF compliance
   */
  async checkFPEFCompliance(resource) {
    const issues = [];

    // Check if resource follows FPEF principles
    if (!resource.evidence) {
      issues.push({
        type: 'missing_evidence',
        severity: 'MEDIUM',
        description: 'No evidence provided for resource claims'
      });
    }

    if (!resource.testing || !resource.validation) {
      issues.push({
        type: 'insufficient_validation',
        severity: 'MEDIUM',
        description: 'Insufficient testing and validation evidence'
      });
    }

    if (!resource.minimalIntervention) {
      issues.push({
        type: 'complexity_violation',
        severity: 'LOW',
        description: 'Resource may violate minimal intervention principle'
      });
    }

    return {
      compliant: issues.filter(i => i.severity === 'HIGH').length === 0,
      issues,
      score: Math.max(0, 1 - issues.length * 0.1)
    };
  }

  /**
   * Check GDPR compliance
   */
  async checkGDPRCompliance(resource) {
    const issues = [];
    const text = (resource.code + ' ' + (resource.description || '')).toLowerCase();

    // Check for personal data handling
    if (text.includes('email') || text.includes('name') || text.includes('address')) {
      if (!text.includes('consent') && !text.includes('gdpr')) {
        issues.push({
          type: 'missing_consent',
          severity: 'HIGH',
          description: 'Personal data detected without explicit consent mechanism'
        });
      }
    }

    // Check for data processing records
    if (text.includes('process') || text.includes('store')) {
      if (!text.includes('privacy') && !text.includes('policy')) {
        issues.push({
          type: 'missing_privacy_policy',
          severity: 'MEDIUM',
          description: 'Data processing without privacy policy reference'
        });
      }
    }

    return {
      compliant: issues.filter(i => i.severity === 'HIGH').length === 0,
      issues,
      score: Math.max(0, 1 - issues.length * 0.15)
    };
  }

  /**
   * Check OWASP compliance
   */
  async checkOWASPCompliance(resource) {
    const issues = [];
    const securityResults = {};

    // Use existing security checks
    for (const [checkName, check] of this.securityChecks) {
      try {
        securityResults[checkName] = await check.check(this.consensusValidator.resources.get(resource.id));
      } catch (error) {
        securityResults[checkName] = { violations: [], score: 0.5 };
      }
    }

    // Aggregate security results
    const totalViolations = Object.values(securityResults).reduce((sum, result) =>
      sum + (result.violations?.length || 0), 0);

    if (totalViolations > 5) {
      issues.push({
        type: 'multiple_security_issues',
        severity: 'HIGH',
        description: `Multiple security violations detected: ${totalViolations}`
      });
    }

    return {
      compliant: issues.filter(i => i.severity === 'HIGH').length === 0,
      issues,
      score: Math.max(0, 1 - totalViolations * 0.1),
      securityResults
    };
  }

  /**
   * Check SOC2 compliance
   */
  async checkSOC2Compliance(resource) {
    const issues = [];

    // Security principle
    if (!resource.security && !resource.accessControl) {
      issues.push({
        type: 'missing_security_controls',
        severity: 'MEDIUM',
        description: 'Missing documented security controls'
      });
    }

    // Availability principle
    if (!resource.monitoring && !resource.backup) {
      issues.push({
        type: 'missing_availability_measures',
        severity: 'LOW',
        description: 'Missing availability and backup measures'
      });
    }

    // Processing integrity
    if (!resource.validation && !resource.testing) {
      issues.push({
        type: 'missing_processing_integrity',
        severity: 'MEDIUM',
        description: 'Missing processing integrity controls'
      });
    }

    return {
      compliant: issues.filter(i => i.severity === 'HIGH').length === 0,
      issues,
      score: Math.max(0, 1 - issues.length * 0.1)
    };
  }

  /**
   * Calculate overall safety score
   */
  calculateSafetyScore(validation) {
    let totalScore = 0;
    let weightSum = 0;

    // Security score (40% weight)
    const securityScores = Object.values(validation.securityResults).map(result => result.score || 0);
    if (securityScores.length > 0) {
      const avgSecurityScore = securityScores.reduce((a, b) => a + b, 0) / securityScores.length;
      totalScore += avgSecurityScore * 0.4;
      weightSum += 0.4;
    }

    // Conflict score (25% weight)
    const conflictCount = Object.values(validation.conflictResults)
      .reduce((sum, conflicts) => sum + conflicts.length, 0);
    const conflictScore = Math.max(0, 1 - conflictCount * 0.1);
    totalScore += conflictScore * 0.25;
    weightSum += 0.25;

    // Duplicate score (15% weight)
    const duplicateCount = validation.duplicateResults?.length || 0;
    const duplicateScore = Math.max(0, 1 - duplicateCount * 0.2);
    totalScore += duplicateScore * 0.15;
    weightSum += 0.15;

    // Compliance score (20% weight)
    const complianceScores = Object.values(validation.complianceResults).map(result => result.score || 0);
    if (complianceScores.length > 0) {
      const avgComplianceScore = complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length;
      totalScore += avgComplianceScore * 0.2;
      weightSum += 0.2;
    }

    return weightSum > 0 ? totalScore / weightSum : 0.5;
  }

  /**
   * Determine threat level
   */
  determineThreatLevel(safetyScore) {
    if (safetyScore >= 0.8) return 'LOW';
    if (safetyScore >= 0.6) return 'MEDIUM';
    if (safetyScore >= 0.4) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(validation) {
    const recommendations = [];

    // Security recommendations
    for (const [checkName, result] of Object.entries(validation.securityResults)) {
      if (result.recommendations) {
        recommendations.push(...result.recommendations);
      }
    }

    // Conflict recommendations
    const conflictCount = Object.values(validation.conflictResults)
      .reduce((sum, conflicts) => sum + conflicts.length, 0);
    if (conflictCount > 0) {
      recommendations.push('Resolve resource conflicts before deployment');
    }

    // Duplicate recommendations
    if (validation.duplicateResults && validation.duplicateResults.length > 0) {
      recommendations.push('Consider merging or deduplicating similar resources');
    }

    // Compliance recommendations
    for (const [framework, result] of Object.entries(validation.complianceResults)) {
      if (!result.compliant) {
        recommendations.push(`Address ${framework} compliance issues`);
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Determine if resource should be blocked
   */
  shouldBlockResource(validation) {
    const criticalSecurityViolations = Object.values(validation.securityResults)
      .reduce((sum, result) => sum + (result.violations?.filter(v => v.severity === 'CRITICAL').length || 0), 0);

    const highSecurityViolations = Object.values(validation.securityResults)
      .reduce((sum, result) => sum + (result.violations?.filter(v => v.severity === 'HIGH').length || 0), 0);

    return criticalSecurityViolations > 0 || highSecurityViolations > 3 || validation.overallSafetyScore < 0.3;
  }

  /**
   * Update safety metrics
   */
  updateSafetyMetrics(resourceId, validation) {
    const metrics = this.safetyMetrics.get(resourceId) || {
      safetyScore: 0,
      threatHistory: [],
      lastUpdated: new Date(),
      violationCount: 0
    };

    metrics.safetyScore = validation.overallSafetyScore;
    metrics.threatHistory.push({
      threatLevel: validation.threatLevel,
      timestamp: new Date()
    });
    metrics.lastUpdated = new Date();
    metrics.violationCount = Object.values(validation.securityResults)
      .reduce((sum, result) => sum + (result.violations?.length || 0), 0);

    // Keep only recent history
    if (metrics.threatHistory.length > 10) {
      metrics.threatHistory.shift();
    }

    this.safetyMetrics.set(resourceId, metrics);
  }

  /**
   * Generate safety summary
   */
  generateSafetySummary(validationResults) {
    const results = Array.from(validationResults.values());

    const summary = {
      totalResources: results.length,
      averageSafetyScore: results.reduce((sum, r) => sum + r.overallSafetyScore, 0) / results.length,
      threatDistribution: {
        LOW: results.filter(r => r.threatLevel === 'LOW').length,
        MEDIUM: results.filter(r => r.threatLevel === 'MEDIUM').length,
        HIGH: results.filter(r => r.threatLevel === 'HIGH').length,
        CRITICAL: results.filter(r => r.threatLevel === 'CRITICAL').length
      },
      blockedResources: results.filter(r => r.blocked).length,
      totalRecommendations: results.reduce((sum, r) => sum + r.recommendations.length, 0)
    };

    return summary;
  }

  // Generate recommendation methods for different security checks
  generateSecurityRecommendations(violations) {
    const recommendations = [];

    if (violations.some(v => v.type === 'code_injection')) {
      recommendations.push('Replace eval() and exec() with safer alternatives');
    }

    if (violations.some(v => v.type === 'hardcoded_password')) {
      recommendations.push('Use environment variables or secure vaults for credentials');
    }

    if (violations.some(v => v.type === 'sql_injection')) {
      recommendations.push('Use parameterized queries or prepared statements');
    }

    if (violations.some(v => v.type === 'insecure_protocol')) {
      recommendations.push('Use HTTPS and secure protocols for all communications');
    }

    return recommendations;
  }

  generateDependencyRecommendations(violations) {
    const recommendations = [];

    if (violations.some(v => v.type === 'vulnerable_dependency')) {
      recommendations.push('Update dependencies to secure versions');
    }

    if (violations.some(v => v.type === 'suspicious_package')) {
      recommendations.push('Verify package authenticity and source');
    }

    return recommendations;
  }

  generateDataSecurityRecommendations(violations) {
    const recommendations = [];

    if (violations.some(v => v.type === 'unencrypted_data')) {
      recommendations.push('Implement encryption for sensitive data');
    }

    if (violations.some(v => v.type === 'password_storage')) {
      recommendations.push('Use proper password hashing and salting');
    }

    return recommendations;
  }

  generateAccessControlRecommendations(violations) {
    const recommendations = [];

    if (violations.some(v => v.type === 'hardcoded_admin')) {
      recommendations.push('Implement proper role-based access control');
    }

    if (violations.some(v => v.type === 'auth_bypass')) {
      recommendations.push('Remove authentication bypass mechanisms');
    }

    return recommendations;
  }

  generateNetworkSecurityRecommendations(violations) {
    const recommendations = [];

    if (violations.some(v => v.type === 'ssl_disabled')) {
      recommendations.push('Enable SSL/TLS for all network communications');
    }

    if (violations.some(v => v.type === 'exposed_service')) {
      recommendations.push('Restrict service exposure to required interfaces only');
    }

    return recommendations;
  }

  generateInputValidationRecommendations(violations) {
    const recommendations = [];

    if (violations.some(v => v.type === 'unvalidated_input')) {
      recommendations.push('Implement input validation for all user inputs');
    }

    if (violations.some(v => v.type === 'unescaped_output')) {
      recommendations.push('Properly escape all outputs to prevent XSS');
    }

    return recommendations;
  }

  /**
   * Export safety validation data
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      securityChecks: Object.fromEntries(this.securityChecks),
      conflictDetectors: Object.fromEntries(this.conflictDetectors),
      safetyMetrics: Array.from(this.safetyMetrics.entries()),
      threatLevels: this.threatLevels
    };
  }
}

module.exports = { PreventionSafetyValidator };