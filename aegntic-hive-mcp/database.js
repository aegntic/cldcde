const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'conversations.db'));
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Projects table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          description TEXT,
          instructions TEXT,
          created_at TEXT,
          updated_at TEXT,
          UNIQUE(name)
        )
      `);

      // Artifacts table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS artifacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          version INTEGER,
          name TEXT,
          type TEXT,
          content TEXT,
          metadata TEXT,
          created_at TEXT,
          updated_at TEXT,
          FOREIGN KEY(project_id) REFERENCES projects(id)
        )
      `);

      // Conversations table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service TEXT NOT NULL,
          project_id INTEGER,
          conversation_id TEXT NOT NULL,
          title TEXT,
          created_at TEXT,
          updated_at TEXT,
          url TEXT,
          UNIQUE(service, conversation_id),
          FOREIGN KEY(project_id) REFERENCES projects(id)
        )
      `);

      // Messages table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER,
          service TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TEXT,
          message_order INTEGER,
          FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        )
      `);

      // Create indexes
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_service ON conversations(service)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_service ON messages(service)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_artifacts_project ON artifacts(project_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_artifacts_version ON artifacts(version)`);
    });
  }

  // Project methods
  async saveProject(name, description, instructions) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      this.db.run(
        `INSERT OR REPLACE INTO projects (name, description, instructions, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, instructions, now, now],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getProjects() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM projects ORDER BY updated_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getProject(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Artifact methods
  async saveArtifact(projectId, name, type, content, metadata, version) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      this.db.run(
        `INSERT INTO artifacts (project_id, name, type, content, metadata, version, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectId, name, type, content, metadata, version, now, now],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getArtifacts(projectId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM artifacts WHERE project_id = ? ORDER BY name, version DESC', 
        [projectId], 
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getArtifactVersions(projectId, artifactName) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM artifacts WHERE project_id = ? AND name = ? ORDER BY version DESC', 
        [projectId, artifactName], 
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getLatestArtifactVersion(projectId, artifactName) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT MAX(version) as latest_version FROM artifacts WHERE project_id = ? AND name = ?',
        [projectId, artifactName],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.latest_version : 0);
        }
      );
    });
  }

  async saveConversation(service, projectId, conversationId, title, createdAt, updatedAt, url) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO conversations (service, project_id, conversation_id, title, created_at, updated_at, url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [service, projectId, conversationId, title, createdAt, updatedAt, url],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async saveMessage(conversationDbId, service, role, content, timestamp, messageOrder) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO messages (conversation_id, service, role, content, timestamp, message_order) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [conversationDbId, service, role, content, timestamp, messageOrder],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getConversations(service = null, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM conversations`;
      let params = [];

      if (service) {
        query += ` WHERE service = ?`;
        params.push(service);
      }

      query += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getConversationMessages(conversationDbId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM messages WHERE conversation_id = ? ORDER BY message_order ASC`,
        [conversationDbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async searchConversations(query, service = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT DISTINCT c.* FROM conversations c
        JOIN messages m ON c.id = m.conversation_id
        WHERE (c.title LIKE ? OR m.content LIKE ?)
      `;
      let params = [`%${query}%`, `%${query}%`];

      if (service) {
        sql += ` AND c.service = ?`;
        params.push(service);
      }

      sql += ` ORDER BY c.updated_at DESC`;

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async clearConversations(service) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`DELETE FROM messages WHERE service = ?`, [service]);
        this.db.run(`DELETE FROM conversations WHERE service = ?`, [service], function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
