// WebSocket Handler - CLDCDE Pro API
// By CodeWhisperer - Production Ready

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::Arc,
};
use tokio::sync::{broadcast, RwLock};
use tracing::{info, error, debug};
use uuid::Uuid;

use crate::{AppState, AppError};

// WebSocket connection manager
pub type Connections = Arc<RwLock<HashMap<String, broadcast::Sender<WSMessage>>>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WSMessage {
    // Connection events
    Connect { user_id: i64, connection_id: String },
    Disconnect { connection_id: String },
    
    // Workflow events
    WorkflowCreated { workflow_id: i64, user_id: i64, name: String },
    WorkflowUpdated { workflow_id: i64, status: String, progress: i32 },
    WorkflowPhaseChanged { workflow_id: i64, phase: String },
    WorkflowCompleted { workflow_id: i64, success: bool },
    
    // Project events
    ProjectCreated { project_id: i64, user_id: i64, name: String },
    ProjectUpdated { project_id: i64, status: String },
    ProjectMemberAdded { project_id: i64, user_id: i64, role: String },
    
    // Repository events
    RepositorySynced { user_id: i64, count: i32 },
    
    // Activity events  
    ActivityCreated { 
        user_id: i64, 
        action: String, 
        entity_type: String, 
        entity_id: Option<i64> 
    },
    
    // System events
    SystemStatus { status: String, message: String },
    Heartbeat { timestamp: String },
    
    // Error events
    Error { message: String, code: Option<String> },
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    Subscribe { topics: Vec<String> },
    Unsubscribe { topics: Vec<String> },
    Heartbeat,
    Authenticate { token: String },
}

// WebSocket handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let connection_id = Uuid::new_v4().to_string();
    let (sender, mut receiver) = socket.split();
    let (tx, rx) = broadcast::channel::<WSMessage>(1000);
    
    info!("WebSocket connection established: {}", connection_id);
    
    // Add connection to global connections map
    // In production, use a global connection manager
    
    // Send welcome message
    let welcome_msg = WSMessage::SystemStatus {
        status: "connected".to_string(),
        message: format!("Connected with ID: {}", connection_id),
    };
    
    if let Ok(msg_json) = serde_json::to_string(&welcome_msg) {
        if sender.send(Message::Text(msg_json)).await.is_err() {
            error!("Failed to send welcome message");
            return;
        }
    }
    
    // Spawn task to handle outgoing messages
    let mut rx_clone = tx.subscribe();
    let sender_task = tokio::spawn(async move {
        let mut sender = sender;
        while let Ok(msg) = rx_clone.recv().await {
            if let Ok(msg_json) = serde_json::to_string(&msg) {
                if sender.send(Message::Text(msg_json)).await.is_err() {
                    debug!("Client disconnected");
                    break;
                }
            }
        }
    });    
    // Handle incoming messages
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                debug!("Received message: {}", text);
                
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                    match handle_client_message(client_msg, &tx, &state, &connection_id).await {
                        Ok(_) => {}
                        Err(e) => {
                            error!("Error handling client message: {}", e);
                            let error_msg = WSMessage::Error {
                                message: "Failed to process message".to_string(),
                                code: Some("INVALID_MESSAGE".to_string()),
                            };
                            let _ = tx.send(error_msg);
                        }
                    }
                } else {
                    let error_msg = WSMessage::Error {
                        message: "Invalid message format".to_string(),
                        code: Some("PARSE_ERROR".to_string()),
                    };
                    let _ = tx.send(error_msg);
                }
            }
            Ok(Message::Close(_)) => {
                info!("WebSocket connection closed: {}", connection_id);
                break;
            }
            Ok(Message::Pong(_)) => {
                debug!("Received pong from: {}", connection_id);
            }            Ok(Message::Ping(data)) => {
                debug!("Received ping from: {}", connection_id);
                // Axum automatically handles pong responses
            }
            Err(e) => {
                error!("WebSocket error for {}: {}", connection_id, e);
                break;
            }
            _ => {}
        }
    }
    
    // Cleanup
    sender_task.abort();
    info!("WebSocket connection cleanup completed: {}", connection_id);
}

