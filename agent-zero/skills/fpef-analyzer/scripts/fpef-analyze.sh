#!/bin/bash

# FPEF Evidence Analyzer Script
# Find-Prove-Evidence-Fix framework implementation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$(dirname "$SCRIPT_DIR")/resources"

# Default configuration
CONFIG_FILE="$RESOURCES_DIR/fpef-config.json"
OUTPUT_DIR="$PWD/fpef-analysis"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CERTAINTY_THRESHOLD="0.95"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo "FPEF Evidence Analyzer"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "FPEF Framework: Find-Prove-Evidence-Fix systematic analysis"
    echo ""
    echo "Options:"
    echo "  -c, --config FILE     Configuration file (default: resources/fpef-config.json)"
    echo "  -o, --output DIR      Output directory (default: ./fpef-analysis)"
    echo "  -p, --problem DESC    Problem description (quick mode)"
    echo "  -t, --threshold NUM   Certainty threshold (default: 0.95)"
    echo "  -d, --depth LEVEL     Analysis depth (rapid|focused|comprehensive)"
    echo "  -i, --interactive     Interactive mode with guided questions"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                              # Use default config"
    echo "  $0 -i                                           # Interactive mode"
    echo "  $0 -p 'API response times increased 300%'      # Quick problem analysis"
    echo "  $0 -d comprehensive -t 0.98                   # Deep analysis with high certainty"
}

# Parse command line arguments
PROBLEM_DESC=""
DEPTH="focused"
INTERACTIVE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -p|--problem)
            PROBLEM_DESC="$2"
            shift 2
            ;;
        -t|--threshold)
            CERTAINTY_THRESHOLD="$2"
            shift 2
            ;;
        -d|--depth)
            DEPTH="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Interactive mode setup
if [ "$INTERACTIVE" = true ]; then
    echo -e "${BLUE}🔍 FPEF Interactive Analysis Mode${NC}"
    echo ""

    # Collect problem information interactively
    read -p "📝 Describe the problem in detail: " user_problem
    PROBLEM_DESC="$user_problem"

    read -p "⏰ When did the problem start? (e.g., '2 hours ago', 'yesterday morning'): " timeline

    read -p "🎯 Which systems are affected? (e.g., 'API, database, user authentication'): " scope

    read -p "📊 What metrics are affected? (e.g., 'response time, error rate, user logins'): " metrics

    read -p "🚨 What's the business impact? (e.g., 'users can\'t complete purchases'): " impact

    echo ""
    echo -e "${GREEN}✅ Information collected. Starting FPEF analysis...${NC}"
    echo ""
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to read configuration value
get_config_value() {
    local key="$1"
    local default="$2"

    if [ -f "$CONFIG_FILE" ]; then
        python3 -c "
import json
import sys

try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)

    keys = '$key'.split('.')
    value = config

    for k in keys:
        if isinstance(value, dict) and k in value:
            value = value[k]
        else:
            value = '$default'
            break

    if isinstance(value, str):
        print(value)
    else:
        print('$default')
except:
    print('$default')
"
    else
        echo "$default"
    fi
}

# Extract configuration values or use interactive input
if [ -f "$CONFIG_FILE" ]; then
    PROBLEM_DESC=$(get_config_value "problem_description" "$PROBLEM_DESC")
    SCOPE=$(get_config_value "scope" "${scope:-}")
    SEVERITY=$(get_config_value "severity" "medium")
    BUSINESS_IMPACT=$(get_config_value "business_impact" "${impact:-}")
    TIMELINE=$(get_config_value "timeline" "${timeline:-}")
    DATA_SOURCES=$(get_config_value "data_sources" '["logs", "metrics", "traces"]')
else
    SCOPE="${scope:-Unknown systems}"
    SEVERITY="medium"
    BUSINESS_IMPACT="${impact:-Under investigation}"
    TIMELINE="${timeline:-Unknown}"
    DATA_SOURCES='["logs", "metrics", "traces"]'
