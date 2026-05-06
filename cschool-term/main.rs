//! C-SCHOOL Terminal Backend
//! A Rust-based terminal server with shell command execution.

use std::collections::HashMap;
use std::process::Command;
use std::sync::Mutex;

use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

/// Represents a terminal session
#[derive(Clone)]
struct TermSession {
    id: String,
    working_dir: String,
    history: Vec<String>,
}

/// App state managing terminal sessions
struct AppState {
    sessions: Mutex<HashMap<String, TermSession>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Serialize)]
struct SessionResponse {
    id: String,
    working_dir: String,
    output: String,
    active: bool,
    prompt: String,
}

#[derive(Deserialize)]
struct CommandRequest {
    session_id: String,
    command: String,
}

/// Serve static HTML frontend
async fn index() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html")
        .body(include_str!("frontend.html"))
}

/// Get terminal status
async fn term_status(data: web::Data<AppState>) -> impl Responder {
    let sessions = data.sessions.lock().unwrap();
    let session_list: Vec<_> = sessions.values()
        .map(|s| SessionResponse {
            id: s.id.clone(),
            working_dir: s.working_dir.clone(),
            output: String::new(),
            active: true,
            prompt: format!("{}@c-school:~$ ", 
                std::env::var("USER").unwrap_or_else(|_| "user"))
            ),
        })
        .collect();
    
    serde_json::to_string(&session_list).unwrap_or_default()
}

/// Execute a command in a session
async fn exec_command(
    req: web::Json<CommandRequest>,
    data: web::Data<AppState>,
) -> impl Responder {
    let mut sessions = data.sessions.lock().unwrap();
    
    // Get or create session
    let session = sessions.entry(req.session_id.clone())
        .or_insert_with(|| TermSession {
            id: req.session_id.clone(),
            working_dir: std::env::var("HOME").unwrap_or_else(|_| "/home".to_string()),
            history: Vec::new(),
        });
    
    let output = execute_shell_command(&req.command, &session.working_dir);
    
    // Update history
    if !req.command.is_empty() {
        session.history.push(req.command.clone());
    }
    
    // Handle cd command specially
    if req.command.starts_with("cd ") {
        let new_dir = req.command.trim_start_matches("cd ").trim();
        if new_dir.starts_with('/') {
            session.working_dir = new_dir.to_string();
        } else if new_dir == ".." {
            if let Some(parent) = std::path::Path::new(&session.working_dir).parent() {
                session.working_dir = parent.to_string_lossy().to_string();
            }
        } else if new_dir == "~" {
            session.working_dir = std::env::var("HOME").unwrap_or_else(|_| "/home".to_string());
        } else {
            session.working_dir = format!("{}/{}", 
                session.working_dir.trim_end_matches('/'), 
                new_dir
            );
        }
    }
    
    let prompt = format!("{}@c-school:{}~$ ", 
        std::env::var("USER").unwrap_or_else(|_| "user"),
        session.working_dir.replace(&*std::env::var("HOME").unwrap_or_else(|_| "/home"), "~")
    );
    
    SessionResponse {
        id: session.id.clone(),
        working_dir: session.working_dir.clone(),
        output,
        active: true,
        prompt,
    }
}

/// Execute a shell command and return output
fn execute_shell_command(command: &str, cwd: &str) -> String {
    use std::os::unix::process::CommandExt;
    
    if command.trim().is_empty() {
        return String::new();
    }
    
    // Handle built-in commands
    match command.split_whitespace().next() {
        Some("exit") | Some("logout") => return "logout\n".to_string(),
        Some("clear") | Some("cls") => return "\x1b[2J\x1b[H".to_string(),
        Some("pwd") => return format!("{}\n", cwd),
        Some("whoami") => return format!("{}\n", 
            std::env::var("USER").unwrap_or_else(|_| "c-school-user")
        )),
        Some("date") => {
            use std::time::SystemTime;
            let now = SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap();
            return format!("{}\n", now.as_secs());
        },
        Some("hostname") => return "c-school.local\n".to_string(),
        Some("uname") => return "Linux c-school.local 6.8.7-arch1-1 #1 SMP x86_64 GNU/Linux\n".to_string(),
        Some("id") => return "uid=1000(c-school) gid=1000(c-school) groups=1000(c-school)\n".to_string(),
        Some("echo") => format!("{}\n", command.trim_start_matches("echo").trim()),
        Some("printf") => format!("{}\n", command.trim_start_matches("printf").trim()),
        Some("type") => {
            let cmd = command.split_whitespace().nth(1).unwrap_or("");
            return format!("{} is a shell builtin\n", cmd);
        },
        _ => {}
    }
    
    // Run external command via shell
    let full_cmd = format!("cd {} && {}", cwd, command);
    let output = Command::new("sh")
        .arg("-c")
        .arg(&full_cmd)
        .output();
    
    match output {
        Ok(out) => {
            let mut result = String::from_utf8_lossy(&out.stdout).to_string();
            if !out.status.success() && !out.stderr.is_empty() {
                result.push_str(&String::from_utf8_lossy(&out.stderr));
            }
            result
        }
        Err(e) => format!("sh: {}: command not found\n", e),
    }
}

/// Create new session
async fn create_session(data: web::Data<AppState>) -> impl Responder {
    let mut sessions = data.sessions.lock().unwrap();
    let session_id = format!("{:x}", 
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap().as_millis()
    );
    
    let working_dir = std::env::var("HOME").unwrap_or_else(|_| "/home".to_string());
    let prompt = format!("{}@c-school:~$ ", 
        std::env::var("USER").unwrap_or_else(|_| "user")
    );
    
    sessions.insert(session_id.clone(), TermSession {
        id: session_id.clone(),
        working_dir,
        history: Vec::new(),
    });
    
    SessionResponse {
        id: session_id,
        working_dir: std::env::var("HOME").unwrap_or_else(|_| "/home".to_string()),
        output: String::new(),
        active: true,
        prompt,
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting C-SCHOOL Terminal Server on http://localhost:8080");
    println!("Backend serving real shell commands!");
    
    HttpServer::new(|| {
        App::new()
            .app_data(web::Data::new(AppState::default()))
            .route("/", web::get().to(index))
            .route("/api/status", web::get().to(term_status))
            .route("/api/session", web::post().to(create_session))
            .route("/api/exec", web::post().to(exec_command))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}