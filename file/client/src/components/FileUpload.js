import React, { useState, useRef } from "react";

const FileUpload = ({
  socket,
  isConnected,
  onTransferStart,
  onTransferComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
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

    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / (1024 * 1024)}MB`;
    }

    if (!allowedTypes.includes(file.type)) {
      return "File type not supported. Please select a valid file type.";
    }

    return null;
  };

  const handleFileSelect = (file) => {
    setUploadError(null);
    const error = validateFile(file);

    if (error) {
      setUploadError(error);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !socket || !isConnected) return;

    setIsUploading(true);
    setUploadError(null);
    const transferId =
      Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Create transfer object
    const transfer = {
      transferId,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      progress: 0,
      speed: 0,
      estimatedTime: null,
    };

    onTransferStart(transfer);

    // Start transfer
    socket.emit("start-transfer", {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      transferId,
    });

    // Wait for server to be ready
    socket.once(
      "transfer-ready",
      ({ transferId: serverTransferId, uniqueFileName }) => {
        if (serverTransferId === transferId) {
          sendFileInChunks(selectedFile, transferId);
        }
      }
    );

    // Handle transfer errors
    socket.once("transfer-error", (data) => {
      if (data.transferId === transferId) {
        setUploadError(data.message);
        setIsUploading(false);
        onTransferComplete(transferId);
      }
    });
  };

  const sendFileInChunks = (file, transferId) => {
    const chunkSize = 64 * 1024; // 64KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    const reader = new FileReader();

    reader.onload = (e) => {
      const chunk = e.target.result;

      socket.emit("file-chunk", {
        transferId,
        chunk,
        chunkIndex: currentChunk,
        totalChunks,
      });

      currentChunk++;

      if (currentChunk < totalChunks) {
        // Read next chunk
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const nextChunk = file.slice(start, end);
        reader.readAsArrayBuffer(nextChunk);
      } else {
        // All chunks sent
        setTimeout(() => {
          setIsUploading(false);
          setSelectedFile(null);
          setUploadError(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }, 1000);
      }
    };

    // Start reading first chunk
    const firstChunk = file.slice(0, chunkSize);
    reader.readAsArrayBuffer(firstChunk);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    const iconMap = {
      pdf: "📄",
      doc: "📄",
      docx: "📄",
      txt: "📄",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      mp4: "🎥",
      avi: "🎥",
      mov: "🎥",
      mp3: "🎵",
      wav: "🎵",
      zip: "📦",
      rar: "📦",
      exe: "⚙️",
      default: "📁",
    };

    return iconMap[extension] || iconMap.default;
  };

  return (
    <div className="file-upload-card">
      <div
        className={`upload-area ${isDragging ? "dragover" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          {selectedFile ? getFileIcon(selectedFile) : "📁"}
        </div>
        <div className="upload-text">
          {selectedFile ? selectedFile.name : "Drag & drop files here"}
        </div>
        <div className="upload-subtext">
          {selectedFile
            ? `${formatFileSize(selectedFile.size)} • ${
                selectedFile.type || "Unknown type"
              }`
            : "or click to browse files (max 50MB)"}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          onChange={handleFileInputChange}
          accept="*/*"
        />
      </div>

      {uploadError && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "rgba(245, 101, 101, 0.1)",
            border: "1px solid #e53e3e",
            borderRadius: "8px",
            color: "#e53e3e",
            fontSize: "0.875rem",
          }}
        >
          ⚠️ {uploadError}
        </div>
      )}

      {selectedFile && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={!isConnected || isUploading}
          >
            {isUploading ? "📤 Uploading..." : "📤 Upload File"}
          </button>
          {!isUploading && (
            <button
              className="upload-button"
              onClick={handleCancel}
              style={{
                background: "#718096",
                marginLeft: "0.5rem",
              }}
            >
              ❌ Cancel
            </button>
          )}
        </div>
      )}

      {!isConnected && (
        <div
          style={{
            marginTop: "1rem",
            textAlign: "center",
            color: "#e53e3e",
            fontSize: "0.875rem",
          }}
        >
          ⚠️ Not connected to server
        </div>
      )}
    </div>
  );
};

export default FileUpload;
