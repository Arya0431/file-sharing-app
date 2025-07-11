const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const userStore = require("./userStore");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("Auth header:", authHeader); // Debug log
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid Authorization header" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT error:", err); // Debug log
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors()); // Allow all origins for public access
app.use(express.json());
// Serve static files from the React app
const buildPath = path.join(__dirname, "client/build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  console.log("Static files served from:", buildPath);
} else {
  console.warn(
    "Warning: React build directory not found. Make sure to run 'npm run build' before deployment."
  );
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Store active transfers and connected users
const activeTransfers = new Map();
const connectedUsers = new Map();

// File validation
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/json",
  "application/xml",
  "video/mp4",
  "video/avi",
  "video/mov",
  "video/wmv",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp3",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  connectedUsers.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    transfers: [],
  });

  // Send welcome message
  socket.emit("welcome", {
    message: "Connected to File Transfer Server",
    userId: socket.id,
    serverTime: new Date().toISOString(),
  });

  // Handle file transfer initiation with validation
  socket.on("start-transfer", (data) => {
    const { fileName, fileSize, transferId, fileType } = data;

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      socket.emit("transfer-error", {
        transferId,
        message: `File size exceeds maximum limit of ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB`,
      });
      return;
    }

    // Validate file type (if provided)
    if (fileType && !ALLOWED_FILE_TYPES.includes(fileType)) {
      socket.emit("transfer-error", {
        transferId,
        message: "File type not allowed",
      });
      return;
    }

    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;

    activeTransfers.set(transferId, {
      fileName: uniqueFileName,
      originalFileName: fileName,
      fileSize,
      fileType,
      chunks: [],
      receivedSize: 0,
      socketId: socket.id,
      startTime: new Date(),
      status: "receiving",
    });

    console.log(
      `Transfer started: ${fileName} (${fileSize} bytes) by ${socket.id}`
    );
    socket.emit("transfer-ready", { transferId, uniqueFileName });

    // Update user's transfer list
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.transfers.push(transferId);
    }
  });

  // Handle file chunks with improved error handling
  socket.on("file-chunk", (data) => {
    const { transferId, chunk, chunkIndex, totalChunks } = data;
    const transfer = activeTransfers.get(transferId);

    if (!transfer) {
      socket.emit("transfer-error", {
        transferId,
        message: "Transfer not found or expired",
      });
      return;
    }

    if (transfer.socketId !== socket.id) {
      socket.emit("transfer-error", {
        transferId,
        message: "Unauthorized transfer access",
      });
      return;
    }

    // Store chunk
    transfer.chunks[chunkIndex] = chunk;
    transfer.receivedSize += chunk.length;

    // Send progress update
    const progress = Math.round(
      (transfer.receivedSize / transfer.fileSize) * 100
    );
    const speed = calculateTransferSpeed(transfer);

    socket.emit("transfer-progress", {
      transferId,
      progress,
      receivedSize: transfer.receivedSize,
      totalSize: transfer.fileSize,
      speed,
      estimatedTime: calculateEstimatedTime(
        transfer.receivedSize,
        transfer.fileSize,
        speed
      ),
    });

    // Check if all chunks received
    if (transfer.receivedSize >= transfer.fileSize) {
      // Combine chunks and save file
      const fileBuffer = Buffer.concat(transfer.chunks);
      const filePath = path.join(uploadsDir, transfer.fileName);

      fs.writeFile(filePath, fileBuffer, (err) => {
        if (err) {
          console.error("Error saving file:", err);
          socket.emit("transfer-error", {
            transferId,
            message: "Error saving file to server",
          });
        } else {
          const endTime = new Date();
          const duration = endTime - transfer.startTime;

          console.log(`File saved: ${transfer.fileName} (${duration}ms)`);

          // Update file metadata
          const fileStats = {
            name: transfer.originalFileName,
            size: transfer.fileSize,
            uploadDate: endTime,
            uploadDuration: duration,
            uploadedBy: socket.id,
            serverFileName: transfer.fileName,
          };

          socket.emit("transfer-complete", {
            transferId,
            fileName: transfer.originalFileName,
            serverFileName: transfer.fileName,
            filePath: `/uploads/${transfer.fileName}`,
            stats: fileStats,
          });

          // Broadcast to all other connected users
          socket.broadcast.emit("file-uploaded", {
            fileName: transfer.originalFileName,
            fileSize: transfer.fileSize,
            uploadedBy: socket.id,
            uploadTime: endTime,
          });

          // Clean up
          activeTransfers.delete(transferId);

          // Update user's transfer list
          const user = connectedUsers.get(socket.id);
          if (user) {
            user.transfers = user.transfers.filter((t) => t !== transferId);
          }
        }
      });
    }
  });

  // Handle transfer cancellation
  socket.on("cancel-transfer", (data) => {
    const { transferId } = data;
    const transfer = activeTransfers.get(transferId);

    if (transfer && transfer.socketId === socket.id) {
      activeTransfers.delete(transferId);
      console.log(
        `Transfer cancelled: ${transfer.originalFileName} by ${socket.id}`
      );
      socket.emit("transfer-cancelled", { transferId });

      // Update user's transfer list
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.transfers = user.transfers.filter((t) => t !== transferId);
      }
    }
  });

  // Handle file download requests
  socket.on("request-download", (data) => {
    const { fileName } = data;
    const filePath = path.join(uploadsDir, fileName);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      socket.emit("download-ready", {
        fileName,
        fileSize: stats.size,
        filePath: `/uploads/${fileName}`,
      });
    } else {
      socket.emit("download-error", {
        fileName,
        message: "File not found",
      });
    }
  });

  // Handle user status updates
  socket.on("user-status", (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.status = data.status;
      user.lastActivity = new Date();
      socket.broadcast.emit("user-updated", {
        userId: socket.id,
        status: data.status,
      });
    }
  });

  // Handle disconnect with cleanup
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Clean up active transfers for this socket
    for (const [transferId, transfer] of activeTransfers.entries()) {
      if (transfer.socketId === socket.id) {
        activeTransfers.delete(transferId);
        console.log(`Cleaned up transfer: ${transfer.originalFileName}`);
      }
    }

    // Remove user from connected users
    connectedUsers.delete(socket.id);

    // Notify other users
    socket.broadcast.emit("user-disconnected", { userId: socket.id });
  });
});

