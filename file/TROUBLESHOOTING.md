# Deployment Troubleshooting Guide

## Issues and Solutions

### 1. App Flashes and Disappears

This is likely caused by one of the following issues:

#### A. Build Process Issues

- **Problem**: React app not building properly
- **Solution**: Check if `client/build` directory exists
- **Test**: Visit `/api/test` endpoint to see if build exists

#### B. Port Configuration

- **Problem**: Server not listening on correct port
- **Solution**: Server now listens on `0.0.0.0` and uses `process.env.PORT`

#### C. Socket.IO Connection Issues

- **Problem**: Client can't connect to Socket.IO server
- **Solution**: Added better error handling and logging

### 2. Debugging Steps

1. **Check if server is running**:

   - Visit `https://your-app.onrender.com/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check if API is working**:

   - Visit `https://your-app.onrender.com/api/test`
   - Should return server status and build information

3. **Check if React app is built**:

   - Visit `https://your-app.onrender.com/`
   - Should show the React app

4. **Check browser console**:
   - Open browser developer tools
   - Look for any JavaScript errors
   - Check Network tab for failed requests

### 3. Common Issues

#### Build Directory Missing

If `/api/test` shows `buildExists: false`, the React app didn't build properly.

**Fix**:

1. Check Render logs for build errors
2. Ensure all dependencies are installed
3. Try rebuilding manually

#### Socket.IO Connection Fails

If you see connection errors in browser console:

**Fix**:

1. Check if server is running on correct port
2. Verify CORS settings
3. Check if WebSocket connections are allowed

#### Static Files Not Served

If the app loads but assets are missing:

**Fix**:

1. Ensure `client/build` directory exists
2. Check if static file serving is configured correctly

### 4. Render-Specific Issues

#### Environment Variables

Make sure these are set in Render:

- `NODE_ENV=production`
- `PORT` (automatically set by Render)

#### Build Command

The build command should be: `npm run render-build`

#### Health Check

Render uses `/` as health check path. Make sure this route works.

### 5. Testing Locally

Before deploying, test locally:

```bash
# Install dependencies
npm run install-all

# Build the React app
npm run build

# Start the server
npm start

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/test
```

### 6. Logs to Check

1. **Render Build Logs**: Check if build process completes successfully
2. **Render Runtime Logs**: Check for server startup errors
3. **Browser Console**: Check for client-side errors
4. **Network Tab**: Check for failed API calls

### 7. Quick Fixes

If the app still doesn't work:

1. **Rebuild**: Trigger a new deployment on Render
2. **Clear Cache**: Clear browser cache and try again
3. **Check URL**: Make sure you're using the correct Render URL
4. **Wait**: Sometimes Render takes a few minutes to fully deploy

### 8. Contact Support

If issues persist:

1. Check Render documentation
2. Look at Render community forums
3. Contact Render support with your logs
