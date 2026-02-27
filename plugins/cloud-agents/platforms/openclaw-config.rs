//! OpenClaw Integration for Multiplatform Autonomous Agent System
//!
//! This module provides OpenClaw specific adapters and configuration
//! for the Auto-Agent and Auto-Demo systems.
//!
//! ## Installation
//!
//! Add to your `Cargo.toml`:
//! ```toml
//! [dependencies]
//! auto-agent-multiplatform = { version = "1.0.0", features = ["openclaw"] }
//! ```
//!
//! ## Usage
//!
//! ```rust
//! use auto_agent_multiplatform::{AutoDemoSystem, ActionType};
//!
//! #[tokio::main]
//! async fn main() {
//!     let mut demo = AutoDemoSystem::new();
//!
//!     // Start recording
//!     demo.start_recording(RecordingConfig {
//!         name: "My Demo".to_string(),
//!         format: DemoFormat::Walkthrough,
//!         ..Default::default()
//!     });
//!
//!     // ... perform actions ...
//!     demo.record_action(ActionType::FileEdit, "src/main.rs", ActionData {
//!         before: Some("old content".to_string()),
//!         after: Some("new content".to_string()),
//!         ..Default::default()
//!     });
//!
//!     // Stop and export
//!     let result = demo.stop_recording();
//!     demo.export(&result, ExportOptions {
//!         format: ExportFormat::Html,
//!         output_path: "./demos".into(),
//!     }).await;
//! }
//! ```

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use tokio::fs;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ActionType {
    FileCreate,
    FileEdit,
    FileDelete,
    Command,
    Test,
    Git,
    Browser,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentRole {
    Architect,
    Frontend,
    Backend,
    Testing,
    Docs,
    Security,
    Devops,
    General,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DemoFormat {
    Walkthrough,
    Presentation,
    Video,
    Pdf,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DemoStyle {
    Tutorial,
    Overview,
    DeepDive,
    Showcase,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExportFormat {
    Html,
    Reveal,
    Marp,
    Slidev,
    Pdf,
    Video,
    Json,
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingConfig {
    pub name: String,
    pub format: DemoFormat,
    pub style: DemoStyle,
    pub output_path: PathBuf,
    pub capture_terminal: bool,
    pub capture_browser: bool,
    pub enable_narration: bool,
    pub exclude_patterns: Vec<String>,
}

impl Default for RecordingConfig {
    fn default() -> Self {
        Self {
            name: "Untitled Demo".to_string(),
            format: DemoFormat::Walkthrough,
            style: DemoStyle::Tutorial,
            output_path: PathBuf::from("./demos"),
            capture_terminal: true,
            capture_browser: false,
            enable_narration: false,
            exclude_patterns: vec!["node_modules/**".to_string(), "*.log".to_string()],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordedAction {
    pub id: String,
    pub timestamp: u64,
    pub action_type: ActionType,
    pub target: String,
    pub before: Option<String>,
    pub after: Option<String>,
    pub command: Option<String>,
    pub output: Option<String>,
    pub explanation: Option<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Annotation {
    pub id: String,
    pub line_start: usize,
    pub line_end: usize,
    pub text: String,
    pub annotation_type: AnnotationType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnnotationType {
    Info,
    Warning,
    Success,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoStep {
    pub id: String,
    pub order: usize,
    pub title: String,
    pub description: String,
    pub actions: Vec<RecordedAction>,
    pub code: Option<String>,
    pub language: Option<String>,
    pub annotations: Vec<Annotation>,
    pub navigation: StepNavigation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepNavigation {
    pub previous: Option<String>,
    pub next: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoMetadata {
    pub total_duration_ms: u64,
    pub files_changed: Vec<String>,
    pub commands_run: usize,
    pub tests_passed: usize,
    pub tests_failed: usize,
    pub platform: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Demo {
    pub id: String,
    pub config: RecordingConfig,
    pub status: DemoStatus,
    pub steps: Vec<DemoStep>,
    pub metadata: DemoMetadata,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DemoStatus {
    Recording,
    Processing,
    Ready,
    Exporting,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionData {
    pub before: Option<String>,
    pub after: Option<String>,
    pub command: Option<String>,
    pub output: Option<String>,
}

impl Default for ActionData {
    fn default() -> Self {
        Self {
            before: None,
            after: None,
            command: None,
            output: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    pub format: ExportFormat,
    pub output_path: PathBuf,
    pub theme: Option<String>,
    pub include_narration: bool,
}

// ============================================================================
// OPENCLAW ADAPTER
// ============================================================================

pub struct OpenClawAdapter {
    name: &'static str,
}

impl OpenClawAdapter {
    pub fn new() -> Self {
        Self { name: "openclaw" }
    }

    /// Execute a shell command
    pub async fn execute_command(&self, command: &str, args: &[&str]) -> CommandResult {
        let output = Command::new(command)
            .args(args)
            .output();

        match output {
            Ok(output) => CommandResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                exit_code: output.status.code().unwrap_or(-1),
                success: output.status.success(),
            },
            Err(e) => CommandResult {
                stdout: String::new(),
                stderr: e.to_string(),
                exit_code: -1,
                success: false,
            },
        }
    }

    /// Read file contents
    pub async fn read_file(&self, path: &Path) -> std::io::Result<String> {
        let mut file = fs::File::open(path).await?;
        let mut contents = String::new();
        file.read_to_string(&mut contents).await?;
        Ok(contents)
    }

    /// Write content to file
    pub async fn write_file(&self, path: &Path, content: &str) -> std::io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await?;
        }
        let mut file = fs::File::create(path).await?;
        file.write_all(content.as_bytes()).await?;
        Ok(())
    }

    /// Delete a file
    pub async fn delete_file(&self, path: &Path) -> std::io::Result<()> {
        fs::remove_file(path).await
    }

    /// Get current git reference
    pub async fn get_git_ref(&self) -> Option<String> {
        let result = self.execute_command("git", &["rev-parse", "HEAD"]).await;
        if result.success {
            Some(result.stdout.trim().to_string())
        } else {
            None
        }
    }

    /// Detect language from file extension
    pub fn detect_language(&self, path: &Path) -> &str {
        match path.extension().and_then(|e| e.to_str()) {
            Some("ts") => "typescript",
            Some("tsx") => "typescript",
            Some("js") => "javascript",
            Some("jsx") => "javascript",
            Some("py") => "python",
            Some("rb") => "ruby",
            Some("go") => "go",
            Some("rs") => "rust",
            Some("java") => "java",
            Some("kt") => "kotlin",
            Some("swift") => "swift",
            Some("c") => "c",
            Some("cpp") => "cpp",
            Some("css") => "css",
            Some("scss") => "scss",
            Some("html") => "html",
            Some("json") => "json",
            Some("yaml") | Some("yml") => "yaml",
            Some("md") => "markdown",
            Some("sh") => "bash",
            _ => "plaintext",
        }
    }
}

pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub success: bool,
}

// ============================================================================
// DEMO RECORDER
// ============================================================================

pub struct DemoRecorder {
    config: RecordingConfig,
    actions: Vec<RecordedAction>,
    is_recording: bool,
    start_time: Option<Instant>,
    start_timestamp: Option<u64>,
    action_counter: usize,
}

impl DemoRecorder {
    pub fn new(config: RecordingConfig) -> Self {
        Self {
            config,
            actions: Vec::new(),
            is_recording: false,
            start_time: None,
            start_timestamp: None,
            action_counter: 0,
        }
    }

    pub fn start(&mut self) {
        self.is_recording = true;
        self.start_time = Some(Instant::now());
        self.start_timestamp = Some(SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64);
        self.actions.clear();
        self.action_counter = 0;
    }

    pub fn stop(&mut self) -> Demo {
        self.is_recording = false;
        let steps = self.group_actions_into_steps();
        let metadata = self.calculate_metadata();

        Demo {
            id: format!("demo-{}", SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis()),
            config: self.config.clone(),
            status: DemoStatus::Ready,
            steps,
            metadata,
            created_at: self.start_timestamp.unwrap_or(0),
            updated_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        }
    }

    pub fn record_file_action(
        &mut self,
        action_type: ActionType,
        target: &str,
        before: Option<String>,
        after: Option<String>,
    ) {
        if !self.is_recording {
            return;
        }

        self.action_counter += 1;
        self.actions.push(RecordedAction {
            id: format!("action-{}", self.action_counter),
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            action_type,
            target: target.to_string(),
            before,
            after,
            command: None,
            output: None,
            explanation: None,
            duration_ms: self.start_time.map(|t| t.elapsed().as_millis() as u64).unwrap_or(0),
        });
    }

    pub fn record_command(&mut self, command: &str, output: &str) {
        if !self.is_recording {
            return;
        }

        self.action_counter += 1;
        self.actions.push(RecordedAction {
            id: format!("action-{}", self.action_counter),
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            action_type: ActionType::Command,
            target: "terminal".to_string(),
            before: None,
            after: None,
            command: Some(command.to_string()),
            output: Some(output.to_string()),
            explanation: None,
            duration_ms: self.start_time.map(|t| t.elapsed().as_millis() as u64).unwrap_or(0),
        });
    }

    pub fn explain(&mut self, text: &str) {
        if let Some(last_action) = self.actions.last_mut() {
            last_action.explanation = Some(text.to_string());
        }
    }

    fn group_actions_into_steps(&self) -> Vec<DemoStep> {
        let mut steps = Vec::new();
        let mut current_step: Option<DemoStep> = None;
        let mut step_order = 0;

        for action in &self.actions {
            if action.action_type == ActionType::FileCreate || current_step.is_none() {
                if let Some(step) = current_step.take() {
                    steps.push(step);
                }
                step_order += 1;
                current_step = Some(DemoStep {
                    id: format!("step-{}", step_order),
                    order: step_order,
                    title: self.generate_step_title(action),
                    description: String::new(),
                    actions: Vec::new(),
                    code: None,
                    language: None,
                    annotations: Vec::new(),
                    navigation: StepNavigation {
                        previous: None,
                        next: None,
                    },
                });
            }

            if let Some(ref mut step) = current_step {
                step.actions.push(action.clone());

                if action.action_type == ActionType::FileEdit {
                    if let Some(ref after) = action.after {
                        step.code = Some(after.clone());
                        step.language = Some(self.detect_language(&action.target));
                    }
                }
            }
        }

        if let Some(step) = current_step {
            steps.push(step);
        }

        // Setup navigation
        for i in 0..steps.len() {
            if i > 0 {
                steps[i].navigation.previous = Some(steps[i - 1].id.clone());
            }
            if i < steps.len() - 1 {
                steps[i].navigation.next = Some(steps[i + 1].id.clone());
            }
        }

        steps
    }

    fn generate_step_title(&self, action: &RecordedAction) -> String {
        let filename = action.target.split('/').last().unwrap_or(&action.target);
        match action.action_type {
            ActionType::FileCreate => format!("Create {}", filename),
            ActionType::FileEdit => format!("Update {}", filename),
            ActionType::FileDelete => format!("Delete {}", filename),
            ActionType::Command => format!("Run: {}", action.command.as_ref().map(|c| c.split_whitespace().next().unwrap_or("Command")).unwrap_or("Command")),
            ActionType::Test => format!("Test: {}", action.target),
            ActionType::Git => format!("Git: {}", action.command.as_deref().unwrap_or("")),
            ActionType::Browser => "Browser Action".to_string(),
        }
    }

    fn detect_language(&self, target: &str) -> String {
        let adapter = OpenClawAdapter::new();
        adapter.detect_language(Path::new(target)).to_string()
    }

    fn calculate_metadata(&self) -> DemoMetadata {
        let mut files_changed = HashSet::new();
        let mut commands_run = 0;
        let mut tests_passed = 0;
        let mut tests_failed = 0;

        for action in &self.actions {
            match action.action_type {
                ActionType::FileEdit | ActionType::FileCreate => {
                    files_changed.insert(action.target.clone());
                }
                ActionType::Command => commands_run += 1,
                ActionType::Test => {
                    if action.command.as_deref() == Some("PASS") {
                        tests_passed += 1;
                    } else {
                        tests_failed += 1;
                    }
                }
                _ => {}
            }
        }

        DemoMetadata {
            total_duration_ms: self.start_time.map(|t| t.elapsed().as_millis() as u64).unwrap_or(0),
            files_changed: files_changed.into_iter().collect(),
            commands_run,
            tests_passed,
            tests_failed,
            platform: "openclaw".to_string(),
        }
    }
}

// ============================================================================
// DEMO EXPORTER
// ============================================================================

pub struct DemoExporter;

impl DemoExporter {
    pub async fn export(demo: &Demo, options: &ExportOptions) -> std::io::Result<PathBuf> {
        match options.format {
            ExportFormat::Html => Self::export_html(demo, options).await,
            ExportFormat::Json => Self::export_json(demo, options).await,
            ExportFormat::Reveal => Self::export_reveal(demo, options).await,
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::Unsupported,
                format!("Export format {:?} not yet supported", options.format),
            )),
        }
    }

    async fn export_html(demo: &Demo, options: &ExportOptions) -> std::io::Result<PathBuf> {
        let html = Self::generate_html(demo);
        let output_path = options.output_path.join(format!("{}.html", demo.config.name));
        fs::create_dir_all(&options.output_path).await?;

        let mut file = fs::File::create(&output_path).await?;
        file.write_all(html.as_bytes()).await?;

        Ok(output_path)
    }

    fn generate_html(demo: &Demo) -> String {
        let steps_html = demo.steps.iter().enumerate().map(|(i, step)| {
            format!(
                r#"<section class="step" id="step-{}">
      <h2>Step {}: {}</h2>
      {}
      {}
    </section>"#,
                i + 1,
                i + 1,
                step.title,
                step.code.as_ref().map(|c| format!(
                    r#"<pre><code class="language-{}">{}</code></pre>"#,
                    step.language.as_deref().unwrap_or("plaintext"),
                    html_escape(c)
                )).unwrap_or_default(),
                step.actions.first().and_then(|a| a.explanation.as_ref())
                    .map(|e| format!(r#"<p class="explanation">{}</p>"#, e))
                    .unwrap_or_default()
            )
        }).collect::<Vec<_>>().join("\n");

        let nav_html = demo.steps.iter().enumerate().map(|(i, step)| {
            format!(
                r#"<a href="#step-{}" class="{}">{}. {}</a>"#,
                i + 1,
                if i == 0 { "active" } else { "" },
                i + 1,
                step.title
            )
        }).collect::<Vec<_>>().join("\n    ");

        format!(
            r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <style>
    :root {{ --primary: #6366f1; --bg: #0f172a; --fg: #f1f5f9; --muted: #64748b; --card: #1e293b; --border: #334155; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--fg); }}
    nav {{ position: fixed; left: 0; top: 0; width: 250px; height: 100vh; background: var(--card); padding: 2rem; border-right: 1px solid var(--border); }}
    nav a {{ display: block; padding: 0.5rem; color: var(--muted); text-decoration: none; border-radius: 4px; }}
    nav a:hover, nav a.active {{ background: var(--primary); color: white; }}
    main {{ margin-left: 270px; padding: 2rem; }}
    .step {{ background: var(--card); border-radius: 8px; padding: 2rem; margin-bottom: 2rem; border: 1px solid var(--border); }}
    .step h2 {{ color: var(--primary); margin-bottom: 1rem; }}
    pre {{ background: #0d1117; border-radius: 8px; padding: 1rem; overflow-x: auto; }}
    code {{ font-family: 'JetBrains Mono', monospace; }}
    .explanation {{ margin-top: 1rem; color: var(--muted); }}
  </style>
</head>
<body>
  <nav><h3 style="margin-bottom: 1rem; color: var(--fg);">Steps</h3>{}</nav>
  <main><header><h1>{}</h1><p class="metadata">{} files | {} commands</p></header>{}</main>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>"#,
            demo.config.name,
            nav_html,
            demo.config.name,
            demo.metadata.files_changed.len(),
            demo.metadata.commands_run,
            steps_html
        )
    }

    async fn export_json(demo: &Demo, options: &ExportOptions) -> std::io::Result<PathBuf> {
        let json = serde_json::to_string_pretty(demo).unwrap();
        let output_path = options.output_path.join(format!("{}.json", demo.config.name));
        fs::create_dir_all(&options.output_path).await?;

        let mut file = fs::File::create(&output_path).await?;
        file.write_all(json.as_bytes()).await?;

        Ok(output_path)
    }

    async fn export_reveal(demo: &Demo, options: &ExportOptions) -> std::io::Result<PathBuf> {
        let steps_md = demo.steps.iter().enumerate().map(|(i, step)| {
            format!(
                "## Step {}: {}\n\n{}\n\n---",
                i + 1,
                step.title,
                step.code.as_ref().map(|c| format!(
                    "```{}\n{}\n```",
                    step.language.as_deref().unwrap_or(""),
                    c
                )).unwrap_or_default()
            )
        }).collect::<Vec<_>>().join("\n\n");

        let markdown = format!(
            r#"---
theme: black
---

# {}

{} files | {} commands

---

{}

# Thank You!"#,
            demo.config.name,
            demo.metadata.files_changed.len(),
            demo.metadata.commands_run,
            steps_md
        );

        let output_path = options.output_path.join(format!("{}-reveal.md", demo.config.name));
        fs::create_dir_all(&options.output_path).await?;

        let mut file = fs::File::create(&output_path).await?;
        file.write_all(markdown.as_bytes()).await?;

        Ok(output_path)
    }
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

// ============================================================================
// AUTO DEMO SYSTEM
// ============================================================================

pub struct AutoDemoSystem {
    platform: &'static str,
    adapter: OpenClawAdapter,
    recorder: Option<DemoRecorder>,
    exporter: DemoExporter,
}

impl AutoDemoSystem {
    pub fn new() -> Self {
        Self {
            platform: "openclaw",
            adapter: OpenClawAdapter::new(),
            recorder: None,
            exporter: DemoExporter,
        }
    }

    pub fn start_recording(&mut self, config: RecordingConfig) -> String {
        let mut recorder = DemoRecorder::new(config);
        recorder.start();
        let demo_id = format!("demo-{}", SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis());
        self.recorder = Some(recorder);
        demo_id
    }

    pub fn stop_recording(&mut self) -> Option<Demo> {
        self.recorder.as_mut().map(|r| r.stop())
    }

    pub fn record_action(&mut self, action_type: ActionType, target: &str, data: ActionData) {
        if let Some(ref mut recorder) = self.recorder {
            match action_type {
                ActionType::FileCreate | ActionType::FileEdit | ActionType::FileDelete => {
                    recorder.record_file_action(action_type, target, data.before, data.after);
                }
                ActionType::Command => {
                    recorder.record_command(
                        data.command.as_deref().unwrap_or(""),
                        data.output.as_deref().unwrap_or(""),
                    );
                }
                _ => {}
            }
        }
    }

    pub fn explain(&mut self, text: &str) {
        if let Some(ref mut recorder) = self.recorder {
            recorder.explain(text);
        }
    }

    pub async fn export(&self, demo: &Demo, options: &ExportOptions) -> std::io::Result<PathBuf> {
        DemoExporter::export(demo, options).await
    }
}

impl Default for AutoDemoSystem {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recording_workflow() {
        let config = RecordingConfig {
            name: "Test Demo".to_string(),
            ..Default::default()
        };

        let mut recorder = DemoRecorder::new(config);
        recorder.start();

        recorder.record_file_action(
            ActionType::FileCreate,
            "src/main.rs",
            None,
            Some("fn main() {}".to_string()),
        );

        recorder.explain("Created main function");

        let demo = recorder.stop();

        assert_eq!(demo.steps.len(), 1);
        assert_eq!(demo.steps[0].title, "Create main.rs");
    }

    #[tokio::test]
    async fn test_adapter_commands() {
        let adapter = OpenClawAdapter::new();
        let result = adapter.execute_command("echo", &["hello"]).await;
        assert!(result.success);
        assert!(result.stdout.contains("hello"));
    }
}
