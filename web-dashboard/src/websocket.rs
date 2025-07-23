use axum::{
    extract::{ws::{WebSocket, Message}, WebSocketUpgrade, State},
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

use crate::AppState;

/// WebSocket connection information
#[derive(Debug, Clone)]
pub struct WebSocketConnection {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub connected_at: chrono::DateTime<chrono::Utc>,
    pub last_ping: chrono::DateTime<chrono::Utc>,
    pub subscriptions: Vec<String>,
}

impl WebSocketConnection {
    pub fn new() -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Uuid::new_v4(),
            user_id: None,
            connected_at: now,
            last_ping: now,
            subscriptions: Vec::new(),
        }
    }
}

/// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    // Client -> Server
    Subscribe { channels: Vec<String> },
    Unsubscribe { channels: Vec<String> },
    Ping,
    WorkflowUpdate { workflow_id: String, data: serde_json::Value },
    
    // Server -> Client  
    Pong,
    Subscribed { channels: Vec<String> },
    Unsubscribed { channels: Vec<String> },
    WorkflowStatusUpdate { workflow_id: String, status: String, progress: f32 },
    ProjectSync { project_id: String, status: String },
    GitHubWebhook { event: String, data: serde_json::Value },
    SystemNotification { level: String, message: String },
    Error { message: String },
}

/// WebSocket handler
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

/// Handle WebSocket connection
async fn handle_websocket(socket: WebSocket, state: AppState) {
    let connection = WebSocketConnection::new();
    let connection_id = connection.id;
    
    // Store the connection
    {
        let mut connections = state.websocket_connections.write().await;
        connections.insert(connection_id, connection);
    }
    
    let (mut sender, mut receiver) = socket.split();
    
    // Create broadcast channel for this connection
    let (tx, mut rx) = broadcast::channel::<WsMessage>(100);
    
    // Spawn task to handle outgoing messages
    let state_clone = state.clone();
    let sender_task = tokio::spawn(async move {
        while let Ok(message) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&message) {
                if sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }
        }
    });
    
    // Handle incoming messages
    let state_clone = state.clone();
    while let Some(msg) = receiver.next().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    if let Ok(ws_message) = serde_json::from_str::<WsMessage>(&text) {
                        handle_websocket_message(ws_message, connection_id, &state_clone, &tx).await;
                    }
                }
                Message::Binary(_) => {
                    // Handle binary messages if needed
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        } else {
            break;
        }
    }
    
    // Clean up connection
    {
        let mut connections = state.websocket_connections.write().await;
        connections.remove(&connection_id);
    }
    
    sender_task.abort();
}

/// Handle individual WebSocket messages
async fn handle_websocket_message(
    message: WsMessage,
    connection_id: Uuid,
    state: &AppState,
    tx: &broadcast::Sender<WsMessage>,
) {
    match message {
        WsMessage::Ping => {
            // Update last ping time
            {
                let mut connections = state.websocket_connections.write().await;
                if let Some(conn) = connections.get_mut(&connection_id) {
                    conn.last_ping = chrono::Utc::now();
                }
            }
            
            let _ = tx.send(WsMessage::Pong);
        }
        
        WsMessage::Subscribe { channels } => {
            // Update subscriptions
            {
                let mut connections = state.websocket_connections.write().await;
                if let Some(conn) = connections.get_mut(&connection_id) {
                    for channel in &channels {
                        if !conn.subscriptions.contains(channel) {
                            conn.subscriptions.push(channel.clone());
                        }
                    }
                }
            }
            
            let _ = tx.send(WsMessage::Subscribed { channels });
        }
        
        WsMessage::Unsubscribe { channels } => {
            // Remove subscriptions
            {
                let mut connections = state.websocket_connections.write().await;
                if let Some(conn) = connections.get_mut(&connection_id) {
                    conn.subscriptions.retain(|sub| !channels.contains(sub));
                }
            }
            
            let _ = tx.send(WsMessage::Unsubscribed { channels });
        }
        
        WsMessage::WorkflowUpdate { workflow_id, data } => {
            // Handle workflow updates from client
            tracing::info!("Received workflow update for {}: {:?}", workflow_id, data);
            
            // Broadcast to other subscribed clients
            broadcast_to_subscribers(
                state,
                &format!("workflow:{}", workflow_id),
                &WsMessage::WorkflowStatusUpdate {
                    workflow_id: workflow_id.clone(),
                    status: "updated".to_string(),
                    progress: data.get("progress").and_then(|v| v.as_f64()).unwrap_or(0.0) as f32,
                },
                Some(connection_id),
            ).await;
        }
        
        _ => {
            // Handle other message types
            tracing::debug!("Unhandled WebSocket message: {:?}", message);
        }
    }
}