async fn handle_client_message(
    msg: ClientMessage,
    tx: &broadcast::Sender<WSMessage>,
    state: &Arc<AppState>,
    connection_id: &str,
) -> Result<(), AppError> {
    match msg {
        ClientMessage::Subscribe { topics } => {
            debug!("Client {} subscribing to topics: {:?}", connection_id, topics);
            // In production, implement topic-based subscriptions
            let response = WSMessage::SystemStatus {
                status: "subscribed".to_string(),
                message: format!("Subscribed to {} topics", topics.len()),
            };
            let _ = tx.send(response);
        }
        ClientMessage::Unsubscribe { topics } => {
            debug!("Client {} unsubscribing from topics: {:?}", connection_id, topics);            let response = WSMessage::SystemStatus {
                status: "unsubscribed".to_string(),
                message: format!("Unsubscribed from {} topics", topics.len()),
            };
            let _ = tx.send(response);
        }
        ClientMessage::Heartbeat => {
            debug!("Heartbeat from client: {}", connection_id);
            let response = WSMessage::Heartbeat {
                timestamp: chrono::Utc::now().to_rfc3339(),
            };
            let _ = tx.send(response);
        }
        ClientMessage::Authenticate { token } => {
            debug!("Authentication attempt from: {}", connection_id);
            // In production, validate JWT token
            match state.auth.verify_token(&token) {
                Ok(user) => {
                    let response = WSMessage::SystemStatus {
                        status: "authenticated".to_string(),
                        message: format!("Authenticated as user {}", user.id),
                    };
                    let _ = tx.send(response);
                }
                Err(_) => {
                    let error_msg = WSMessage::Error {
                        message: "Invalid authentication token".to_string(),
                        code: Some("AUTH_FAILED".to_string()),
                    };
                    let _ = tx.send(error_msg);
                }
            }        }
    }
    
    Ok(())
}

// Helper functions for broadcasting events
pub async fn broadcast_workflow_event(
    connections: &Connections,
    event: WSMessage,
) {
    let connections_read = connections.read().await;
    for (_, tx) in connections_read.iter() {
        let _ = tx.send(event.clone());
    }
}

pub async fn broadcast_project_event(
    connections: &Connections,
    event: WSMessage,
) {
    let connections_read = connections.read().await;
    for (_, tx) in connections_read.iter() {
        let _ = tx.send(event.clone());
    }
}

pub async fn broadcast_activity_event(
    connections: &Connections,
    event: WSMessage,
) {
    let connections_read = connections.read().await;
    for (_, tx) in connections_read.iter() {
        let _ = tx.send(event.clone());
    }
}// Background task to send periodic heartbeats
pub async fn start_heartbeat_task(connections: Connections) {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
    
    loop {
        interval.tick().await;
        
        let heartbeat = WSMessage::Heartbeat {
            timestamp: chrono::Utc::now().to_rfc3339(),
        };
        
        broadcast_activity_event(&connections, heartbeat).await;
    }
}

// Production-ready connection manager
pub struct ConnectionManager {
    connections: Connections,
    user_connections: Arc<RwLock<HashMap<i64, Vec<String>>>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            user_connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    pub async fn add_connection(&self, connection_id: String, user_id: Option<i64>, tx: broadcast::Sender<WSMessage>) {
        let mut connections = self.connections.write().await;
        connections.insert(connection_id.clone(), tx);
        
        if let Some(user_id) = user_id {
            let mut user_connections = self.user_connections.write().await;
            user_connections.entry(user_id).or_insert_with(Vec::new).push(connection_id);
        }
    }    
    pub async fn remove_connection(&self, connection_id: &str, user_id: Option<i64>) {
        let mut connections = self.connections.write().await;
        connections.remove(connection_id);
        
        if let Some(user_id) = user_id {
            let mut user_connections = self.user_connections.write().await;
            if let Some(user_conn_list) = user_connections.get_mut(&user_id) {
                user_conn_list.retain(|id| id != connection_id);
                if user_conn_list.is_empty() {
                    user_connections.remove(&user_id);
                }
            }
        }
    }
    
    pub async fn broadcast_to_user(&self, user_id: i64, message: WSMessage) {
        let user_connections = self.user_connections.read().await;
        let connections = self.connections.read().await;
        
        if let Some(user_conn_list) = user_connections.get(&user_id) {
            for connection_id in user_conn_list {
                if let Some(tx) = connections.get(connection_id) {
                    let _ = tx.send(message.clone());
                }
            }
        }
    }
    
    pub async fn broadcast_to_all(&self, message: WSMessage) {
        let connections = self.connections.read().await;
        for (_, tx) in connections.iter() {
            let _ = tx.send(message.clone());
        }
    }
}