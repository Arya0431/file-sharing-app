import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import TransferProgress from "./components/TransferProgress";

// Improved Socket.IO URL configuration
const getSocketUrl = () => {
  if (process.env.NODE_ENV === "production") {
    // In production, use the current origin
    return window.location.origin;
  }
  // In development, use localhost
  return "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();
console.log("Socket URL:", SOCKET_URL);
console.log("Environment:", process.env.NODE_ENV);

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [files, setFiles] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    console.log("Attempting to connect to:", SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server successfully");
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on("welcome", (data) => {
      setWelcomeMessage(data.message);
      console.log("Welcome message:", data);
    });

    newSocket.on("transfer-progress", (data) => {
      setTransfers((prev) =>
        prev.map((transfer) =>
          transfer.transferId === data.transferId
            ? {
                ...transfer,
                progress: data.progress,
                receivedSize: data.receivedSize,
                totalSize: data.totalSize,
                speed: data.speed,
                estimatedTime: data.estimatedTime,
              }
            : transfer
        )
      );
    });

    newSocket.on("transfer-complete", (data) => {
      setTransfers((prev) =>
        prev.filter((t) => t.transferId !== data.transferId)
      );
      fetchFiles();

      // Show success notification
      if (data.stats) {
        console.log(
          `File uploaded successfully: ${data.fileName} (${data.stats.uploadDuration}ms)`
        );
        addNotification(
          `✅ File "${data.fileName}" uploaded successfully!`,
          "success"
        );
      }
    });

    newSocket.on("transfer-error", (data) => {
      console.error("Transfer error:", data.message);
      setTransfers((prev) =>
        prev.filter((t) => t.transferId !== data.transferId)
      );

      // Show error notification
      addNotification(`❌ Transfer failed: ${data.message}`, "error");
    });

    newSocket.on("transfer-cancelled", (data) => {
      setTransfers((prev) =>
        prev.filter((t) => t.transferId !== data.transferId)
      );
      console.log("Transfer cancelled:", data.transferId);
      addNotification(`⏹️ Transfer cancelled`, "info");
    });

    // Listen for file uploads from other users
    newSocket.on("file-uploaded", (data) => {
      console.log("File uploaded by another user:", data);
      addNotification(`📁 New file received: "${data.fileName}"`, "info");
      fetchFiles();
    });

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.close();
    };
  }, []);

  const addNotification = (message, type = "info") => {
    const id = Date.now();
    const notification = { id, message, type, timestamp: new Date() };
    setNotifications((prev) => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/files`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/stats`);
      const data = await response.json();
      setServerStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchStats();

    // Refresh stats periodically
    const statsInterval = setInterval(fetchStats, 10000);
    return () => clearInterval(statsInterval);
  }, []);

  const addTransfer = (transfer) => {
    setTransfers((prev) => [...prev, transfer]);
  };

  const removeTransfer = (transferId) => {
    setTransfers((prev) => prev.filter((t) => t.transferId !== transferId));
  };

  const handleFileDelete = async (fileName) => {
    try {
      await fetch(`${SOCKET_URL}/api/files/${fileName}`, {
        method: "DELETE",
      });
      fetchFiles();
      fetchStats();
      addNotification(`🗑️ File deleted successfully`, "success");
    } catch (error) {
      console.error("Error deleting file:", error);
      addNotification(`❌ Error deleting file`, "error");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>📁 File Transfer Hub</h1>
          <div className="connection-status">
            <span
              className={`status-indicator ${
                isConnected ? "connected" : "disconnected"
              }`}
            >
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </span>
            {serverStats && (
              <span
                style={{
                  marginLeft: "1rem",
                  fontSize: "0.75rem",
                  color: "#718096",
                }}
              >
                📊 {serverStats.totalFiles} files •{" "}
                {formatFileSize(serverStats.totalSize)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification ${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span>{notification.message}</span>
            <button
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <main className="app-main">
        <div className="container">
          {welcomeMessage && (
            <div
              style={{
                background: "rgba(72, 187, 120, 0.1)",
                border: "1px solid #38a169",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "1rem",
                color: "#38a169",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              ✅ {welcomeMessage}
            </div>
          )}

          <div className="upload-section">
            <FileUpload
              socket={socket}
              isConnected={isConnected}
              onTransferStart={addTransfer}
              onTransferComplete={removeTransfer}
            />
          </div>

          {transfers.length > 0 && (
            <div className="transfers-section">
              <h2>Active Transfers ({transfers.length})</h2>
              <div className="transfers-grid">
                {transfers.map((transfer) => (
                  <TransferProgress
                    key={transfer.transferId}
                    transfer={transfer}
                    socket={socket}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="files-section">
            <h2>Uploaded Files ({files.length})</h2>
            <FileList
              files={files}
              onFileDelete={handleFileDelete}
              baseUrl={SOCKET_URL}
              socket={socket}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
