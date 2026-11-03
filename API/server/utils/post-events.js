const postClients = new Map();

function addPostClient(postId, res) {
  const key = String(postId);
  if (!postClients.has(key)) {
    postClients.set(key, new Set());
  }
  postClients.get(key).add(res);
}

function removePostClient(postId, res) {
  const key = String(postId);
  const clients = postClients.get(key);
  if (!clients) return;
  clients.delete(res);
  if (clients.size === 0) {
    postClients.delete(key);
  }
}

function broadcastPostEvent(postId, eventName, payload) {
  const clients = postClients.get(String(postId));
  if (!clients || clients.size === 0) return;

  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(message);
  }
}

function closeAllPostClients() {
  for (const clients of postClients.values()) {
    for (const res of clients) {
      res.end();
    }
  }
  postClients.clear();
}

module.exports = { addPostClient, removePostClient, broadcastPostEvent, closeAllPostClients };
