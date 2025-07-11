import React, { useState } from "react";

const FileList = ({ files, onFileDelete, baseUrl, socket }) => {
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [downloadProgress, setDownloadProgress] = useState({});

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    const iconMap = {
      pdf: "📄",
      doc: "📄",
      docx: "📄",
      txt: "📄",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      webp: "🖼️",
      mp4: "🎥",
      avi: "🎥",
      mov: "🎥",
      wmv: "🎥",
      mp3: "🎵",
      wav: "🎵",
      ogg: "🎵",
      zip: "📦",
      rar: "📦",
      "7z": "📦",
      xlsx: "📊",
      xls: "📊",
      pptx: "📊",
      ppt: "📊",
      exe: "⚙️",
      default: "📁",
    };

    return iconMap[extension] || iconMap.default;
  };

  const handleDownload = async (fileName) => {
    if (downloadingFiles.has(fileName)) return;

    setDownloadingFiles((prev) => new Set(prev).add(fileName));
    setDownloadProgress((prev) => ({ ...prev, [fileName]: 0 }));

    try {
      // Secure download with JWT
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${baseUrl}/uploads/${encodeURIComponent(fileName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        alert("Download failed: File not found or unauthorized");
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileName);
          return newSet;
        });
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileName];
          return newProgress;
        });
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.includes("_")
        ? fileName.substring(fileName.indexOf("_") + 1)
        : fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setTimeout(() => {
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileName);
          return newSet;
        });
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileName];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed. Please try again.");
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
      setDownloadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
    }
  };

  const handleDelete = async (fileName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${
          fileName.includes("_")
            ? fileName.substring(fileName.indexOf("_") + 1)
            : fileName
        }"?`
      )
    ) {
      onFileDelete(fileName);
    }
  };

  const isDownloading = (fileName) => downloadingFiles.has(fileName);
  const getDownloadProgress = (fileName) => downloadProgress[fileName] || 0;

  if (files.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📁</div>
        <div className="empty-text">No files uploaded yet</div>
        <div className="empty-subtext">
          Upload your first file to get started
        </div>
      </div>
    );
  }

  return (
    <div className="files-grid">
      {files.map((file) => (
        <div key={file.name} className="file-card">
          <div className="file-icon">{getFileIcon(file.name)}</div>
          <div className="file-name">
            {file.originalName ||
              (file.name.includes("_")
                ? file.name.substring(file.name.indexOf("_") + 1)
                : file.name)}
          </div>
          <div className="file-info">
            {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
          </div>

          {isDownloading(file.name) && (
            <div
              className="progress-container"
              style={{ marginBottom: "1rem" }}
            >
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${getDownloadProgress(file.name)}%`,
                    backgroundColor: "#38a169",
                  }}
                />
              </div>
              <div className="progress-text">
                Downloading... {getDownloadProgress(file.name)}%
              </div>
            </div>
          )}

          <div className="file-actions">
            <button
              className="action-button download-button"
              onClick={() => handleDownload(file.name)}
              disabled={isDownloading(file.name)}
            >
              {isDownloading(file.name) ? "⏳ Downloading..." : "📥 Download"}
            </button>
            <button
              className="action-button delete-button"
              onClick={() => handleDelete(file.name)}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;