fi

# Display analysis setup
echo -e "${PURPLE}🚀 FPEF Evidence Analyzer Starting...${NC}"
echo -e "📁 Output directory: $OUTPUT_DIR"
echo -e "⚙️  Configuration: $CONFIG_FILE"
echo -e "🎯 Certainty threshold: $CERTAINTY_THRESHOLD"
echo -e "📊 Analysis depth: $DEPTH"
echo ""

echo -e "${BLUE}📋 Problem Analysis Summary:${NC}"
echo -e "   Problem: ${RED}$PROBLEM_DESC${NC}"
echo -e "   Scope: $SCOPE"
echo -e "   Severity: $SEVERITY"
echo -e "   Timeline: $TIMELINE"
echo -e "   Business Impact: $BUSINESS_IMPACT"
echo -e "   Data Sources: $DATA_SOURCES"
echo ""

# Generate hypothesis tree based on problem type
echo -e "${GREEN}🔍 Phase 1: FIND - Problem Identification${NC}"
echo "   Analyzing problem and generating hypotheses..."

# Create main analysis file
ANALYSIS_FILE="$OUTPUT_DIR/fpef-analysis-$TIMESTAMP.md"

cat > "$ANALYSIS_FILE" << EOF
# FPEF Evidence Analysis Report

**Analysis ID:** FPEF-$TIMESTAMP
**Problem:** $PROBLEM_DESC
**Scope:** $SCOPE
**Severity:** $SEVERITY
**Timeline:** $TIMELINE
**Analysis Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Certainty Threshold:** $CERTAINTY_THRESHOLD
**Analysis Depth:** $DEPTH

---

## Executive Summary

This FPEF (Find-Prove-Evidence-Fix) analysis addresses: **$PROBLEM_DESC** affecting **$SCOPE**. The analysis follows a systematic evidence-based approach to identify root causes, establish causal relationships, and implement targeted fixes with validated effectiveness.

### Key Findings
- **Problem Classification:** Determined during evidence collection
- **Root Cause:** To be established through analysis
- **Impact Assessment:** $BUSINESS_IMPACT
- **Recommended Actions:** To be determined based on findings

---

## Phase 1: FIND - Problem Identification and Hypothesis Generation

### 1.1 Problem Statement Analysis

**Core Problem:** $PROBLEM_DESC

**Affected Scope:**
- **Systems:** $SCOPE
- **Timeline:** $TIMELINE
- **Severity Level:** $SEVERITY
- **Business Impact:** $BUSINESS_IMPACT

**Success Criteria:**
- [ ] Problem clearly defined with measurable parameters
- [ ] Scope boundaries established and validated
- [ ] Impact quantified with business metrics
- [ ] Stakeholder requirements documented

### 1.2 Hypothesis Tree Generation

Based on the problem description, the following hypothesis tree is proposed:

#### Primary Hypotheses (High Probability)
EOF

# Generate problem-specific hypotheses
if [[ "$PROBLEM_DESC" == *"slow"* || "$PROBLEM_DESC" == *"performance"* || "$PROBLEM_DESC" == *"response time"* ]]; then
    cat >> "$ANALYSIS_FILE" << EOF

**H1.1: Resource Exhaustion (Probability: 0.7)**
- **Description:** System resources (CPU, memory, database connections) are exhausted
- **Mechanism:** Increased load or resource leak causing performance degradation
- **Evidence Required:** Resource utilization metrics, memory usage patterns
- **Validation Method:** Performance monitoring and resource profiling

**H1.2: Database Bottleneck (Probability: 0.6)**
- **Description:** Database queries or connection pool limiting performance
- **Mechanism:** Slow queries, missing indexes, or connection exhaustion
- **Evidence Required:** Query performance logs, database metrics
- **Validation Method:** Database performance analysis and query optimization

