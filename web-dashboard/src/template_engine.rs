use anyhow::Result;
use once_cell::sync::Lazy;
use std::sync::RwLock;
use tera::{Context, Tera};

// Global template engine
pub static TEMPLATES: Lazy<RwLock<Tera>> = Lazy::new(|| {
    eprintln!("Current working directory: {:?}", std::env::current_dir());
    eprintln!("Looking for templates at: templates/**/*");
    
    let mut tera = match Tera::new("templates/**/*.html") {
        Ok(t) => {
            eprintln!("Successfully loaded templates from: templates/**/*.html");
            t
        },
        Err(e) => {
            eprintln!("Template parsing error: {}", e);
            eprintln!("Trying alternative path: web-dashboard/templates/**/*.html");
            // Try alternative path
            match Tera::new("web-dashboard/templates/**/*.html") {
                Ok(t) => {
                    eprintln!("Successfully loaded templates from: web-dashboard/templates/**/*.html");
                    t
                },
                Err(e2) => {
                    eprintln!("Alternative template parsing error: {}", e2);
                    // Try simple glob pattern
                    match Tera::new("templates/*.html") {
                        Ok(t) => {
                            eprintln!("Successfully loaded templates from: templates/*.html");
                            t
                        },
                        Err(e3) => {
                            eprintln!("Final template parsing error: {}", e3);
                            Tera::default()
                        }
                    }
                }
            }
        }
    };
    
    // Register custom filters if needed
    tera.autoescape_on(vec!["html", "htm", "xml"]);
    
    RwLock::new(tera)
});

/// Render a template with the given context
pub fn render_template(template_name: &str, context: &Context) -> Result<String> {
    let templates = TEMPLATES.read().unwrap();
    
    // Debug: List available templates
    let template_names: Vec<&str> = templates.get_template_names().collect();
    if template_names.is_empty() {
        eprintln!("No templates loaded!");
        
        // Try to reload templates
        drop(templates);
        let mut templates_write = TEMPLATES.write().unwrap();
        
        // Try multiple paths
        let paths = vec!["templates/**/*.html", "web-dashboard/templates/**/*.html", "./templates/*.html"];
        for path in paths {
            match Tera::new(path) {
                Ok(t) => {
                    eprintln!("Reloaded templates from: {}", path);
                    *templates_write = t;
                    break;
                },
                Err(e) => {
                    eprintln!("Failed to reload from {}: {}", path, e);
                }
            }
        }
        drop(templates_write);
        
        // Try again with reloaded templates
        let templates = TEMPLATES.read().unwrap();
        let rendered = templates.render(template_name, context)?;
        return Ok(rendered);
    }
    
    let rendered = templates.render(template_name, context)?;
    Ok(rendered)
}

/// Initialize templates (call during startup)
pub fn init_templates() -> Result<()> {
    // Force lazy initialization
    let _ = &*TEMPLATES;
    Ok(())
}