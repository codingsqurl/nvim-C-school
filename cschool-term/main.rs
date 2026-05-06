//! C-SCHOOL Terminal Backend v0.2.0
//! Real PTY bash sessions via WebSocket + xterm.js frontend.
//! No more fake JavaScript shell — actual Linux terminal.

use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_ws::Message;
use log::{error, info};
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use uuid::Uuid;

// ── Session types ────────────────────────────────────────

struct TermSession {
    id: String,
    kill_tx: broadcast::Sender<()>,
    created: u64,
}

struct PtyHandles {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    _child: Box<dyn portable_pty::Child + Send + Sync>,
}

struct AppState {
    sessions: Mutex<HashMap<String, Arc<Mutex<PtyHandles>>>>,
    meta: Mutex<HashMap<String, TermSession>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
            meta: Mutex::new(HashMap::new()),
        }
    }
}

// ── API types ────────────────────────────────────────────

#[derive(Serialize)]
struct SessionResponse {
    id: String,
    active: bool,
    created: u64,
}

#[derive(Deserialize)]
struct CreateSessionRequest {
    user_id: Option<String>,
}

#[derive(Deserialize, Debug)]
struct ResizeRequest {
    cols: u16,
    rows: u16,
}

// ── Profile types ────────────────────────────────────────

#[derive(Deserialize, Serialize, Clone)]
struct UserProfile {
    id: String,
    username: String,
    created: u64,
    last_active: u64,
    colorscheme_index: usize,
    stats: UserStats,
}

#[derive(Deserialize, Serialize, Clone)]
struct UserStats {
    commands_executed: u64,
    sessions_started: u64,
    time_spent: u64,
    topics_completed: Vec<String>,
    command_history: Vec<HistoryEntry>,
    current_dir: String,
    login_time: u64,
}

#[derive(Deserialize, Serialize, Clone)]
struct HistoryEntry {
    cmd: String,
    timestamp: u64,
    dir: String,
}

impl Default for UserProfile {
    fn default() -> Self {
        Self {
            id: format!(
                "{:x}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis()
            ),
            username: "c-student".into(),
            created: now_ms(),
            last_active: now_ms(),
            colorscheme_index: 0,
            stats: UserStats {
                commands_executed: 0,
                sessions_started: 0,
                time_spent: 0,
                topics_completed: vec![],
                command_history: vec![],
                current_dir: "~".into(),
                login_time: now_ms(),
            },
        }
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

fn home_dir() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("/tmp"))
}

fn profile_path(id: &str) -> PathBuf {
    home_dir()
        .join(".c-school")
        .join("profiles")
        .join(format!("{}.json", id))
}

fn ensure_profile_dir() -> std::io::Result<()> {
    fs::create_dir_all(home_dir().join(".c-school").join("profiles"))
}

fn save_profile(profile: &UserProfile) -> std::io::Result<()> {
    ensure_profile_dir()?;
    let path = profile_path(&profile.id);
    let json = serde_json::to_string_pretty(profile)?;
    fs::write(path, json)
}

fn load_profile(id: &str) -> Option<UserProfile> {
    let path = profile_path(id);
    if path.exists() {
        if let Ok(data) = fs::read_to_string(path) {
            return serde_json::from_str(&data).ok();
        }
    }
    None
}

// ── PTY spawn ────────────────────────────────────────────

fn spawn_pty() -> Result<(TermSession, PtyHandles), Box<dyn std::error::Error>> {
    let pty_system = native_pty_system();
    let size = PtySize {
        rows: 30,
        cols: 100,
        pixel_width: 0,
        pixel_height: 0,
    };
    let pair = pty_system.openpty(size)?;

    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".into());
    let user = std::env::var("USER").unwrap_or_else(|_| "c-student".into());

    let mut cmd = CommandBuilder::new("bash");
    cmd.env("TERM", "xterm-256color");
    cmd.env("HOME", &home);
    cmd.env("USER", &user);
    cmd.env("SHELL", "/bin/bash");
    cmd.env("PS1", "\\[\\e[32m\\]c-school@academy\\[\\e[0m\\]:\\[\\e[34m\\]\\w\\[\\e[0m\\]\\$ ");
    cmd.cwd(&home);
    cmd.args(&["--login", "-i"]);

    let child = pair.slave.spawn_command(cmd)?;

    let writer = pair.master.take_writer()?;

    let handles = PtyHandles {
        master: pair.master,
        writer,
        _child: child,
    };

    let id = Uuid::new_v4().to_string();
    let (kill_tx, _) = broadcast::channel(1);

    let session = TermSession {
        id,
        kill_tx,
        created: now_ms(),
    };

    Ok((session, handles))
}

