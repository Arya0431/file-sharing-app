# 📁 File Transfer Application

A modern, real-time file transfer application built with Socket.IO, Express.js, and React. Transfer small files seamlessly with real-time progress tracking and a beautiful user interface.

## ✨ Features

- **Real-time File Transfer**: Transfer files using Socket.IO for instant progress updates
- **Drag & Drop Interface**: Intuitive drag and drop file upload
- **Progress Tracking**: Real-time progress bars for active transfers
- **File Management**: View, download, and delete uploaded files
- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **Connection Status**: Real-time connection status indicator
- **File Size Validation**: 50MB file size limit with validation
- **Chunked Transfer**: Efficient file transfer using 64KB chunks

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**

   ```bash
   cd "File Transfer"
   ```

2. **Install server dependencies**

   ```bash
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start the application**

   ```bash
   # Start the server (in the root directory)
   npm start

   # In a new terminal, start the client (optional for development)
   cd client
   npm start
   ```

5. **Access the application**
   - Server: http://localhost:3001
   - Client (development): http://localhost:3000

## 📁 Project Structure

```
File Transfer/
├── server.js              # Express + Socket.IO server
├── package.json           # Server dependencies
├── uploads/              # Uploaded files directory
├── client/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js
│   │   │   ├── FileList.js
│   │   │   └── TransferProgress.js
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Server Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=3000 npm start
```

### File Size Limits

The application has a 50MB file size limit. You can modify this in `client/src/components/FileUpload.js`:

```javascript
if (file.size > 50 * 1024 * 1024) {
  // 50MB limit
  alert("File size must be less than 50MB");
  return;
}
```

### Chunk Size

File transfer uses 64KB chunks by default. You can modify this in `client/src/components/FileUpload.js`:

```javascript
const chunkSize = 64 * 1024; // 64KB chunks
```

## 🎯 Usage

### Uploading Files

1. **Drag & Drop**: Simply drag files onto the upload area
2. **Click to Browse**: Click the upload area to select files from your computer
3. **Real-time Progress**: Watch the progress bar as your file uploads
4. **Cancel Transfers**: Click the ✕ button to cancel active transfers

### Managing Files

- **View Files**: All uploaded files appear in the "Uploaded Files" section
- **Download Files**: Click the "Download" button to save files locally
- **Delete Files**: Click the "Delete" button to remove files from the server

### Connection Status

- **🟢 Connected**: Server is reachable and ready for transfers
- **🔴 Disconnected**: Server is unavailable

## 🛠️ Development

### Running in Development Mode

```bash
# Terminal 1 - Start server with auto-restart
npm run dev

# Terminal 2 - Start React development server
cd client
npm start
```

### Building for Production

```bash
# Build the React app
cd client
npm run build

# Start production server
cd ..
npm start
```

## 🔒 Security Considerations

- File uploads are stored in the `uploads/` directory
- No authentication is implemented (add your own if needed)
- File size limits prevent abuse
- Input validation on file types and sizes

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```bash
   # Change the port
   PORT=3002 npm start
   ```

2. **Socket Connection Failed**

   - Check if the server is running
   - Verify the SOCKET_URL in `client/src/App.js`
   - Check firewall settings

3. **File Upload Fails**

   - Ensure the `uploads/` directory exists
   - Check file size limits
   - Verify network connectivity

4. **Build Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📝 API Endpoints

### Server Endpoints

- `GET /api/files` - List all uploaded files
- `GET /uploads/:filename` - Download a specific file
- `DELETE /api/files/:filename` - Delete a specific file

### Socket.IO Events

**Client to Server:**

- `start-transfer` - Initiate file transfer
- `file-chunk` - Send file chunk
- `cancel-transfer` - Cancel active transfer

**Server to Client:**

- `transfer-ready` - Server ready to receive chunks
- `transfer-progress` - Progress update
- `transfer-complete` - Transfer finished
- `transfer-error` - Transfer error
- `transfer-cancelled` - Transfer cancelled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- React for the frontend framework
- Express.js for the backend server
- Modern CSS for beautiful styling

---

**Happy File Transferring! 🚀**
