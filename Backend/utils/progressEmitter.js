class ProgressEmitter {
  constructor() {
    this.clients = new Map();
  }

  addClient(jobId, res) {
    this.clients.set(jobId, res);
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ message: 'Connected to progress stream' })}\n\n`);
  }

  removeClient(jobId) {
    this.clients.delete(jobId);
  }

  emit(jobId, message) {
    const res = this.clients.get(jobId);
    if (res) {
      res.write(`data: ${JSON.stringify({ message })}\n\n`);
    }
  }

  end(jobId) {
    const res = this.clients.get(jobId);
    if (res) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      this.removeClient(jobId);
    }
  }
}

module.exports = new ProgressEmitter();