fn resize_pty(master: &dyn MasterPty, cols: u16, rows: u16) {
    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };
    if let Err(e) = master.resize(size) {
        error!("PTY resize failed: {}", e);
    }
}

// ── HTTP handlers ─────────────────────────────────────────

async fn index() -> HttpResponse {
    let content = fs::read_to_string("../index.html")
        .unwrap_or_else(|_| "<h1>index.html not found</h1>".into());
    HttpResponse::Ok()
        .content_type("text/html")
        .body(content)
}

async fn terminal_page() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html")
        .body(include_str!("frontend.html"))
}

async fn serve_static(path: web::Path<String>) -> HttpResponse {
    let file_path = format!("../{}", path.as_str());
    match fs::read(&file_path) {
        Ok(data) => {
            let ct = if path.ends_with(".css") {
                "text/css"
            } else if path.ends_with(".js") {
                "application/javascript"
            } else if path.ends_with(".html") {
                "text/html"
            } else if path.ends_with(".svg") {
                "image/svg+xml"
            } else if path.ends_with(".png") {
                "image/png"
            } else if path.ends_with(".woff2") {
                "font/woff2"
            } else {
                "application/octet-stream"
            };
            HttpResponse::Ok().content_type(ct).body(data)
        }
        Err(_) => HttpResponse::NotFound().body("Not found"),
    }
}

async fn create_session(
    req: web::Json<CreateSessionRequest>,
    data: web::Data<AppState>,
) -> impl Responder {
    match spawn_pty() {
        Ok((session, handles)) => {
            let id = session.id.clone();
            let created = session.created;

            if let Some(ref uid) = req.user_id {
                if let Some(mut profile) = load_profile(uid) {
                    profile.stats.sessions_started += 1;
                    profile.stats.login_time = now_ms();
                    profile.last_active = now_ms();
                    let _ = save_profile(&profile);
                }
            }

            data.sessions
                .lock()
                .unwrap()
                .insert(id.clone(), Arc::new(Mutex::new(handles)));
            data.meta.lock().unwrap().insert(id.clone(), session);

            info!("Session {} created", id);
            HttpResponse::Ok().json(SessionResponse {
                id,
                active: true,
                created,
            })
        }
        Err(e) => {
            error!("Failed to spawn PTY: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to create session: {}", e)
            }))
        }
    }
}

async fn term_status(data: web::Data<AppState>) -> impl Responder {
    let meta = data.meta.lock().unwrap();
    let list: Vec<SessionResponse> = meta
        .values()
        .map(|s| SessionResponse {
            id: s.id.clone(),
            active: true,
            created: s.created,
        })
        .collect();
    HttpResponse::Ok().json(list)
}

async fn kill_session(
    path: web::Path<String>,
    data: web::Data<AppState>,
) -> impl Responder {
    let id = path.into_inner();
    let mut sessions = data.sessions.lock().unwrap();
    let mut meta = data.meta.lock().unwrap();

    if let Some(handles) = sessions.remove(&id) {
        let mut h = handles.lock().unwrap();
        let _ = h.writer.write_all(b"\x03");
        let _ = h.writer.write_all(b"exit\n");
    }
    if let Some(session) = meta.remove(&id) {
        let _ = session.kill_tx.send(());
    }
    HttpResponse::Ok().json(serde_json::json!({"status": "killed", "id": id}))
}

// ── WebSocket handler ─────────────────────────────────────

