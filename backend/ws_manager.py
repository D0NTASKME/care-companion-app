# app/ws_manager.py
import asyncio
import json
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    """Manages active WebSocket connections."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepts a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New connection: {websocket.client}. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Removes a WebSocket connection."""
        self.active_connections.remove(websocket)
        print(f"Connection closed: {websocket.client}. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Sends a JSON message to all connected clients."""
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # If sending fails, the client has likely disconnected.
                disconnected_clients.append(connection)
        
        # Clean up dead connections
        for client in disconnected_clients:
            self.disconnect(client)

# Create a single instance of the manager to be used across the app
manager = ConnectionManager()