**H1.3: Network Latency (Probability: 0.4)**
- **Description:** Network connectivity issues causing increased response times
- **Mechanism:** Network congestion, routing issues, or DNS problems
- **Evidence Required:** Network latency measurements, traceroute data
- **Validation Method:** Network monitoring and connectivity testing
EOF

elif [[ "$PROBLEM_DESC" == *"error"* || "$PROBLEM_DESC" == *"failure"* || "$PROBLEM_DESC" == *"crash"* ]]; then
    cat >> "$ANALYSIS_FILE" << EOF

**H1.1: Code Defect (Probability: 0.8)**
- **Description:** Software bug causing system failures
- **Mechanism:** Logic error, exception handling issue, or memory corruption
- **Evidence Required:** Error logs, stack traces, code review findings
- **Validation Method:** Code analysis and debugging

**H1.2: Configuration Error (Probability: 0.6)**
- **Description:** Incorrect system configuration causing failures
- **Mechanism:** Invalid parameters, environment variables, or deployment settings
- **Evidence Required:** Configuration files, environment variables, deployment logs
- **Validation Method:** Configuration audit and validation

**H1.3: External Dependency Failure (Probability: 0.5)**
- **Description:** Third-party service or API failure affecting system
- **Mechanism:** External service outage, API changes, or authentication issues
- **Evidence Required:** External service logs, API response codes, network traces
- **Validation Method:** External service testing and integration validation
EOF

elif [[ "$PROBLEM_DESC" == *"security"* || "$PROBLEM_DESC" == *"unauthorized"* || "$PROBLEM_DESC" == *"breach"* ]]; then
    cat >> "$ANALYSIS_FILE" << EOF

**H1.1: Authentication Bypass (Probability: 0.7)**
- **Description:** Authentication mechanism compromised or bypassed
- **Mechanism:** Weak passwords, session hijacking, or token theft
- **Evidence Required:** Authentication logs, access patterns, audit trails
- **Validation Method:** Security audit and penetration testing

**H1.2: Authorization Flaw (Probability: 0.6)**
- **Description:** Access control permissions incorrectly configured
- **Mechanism:** Privilege escalation, missing access controls, or policy misconfiguration
- **Evidence Required:** Access logs, permission matrices, policy configurations
- **Validation Method:** Access control testing and security audit

**H1.3: Data Injection Attack (Probability: 0.4)**
- **Description:** Malicious input injected into system causing security breach
- **Mechanism:** SQL injection, XSS, or command injection attacks
- **Evidence Required:** Input logs, web application firewall logs, traffic analysis
- **Validation Method:** Security scanning and vulnerability assessment
EOF

else
    cat >> "$ANALYSIS_FILE" << EOF

**H1.1: System Performance Issue (Probability: 0.6)**
- **Description:** General system performance degradation
- **Mechanism:** Resource contention, inefficient algorithms, or scaling issues
- **Evidence Required:** Performance metrics, resource utilization data
- **Validation Method:** Performance profiling and load testing

**H1.2: Data Integrity Problem (Probability: 0.5)**
- **Description:** Data corruption or inconsistency issues
- **Mechanism:** Database corruption, data migration errors, or synchronization problems
- **Evidence Required:** Data validation results, database consistency checks
- **Validation Method:** Data integrity analysis and validation

**H1.3: Integration Failure (Probability: 0.4)**
- **Description:** System integration or communication failure
- **Mechanism:** API incompatibility, message queue issues, or service mesh problems
- **Evidence Required:** Integration logs, API response data, communication traces
- **Validation Method:** Integration testing and communication analysis
EOF
fi

cat >> "$ANALYSIS_FILE" << EOF

#### Secondary Hypotheses (Medium Probability)

**H2.1: Environmental Factors (Probability: 0.3)**
- **Description:** External environmental factors affecting system behavior
- **Mechanism:** Infrastructure changes, network modifications, or external events
- **Evidence Required:** Change logs, environmental monitoring data
- **Validation Method:** Environmental impact assessment