async fn ws_handler(
    path: web::Path<String>,
    req: HttpRequest,
    stream: web::Payload,
    data: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    let session_id = path.into_inner();
    info!("WS connecting for session: {}", session_id);

    // Look up session BEFORE accepting the WebSocket
    let handles_arc = {
        let sessions = data.sessions.lock().unwrap();
        sessions.get(&session_id).cloned()
    };

    let kill_rx = {
        let meta = data.meta.lock().unwrap();
        meta.get(&session_id)
            .map(|s| s.kill_tx.subscribe())
    };

    let handles_arc = match handles_arc {
        Some(h) => h,
        None => {
            return Ok(HttpResponse::NotFound()
                .content_type("text/plain")
                .body("Session not found. Create one via POST /api/session"));
        }
    };

    let kill_rx = match kill_rx {
        Some(rx) => rx,
        None => {
            return Ok(HttpResponse::NotFound()
                .content_type("text/plain")
                .body("Session metadata not found"));
        }
    };

    // Accept WebSocket
    let (response, mut ws_session, mut msg_stream) = actix_ws::handle(&req, stream)?;

    // Clone reader for the PTY read task
    let mut reader = {
        let h = handles_arc.lock().unwrap();
        h.master.try_clone_reader().map_err(|e| {
            actix_web::error::ErrorInternalServerError(e.to_string())
        })?
    };

    info!("WebSocket connected to session {}", session_id);

    let write_handles = handles_arc.clone();
    let resize_handles = handles_arc.clone();
    let data_clone = data.clone();
    let sid = session_id.clone();

    // Spawn all WebSocket processing into actix runtime
    actix_web::rt::spawn(async move {
        // PTY read → WS channel
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<Vec<u8>>();
        let read_sid = sid.clone();

        tokio::task::spawn_blocking(move || {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        if tx.send(buf[..n].to_vec()).is_err() {
                            break;
                        }
                    }
                    Err(e) => {
                        error!("PTY read error in {}: {}", read_sid, e);
                        break;
                    }
                }
            }
        });

        let mut ws_clone = ws_session.clone();
        let tx_handle = tokio::spawn(async move {
            while let Some(data) = rx.recv().await {
                if ws_clone.binary(data).await.is_err() {
                    break;
                }
            }
        });

        // Main message loop
        let mut kill_rx = kill_rx;
        loop {
            tokio::select! {
                msg = msg_stream.recv() => {
                    match msg {
                        Some(Ok(Message::Binary(data))) => {
                            let mut h = write_handles.lock().unwrap();
                            let _ = h.writer.write_all(&data);
                        }
                        Some(Ok(Message::Text(text))) => {
                            if let Ok(ctrl) = serde_json::from_str::<ResizeRequest>(&text) {
                                let h = resize_handles.lock().unwrap();
                                resize_pty(&*h.master, ctrl.cols, ctrl.rows);
                            } else {
                                let mut h = write_handles.lock().unwrap();
                                let _ = h.writer.write_all(text.as_bytes());
                            }
                        }
                        Some(Ok(Message::Ping(bytes))) => {
                            let _ = ws_session.pong(&bytes).await;
                        }
                        Some(Ok(Message::Close(_))) | None => {
                            info!("WS client disconnected from {}", sid);
                            break;
                        }
                        Some(Ok(_)) => {}
                        Some(Err(e)) => {
                            error!("WS error: {}", e);
                            break;
                        }
                    }
                }
                _ = kill_rx.recv() => {
                    info!("Session {} killed via API", sid);
                    let _ = ws_session.clone().close(None).await;
                    break;
                }
            }
        }

        tx_handle.abort();
        // Session cleanup already handled in break paths above

        // Cleanup
        data_clone.sessions.lock().unwrap().remove(&sid);
        data_clone.meta.lock().unwrap().remove(&sid);
        info!("Session {} cleaned up", sid);
    });

    // Return the 101 handshake response immediately
    Ok(response)
}

// ── Profile API ──────────────────────────────────────────

#[derive(Deserialize)]
struct ProfilePayload {
    profile: UserProfile,
}

async fn save_profile_handler(body: web::Json<ProfilePayload>) -> impl Responder {
    match save_profile(&body.profile) {
        Ok(()) => HttpResponse::Ok().json(serde_json::json!({"status": "ok"})),
        Err(e) => HttpResponse::InternalServerError()
            .body(format!("Failed to save profile: {}", e)),
    }
}

async fn load_profile_handler(path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    match load_profile(&id) {
        Some(profile) => HttpResponse::Ok().json(profile),
        None => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "profile not found"})),
    }
}

// ── Main ──────────────────────────────────────────────────

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    println!("╔══════════════════════════════════════════╗");
    println!("║   C-SCHOOL Terminal Server v0.2.0        ║");
    println!("║   Real PTY bash via WebSocket            ║");
    println!("║   http://localhost:8080                   ║");
    println!("╚══════════════════════════════════════════╝");

    let _ = ensure_profile_dir();

    let app_state = web::Data::new(AppState::default());

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/", web::get().to(index))
            .route("/terminal", web::get().to(terminal_page))
            .route("/assets/{path:.*}", web::get().to(serve_static))
            .route("/api/session", web::post().to(create_session))
            .route("/api/status", web::get().to(term_status))
            .route("/api/session/{session_id}", web::delete().to(kill_session))
            .route("/api/ws/{session_id}", web::get().to(ws_handler))
            .route("/api/profile/save", web::post().to(save_profile_handler))
            .route("/api/profile/{id}", web::get().to(load_profile_handler))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
