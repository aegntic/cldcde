const express = require('express')
const Docker = require('dockerode')
const winston = require('winston')
const chalk = require('chalk')

// Initialize Docker client
const docker = new Docker()

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
})

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

// List containers endpoint
app.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true })
    res.json(containers)
  } catch (err) {
    logger.error('Failed to list containers:', err)
    res.status(500).json({ error: 'Failed to list containers' })
  }
})

// Start server
app.listen(port, () => {
  logger.info(chalk.green(`Docker MCP Server running on port ${port}`))
})

module.exports = app