**H2.2: Human Factors (Probability: 0.2)**
- **Description:** Human error or procedural issues
- **Mechanism:** Incorrect procedures, insufficient training, or communication failures
- **Evidence Required:** Process documentation, human activity logs
- **Validation Method:** Process review and human factors analysis

### 1.3 Evidence Collection Plan

Based on the hypotheses, the following evidence collection plan is established:

#### High-Priority Evidence Sources
1. **System Logs:** Application and system error logs
2. **Performance Metrics:** CPU, memory, disk, network utilization
3. **Database Metrics:** Query performance, connection pools, indexes
4. **User Activity Logs:** User actions, session data, access patterns

#### Medium-Priority Evidence Sources
1. **Network Traces:** Packet captures, network performance data
2. **Configuration Files:** Current and historical configurations
3. **Change Logs:** Recent changes to systems or code
4. **External Service Logs:** Third-party API calls and responses

#### Evidence Collection Timeline
- **Immediate (0-1 hour):** System logs, performance metrics
- **Short-term (1-4 hours):** Database metrics, network traces
- **Medium-term (4-24 hours):** Configuration analysis, historical data
- **Long-term (24+ hours):** Trend analysis, pattern recognition

---

## Phase 2: PROVE - Causal Analysis and Root Cause Establishment

### 2.1 Evidence Analysis Framework

Each hypothesis will be evaluated using the following criteria:

**Evidence Strength Scoring:**
- **Strong (0.9-1.0):** Multiple independent sources, high confidence
- **Moderate (0.7-0.9):** Reliable sources with some limitations
- **Weak (0.5-0.7):** Limited sources or significant gaps
- **Insufficient (<0.5):** Inadequate evidence for conclusion

**Causal Relationship Assessment:**
- **Temporal Precedence:** Cause clearly precedes effect
- **Statistical Correlation:** Strong correlation with statistical significance
- **Mechanistic Plausibility:** Clear mechanism explaining relationship
- **Alternative Exclusion:** Other explanations ruled out

### 2.2 Hypothesis Validation Process

For each primary hypothesis:

**Step 1: Evidence Collection**
```bash
# Automated evidence collection script
./scripts/collect-evidence.sh --hypothesis H1.1 --data sources/
```

**Step 2: Evidence Analysis**
- Correlate evidence with timeline
- Statistical significance testing
- Pattern recognition and anomaly detection

**Step 3: Causal Inference**
- Apply causal inference algorithms
- Establish temporal relationships
- Validate mechanistic explanations

**Step 4: Confidence Scoring**
- Calculate confidence score for each hypothesis
- Compare against certainty threshold ($CERTAINTY_THRESHOLD)
- Rank hypotheses by confidence level

### 2.3 Root Cause Determination

The root cause will be established when:
1. **Evidence Threshold:** Confidence score ≥ $CERTAINTY_THRESHOLD
2. **Causal Chain:** Clear causal relationship established
3. **Alternative Exclusion:** Other hypotheses refuted
4. **Reproducibility:** Cause-effect relationship reproducible

---

## Phase 3: EVIDENCE - Comprehensive Data Collection and Validation

### 3.1 Evidence Collection Matrix

| Evidence Type | Source | Reliability | Accessibility | Priority |
|---------------|--------|-------------|---------------|----------|
| System Logs | Application servers | High | Immediate | Critical |
| Performance Metrics | Monitoring systems | High | Immediate | Critical |
| Database Metrics | Database servers | High | Immediate | Critical |
| Network Traces | Network monitoring | Medium | 1-2 hours | High |
| Configuration Files | Version control | High | Immediate | High |
| User Activity | Application logs | Medium | Immediate | Medium |
| External APIs | Third-party services | Medium | 1-4 hours | Medium |

### 3.2 Automated Evidence Collection

