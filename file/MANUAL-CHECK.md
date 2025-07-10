# Manual Error Checking Guide

## Quick Error Check

### Step 1: Get your Render URL

1. Go to your Render dashboard
2. Click on your app
3. Copy the URL (looks like `https://your-app-name.onrender.com`)

### Step 2: Run the automated check

```bash
# Set your Render URL
export RENDER_URL=https://your-app-name.onrender.com

# Run the check
node check-deployment.js
```

### Step 3: Manual browser checks

#### A. Test Health Endpoint

Visit: `https://your-app-name.onrender.com/health`
**Expected**: `{"status":"ok","timestamp":"..."}`

#### B. Test API Endpoint

Visit: `https://your-app-name.onrender.com/api/test`
**Expected**: Server status with build information

#### C. Test Main App

Visit: `https://your-app-name.onrender.com/`
**Expected**: Your React app loads completely

### Step 4: Browser Console Check

1. Open your app URL in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for any red error messages

**Common errors to watch for:**

- `Failed to load resource: net::ERR_CONNECTION_REFUSED`
- `Socket.IO connection failed`
- `Uncaught TypeError: ...`
- `404 Not Found` errors

### Step 5: Network Tab Check

1. In Developer Tools, go to Network tab
2. Refresh the page
3. Look for failed requests (red entries)
4. Check if all static files load (JS, CSS)

## Common Error Patterns

### ❌ App flashes and disappears

**Possible causes:**

- JavaScript errors preventing app from loading
- Missing static files
- Socket.IO connection failures

**Check:**

- Browser console for errors
- Network tab for failed requests
- Render logs for build errors

### ❌ White screen

**Possible causes:**

- React app not built properly
- Server not running
- Port configuration issues

**Check:**

- `/health` endpoint
- `/api/test` endpoint
- Render runtime logs

### ❌ Socket.IO connection errors

**Possible causes:**

- WebSocket not allowed
- CORS issues
- Server not responding

**Check:**

- Browser console for connection errors
- Network tab for WebSocket failures
- Server logs for Socket.IO errors

### ❌ Static files not loading

**Possible causes:**

- Build process failed
- Static file serving not configured
- File paths incorrect

**Check:**

- `/api/test` to see if build exists
- Network tab for 404 errors on static files
- Render build logs

## Render Dashboard Checks

### Build Logs

1. Go to Render dashboard
2. Click your app
3. Go to "Logs" tab
4. Look for build errors

**Common build errors:**

- `npm install` failures
- `npm run build` failures
- Missing dependencies

### Runtime Logs

1. In the same Logs tab
2. Look for runtime errors

**Common runtime errors:**

- Port binding issues
- Server startup failures
- Uncaught exceptions

## Quick Fixes

### If build failed:

1. Check package.json dependencies
2. Ensure all required packages are listed
3. Try rebuilding manually

### If server won't start:

1. Check if PORT environment variable is set
2. Verify server.js syntax
3. Check for missing dependencies

### If app loads but doesn't work:

1. Check browser console for JavaScript errors
2. Verify Socket.IO connection
3. Check if API endpoints work

## Emergency Debugging

If nothing works, try these steps:

1. **Check if server is running:**

   ```bash
   curl https://your-app-name.onrender.com/health
   ```

2. **Check if build exists:**

   ```bash
   curl https://your-app-name.onrender.com/api/test
   ```

3. **Check if React app loads:**

   ```bash
   curl https://your-app-name.onrender.com/
   ```

4. **Check Render logs** for specific error messages

## Contact Support

If you still have issues:

1. Share your Render URL
2. Share any error messages from browser console
3. Share any error messages from Render logs
4. Share the output of the automated check script