/// Broadcast message to all subscribers of a channel
async fn broadcast_to_subscribers(
    state: &AppState,
    channel: &str,
    message: &WsMessage,
    exclude_connection: Option<Uuid>,
) {
    let connections = state.websocket_connections.read().await;
    
    for (conn_id, connection) in connections.iter() {
        if let Some(exclude) = exclude_connection {
            if *conn_id == exclude {
                continue;
            }
        }
        
        if connection.subscriptions.contains(&channel.to_string()) {
            // In a real implementation, you'd store the broadcast sender for each connection
            // and send the message through it
            tracing::debug!("Would broadcast to connection {}: {:?}", conn_id, message);
        }
    }
}

/// WebSocket event broadcaster (used by other parts of the application)
pub struct WebSocketBroadcaster {
    connections: Arc<RwLock<HashMap<Uuid, WebSocketConnection>>>,
}

impl WebSocketBroadcaster {
    pub fn new(connections: Arc<RwLock<HashMap<Uuid, WebSocketConnection>>>) -> Self {
        Self { connections }
    }
    
    /// Broadcast workflow status update
    pub async fn broadcast_workflow_update(&self, workflow_id: &str, status: &str, progress: f32) {
        let message = WsMessage::WorkflowStatusUpdate {
            workflow_id: workflow_id.to_string(),
            status: status.to_string(),
            progress,
        };
        
        self.broadcast_to_channel(&format!("workflow:{}", workflow_id), &message).await;
    }
    
    /// Broadcast project sync status
    pub async fn broadcast_project_sync(&self, project_id: &str, status: &str) {
        let message = WsMessage::ProjectSync {
            project_id: project_id.to_string(),
            status: status.to_string(),
        };
        
        self.broadcast_to_channel(&format!("project:{}", project_id), &message).await;
    }
    
    /// Broadcast system notification
    pub async fn broadcast_system_notification(&self, level: &str, message: &str) {
        let ws_message = WsMessage::SystemNotification {
            level: level.to_string(),
            message: message.to_string(),
        };
        
        self.broadcast_to_channel("system", &ws_message).await;
    }
    
    /// Broadcast GitHub webhook event
    pub async fn broadcast_github_webhook(&self, event: &str, data: serde_json::Value) {
        let message = WsMessage::GitHubWebhook {
            event: event.to_string(),
            data,
        };
        
        self.broadcast_to_channel("github", &message).await;
    }
    
    /// Internal method to broadcast to a specific channel
    async fn broadcast_to_channel(&self, channel: &str, message: &WsMessage) {
        let connections = self.connections.read().await;
        
        for (conn_id, connection) in connections.iter() {
            if connection.subscriptions.contains(&channel.to_string()) {
                tracing::debug!("Broadcasting to connection {}: {:?}", conn_id, message);
                // In a real implementation, send the message through the connection's sender
            }
        }
    }
}

/// Background task to clean up inactive WebSocket connections
pub async fn cleanup_inactive_connections(
    connections: Arc<RwLock<HashMap<Uuid, WebSocketConnection>>>,
    timeout_seconds: u64,
) {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
    
    loop {
        interval.tick().await;
        
        let mut connections_write = connections.write().await;
        let now = chrono::Utc::now();
        let timeout = chrono::Duration::seconds(timeout_seconds as i64);
        
        connections_write.retain(|_id, connection| {
            now - connection.last_ping < timeout
        });
    }
}