**Evidence Collection Commands:**
\`\`\`bash
# System logs collection
./scripts/collect-logs.sh --timeframe "$TIMELINE" --output "$OUTPUT_DIR/logs/"

# Performance metrics collection
./scripts/collect-metrics.sh --start-time "$(date -d '1 hour ago')" --output "$OUTPUT_DIR/metrics/"

# Database performance data
./scripts/collect-db-metrics.sh --output "$OUTPUT_DIR/database/"

# Network analysis
./scripts/collect-network-data.sh --output "$OUTPUT_DIR/network/"
\`\`\`

### 3.3 Manual Evidence Collection

**Interview-Based Evidence:**
- System administrators and engineers
- Development team members
- User experience reports
- Stakeholder impact assessments

**Document-Based Evidence:**
- System architecture documentation
- Change management records
- Incident reports and post-mortems
- Configuration management records

### 3.4 Evidence Validation

**Validation Criteria:**
- **Authenticity:** Source verification and integrity checks
- **Accuracy:** Cross-validation with multiple sources
- **Completeness:** Coverage of relevant time periods and systems
- **Consistency:** Logical consistency across evidence types
- **Relevance:** Direct relationship to hypotheses being tested

---

## Phase 4: FIX - Targeted Interventions and Implementation

### 4.1 Solution Design Framework

Based on established root cause, solutions will be designed using:

**Solution Categories:**
1. **Immediate Fixes:** Emergency repairs within 1-4 hours
2. **Short-term Solutions:** Stabilization within 24 hours
3. **Long-term Improvements:** Permanent fixes within 1 week
4. **Preventive Measures:** Future incident prevention

**Solution Effectiveness Criteria:**
- Addresses root cause directly
- Minimal side effects and risks
- Cost-effective implementation
- Sustainable long-term solution
- Measurable impact validation

### 4.2 Implementation Planning

**Phase-Based Implementation:**

#### Emergency Response (0-4 hours)
- **Objective:** Immediate symptom mitigation
- **Actions:** Service restart, configuration rollback, traffic diversion
- **Validation:** Symptom reduction and system stabilization

#### Short-term Stabilization (4-24 hours)
- **Objective:** Temporary fix while permanent solution developed
- **Actions:** Patch deployment, resource scaling, monitoring enhancement
- **Validation:** System stability and performance improvement

#### Long-term Resolution (1-7 days)
- **Objective:** Permanent fix addressing root cause
- **Actions:** Code changes, architecture improvements, process modifications
- **Validation:** Root cause elimination and performance restoration

#### Prevention and Learning (1-4 weeks)
- **Objective:** Prevent recurrence and improve response
- **Actions:** Process improvements, monitoring enhancements, training
- **Validation:** Reduced incident frequency and improved response time

### 4.3 Fix Validation Strategy

**Validation Methods:**
- **A/B Testing:** Control group vs. fix implementation
- **Before/After Comparison:** Performance metrics comparison
- **Statistical Significance Testing:** Confidence in improvement measurement
- **Long-term Monitoring:** Extended observation for stability

**Success Metrics:**
- Problem recurrence rate < 5%
- Performance improvement > 80%
- User satisfaction > 90%
- System stability > 99.9%

---

## Progress Tracking and Status

### Current Status
- **Phase 1 (FIND):** ✅ Completed - Hypotheses generated
- **Phase 2 (PROVE):** 🔄 In Progress - Evidence collection ongoing
- **Phase 3 (EVIDENCE):** ⏳ Pending - Awaiting hypothesis validation
- **Phase 4 (FIX):** ⏳ Pending - Dependent on root cause determination

### Evidence Collection Status
- [ ] System logs collected and analyzed
- [ ] Performance metrics gathered
- [ ] Database performance data obtained
- [ ] Network traces captured
- [ ] Configuration analysis completed
- [ ] User activity logs reviewed
- [ ] External service data collected

### Hypothesis Validation Status
- [ ] Primary hypotheses tested against evidence
- [ ] Secondary hypotheses evaluated
- [ ] Root cause confidence score calculated
- [ ] Certainty threshold achieved

---

## Next Steps

### Immediate Actions (Next 1-2 hours)
1. [ ] Execute automated evidence collection scripts
2. [ ] Review system logs for error patterns
3. [ ] Analyze performance metrics for anomalies
4. [ ] Interview key personnel for additional context
5. [ ] Update analysis with initial findings

### Short-term Actions (Next 24 hours)
1. [ ] Complete comprehensive evidence collection
2. [ ] Perform detailed statistical analysis
3. [ ] Establish causal relationships
4. [ ] Validate root cause with certainty threshold
5. [ ] Develop initial fix recommendations

### Long-term Actions (Next 1-2 weeks)
1. [ ] Implement permanent fixes
2. [ ] Validate fix effectiveness
3. [ ] Update monitoring and alerting
4. [ ] Document lessons learned
5. [ ] Implement preventive measures

---

## Quality Assurance

### Review Checklist
- [ ] Problem statement clearly defined
- [ ] All reasonable hypotheses considered
- [ ] Evidence collection comprehensive and systematic
- [ ] Causal relationships properly established
- [ ] Root cause determined with required certainty
- [ ] Solutions address root cause directly
- [ ] Fix validation plan comprehensive
- [ ] Preventive measures implemented

### Confidence Assessment
- **Problem Definition:** 95% confidence
- **Hypothesis Coverage:** 85% confidence
- **Evidence Completeness:** TBD (collection ongoing)
- **Root Cause Determination:** TBD (analysis ongoing)
- **Solution Effectiveness:** TBD (implementation pending)

---

**This FPEF analysis report will be continuously updated as evidence is collected and analyzed.**

**Generated by FPEF Evidence Analyzer**
**Framework Version:** 1.0
**Last Updated:** $(date +"%Y-%m-%d %H:%M:%S")
EOF

# Generate evidence collection script
cat > "$OUTPUT_DIR/collect-evidence-$TIMESTAMP.sh" << 'EOF'
#!/bin/bash

# FPEF Evidence Collection Script
# Automated collection of system evidence for analysis

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EVIDENCE_DIR="$1"

if [ -z "$EVIDENCE_DIR" ]; then
    EVIDENCE_DIR="./fpef-evidence-$TIMESTAMP"
fi

mkdir -p "$EVIDENCE_DIR"/{logs,metrics,database,network,config}

echo "🔍 FPEF Evidence Collection Starting..."
echo "📁 Output directory: $EVIDENCE_DIR"

# Function to collect system logs
collect_system_logs() {
    echo "📋 Collecting system logs..."

    # Application logs (if available)
    if [ -d "/var/log" ]; then
        sudo cp -r /var/log/*.log "$EVIDENCE_DIR/logs/" 2>/dev/null || true
    fi

    # Docker logs (if available)
    if command -v docker &> /dev/null; then
        docker logs $(docker ps -q) > "$EVIDENCE_DIR/logs/docker.log" 2>&1 || true
    fi

    # System journal (if available)
    if command -v journalctl &> /dev/null; then
        journalctl --since "1 hour ago" > "$EVIDENCE_DIR/logs/systemd.log" 2>&1 || true
    fi
}

# Function to collect performance metrics
collect_performance_metrics() {
    echo "📊 Collecting performance metrics..."

    # CPU and memory usage
    top -b -n 1 > "$EVIDENCE_DIR/metrics/system-resources.log" 2>&1 || true

    # Disk usage
    df -h > "$EVIDENCE_DIR/metrics/disk-usage.log" 2>&1 || true

    # Network connections
    netstat -tuln > "$EVIDENCE_DIR/metrics/network-connections.log" 2>&1 || true

    # Process information
    ps aux > "$EVIDENCE_DIR/metrics/processes.log" 2>&1 || true
}

# Function to collect database information (if applicable)
collect_database_info() {
    echo "🗄️ Collecting database information..."

    # MySQL information (if available)
    if command -v mysql &> /dev/null; then
        mysql -e "SHOW PROCESSLIST;" > "$EVIDENCE_DIR/database/mysql-processes.log" 2>&1 || true
        mysql -e "SHOW STATUS;" > "$EVIDENCE_DIR/database/mysql-status.log" 2>&1 || true
    fi

    # PostgreSQL information (if available)
    if command -v psql &> /dev/null; then
        PGPASSWORD= psql -c "SELECT * FROM pg_stat_activity;" > "$EVIDENCE_DIR/database/postgres-processes.log" 2>&1 || true
    fi
}

# Function to collect network information
collect_network_info() {
    echo "🌐 Collecting network information..."

    # Network interface statistics
    cat /proc/net/dev > "$EVIDENCE_DIR/network/interface-stats.log" 2>&1 || true

    # Routing table
    route -n > "$EVIDENCE_DIR/network/routing-table.log" 2>&1 || true

    # DNS resolution
    nslookup google.com > "$EVIDENCE_DIR/network/dns-resolution.log" 2>&1 || true

    # Network latency
    ping -c 10 8.8.8.8 > "$EVIDENCE_DIR/network/latency-test.log" 2>&1 || true
}

# Function to collect configuration information
collect_config_info() {
    echo "⚙️ Collecting configuration information..."

    # Environment variables
    env > "$EVIDENCE_DIR/config/environment-variables.log" 2>&1 || true

    # System information
    uname -a > "$EVIDENCE_DIR/config/system-info.log" 2>&1 || true

    # Installed packages (if available)
    if command -v dpkg &> /dev/null; then
        dpkg -l > "$EVIDENCE_DIR/config/installed-packages.log" 2>&1 || true
    elif command -v rpm &> /dev/null; then
        rpm -qa > "$EVIDENCE_DIR/config/installed-packages.log" 2>&1 || true
    fi
}

# Execute collection functions
collect_system_logs
collect_performance_metrics
collect_database_info
collect_network_info
collect_config_info

echo ""
echo "✅ Evidence collection completed!"
echo ""
echo "📁 Collected evidence:"
echo "   • System logs: $EVIDENCE_DIR/logs/"
echo "   • Performance metrics: $EVIDENCE_DIR/metrics/"
echo "   • Database info: $EVIDENCE_DIR/database/"
echo "   • Network info: $EVIDENCE_DIR/network/"
echo "   • Configuration: $EVIDENCE_DIR/config/"
echo ""
echo "🚀 Ready for FPEF analysis!"
EOF

chmod +x "$OUTPUT_DIR/collect-evidence-$TIMESTAMP.sh"

echo ""
echo -e "${GREEN}✅ FPEF analysis framework generated successfully!${NC}"
echo ""
echo -e "📄 Generated files:"
echo -e "   • Main Analysis: $ANALYSIS_FILE"
echo -e "   • Evidence Collection: $OUTPUT_DIR/collect-evidence-$TIMESTAMP.sh"
echo ""
echo -e "${BLUE}🎯 Analysis Status:${NC}"
echo -e "   • Phase 1 (FIND): ✅ ${GREEN}Completed${NC}"
echo -e "   • Phase 2 (PROVE): 🔄 ${YELLOW}Evidence Collection Required${NC}"
echo -e "   • Phase 3 (EVIDENCE): ⏳ ${YELLOW}Pending${NC}"
echo -e "   • Phase 4 (FIX): ⏳ ${YELLOW}Pending${NC}"
echo ""
echo -e "${PURPLE}🚀 Next Steps:${NC}"
echo -e "   1. Execute evidence collection: $OUTPUT_DIR/collect-evidence-$TIMESTAMP.sh"
echo -e "   2. Review collected evidence in $OUTPUT_DIR/"
echo -e "   3. Update analysis with evidence findings"
echo -e "   4. Validate hypotheses and establish root cause"
echo -e "   5. Implement targeted fixes based on analysis"
echo ""
echo -e "${GREEN}🔍 Your FPEF analysis framework is ready for evidence collection and root cause determination!${NC}"