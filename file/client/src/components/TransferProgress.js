import React from "react";

const TransferProgress = ({ transfer, socket }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return (
      parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    );
  };

  const handleCancel = () => {
    if (socket) {
      socket.emit("cancel-transfer", { transferId: transfer.transferId });
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return "#e53e3e";
    if (progress < 70) return "#d69e2e";
    return "#38a169";
  };

  return (
    <div className="transfer-card">
      <div className="transfer-header">
        <div>
          <div className="transfer-name">{transfer.fileName}</div>
          <div className="transfer-size">
            {formatFileSize(transfer.receivedSize || 0)} /{" "}
            {formatFileSize(transfer.fileSize)}
          </div>
        </div>
        <button className="cancel-button" onClick={handleCancel}>
          ✕
        </button>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${transfer.progress || 0}%`,
              backgroundColor: getProgressColor(transfer.progress || 0),
            }}
          />
        </div>
        <div className="progress-text">{transfer.progress || 0}% Complete</div>

        {transfer.speed > 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#718096",
              fontSize: "0.75rem",
              marginTop: "0.25rem",
            }}
          >
            {formatSpeed(transfer.speed)}
            {transfer.estimatedTime && ` • ETA: ${transfer.estimatedTime}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferProgress;