// Helper functions
function calculateTransferSpeed(transfer) {
  const now = new Date();
  const elapsed = now - transfer.startTime;
  if (elapsed === 0) return 0;

  return Math.round((transfer.receivedSize / elapsed) * 1000); // bytes per second
}

function calculateEstimatedTime(received, total, speed) {
  if (speed === 0) return null;

  const remaining = total - received;
  const estimatedSeconds = Math.ceil(remaining / speed);

  if (estimatedSeconds < 60) {
    return `${estimatedSeconds}s`;
  } else if (estimatedSeconds < 3600) {
    return `${Math.ceil(estimatedSeconds / 60)}m`;
  } else {
    return `${Math.ceil(estimatedSeconds / 3600)}h`;
  }
}

// Test route for debugging
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT,
    buildExists: fs.existsSync(path.join(__dirname, "client/build")),
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.get("/api/files", authenticateJWT, (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Error reading uploads directory" });
    }

    const fileList = files
      .map((file) => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          uploadDate: stats.mtime,
          originalName: file.includes("_")
            ? file.substring(file.indexOf("_") + 1)
            : file,
        };
      })
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    res.json(fileList);
  });
});

app.get("/api/stats", authenticateJWT, (req, res) => {
  const stats = {
    connectedUsers: connectedUsers.size,
    activeTransfers: activeTransfers.size,
    totalFiles: 0,
    totalSize: 0,
  };

  try {
    const files = fs.readdirSync(uploadsDir);
    stats.totalFiles = files.length;

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const fileStats = fs.statSync(filePath);
      stats.totalSize += fileStats.size;
    });
  } catch (error) {
    console.error("Error calculating stats:", error);
  }

  res.json(stats);
});

app.get("/uploads/:filename", authenticateJWT, (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.delete("/api/files/:filename", authenticateJWT, (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: "Error deleting file" });
      }
      res.json({ message: "File deleted successfully" });
    });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Add registration endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  try {
    await userStore.addUser(username, password);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  const valid = await userStore.validateUser(username, password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  // Issue JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" });
  console.log("Token generated for login:", token); // Debug log
  res.json({ token });
});

// Catch-all handler to serve React's index.html for any unknown routes
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "client/build", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: "React app not built. Please run 'npm run build' first.",
    });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`File transfer app available at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `Build path exists: ${fs.existsSync(path.join(__dirname, "client/build"))}`
  );
});

// Add error handling
server.on("error", (error) => {
  console.error("Server error:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
