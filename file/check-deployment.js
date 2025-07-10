const https = require("https");
const http = require("http");

// Configuration - Replace with your actual Render URL
const BASE_URL = process.env.RENDER_URL || "https://your-app-name.onrender.com";

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        "User-Agent": "Deployment-Checker/1.0",
        ...options.headers,
      },
      timeout: 10000, // 10 second timeout
    };

    const req = client.request(requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log("\n🔍 Testing Health Endpoint...");
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log("✅ Health endpoint working");
      console.log("   Response:", response.data);
    } else {
      console.log("❌ Health endpoint failed");
      console.log("   Status:", response.status);
      console.log("   Response:", response.raw);
    }
  } catch (error) {
    console.log("❌ Health endpoint error:", error.message);
  }
}

async function testApiEndpoint() {
  console.log("\n🔍 Testing API Endpoint...");
  try {
    const response = await makeRequest(`${BASE_URL}/api/test`);
    if (response.status === 200) {
      console.log("✅ API endpoint working");
      console.log("   Build exists:", response.data.buildExists);
      console.log("   Environment:", response.data.environment);
      console.log("   Port:", response.data.port);
    } else {
      console.log("❌ API endpoint failed");
      console.log("   Status:", response.status);
      console.log("   Response:", response.raw);
    }
  } catch (error) {
    console.log("❌ API endpoint error:", error.message);
  }
}

async function testMainApp() {
  console.log("\n🔍 Testing Main App...");
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    if (response.status === 200) {
      console.log("✅ Main app loading");
      if (response.raw.includes("React App")) {
        console.log("   ✅ React app detected");
      } else {
        console.log("   ⚠️  React app not detected in response");
      }
    } else {
      console.log("❌ Main app failed");
      console.log("   Status:", response.status);
    }
  } catch (error) {
    console.log("❌ Main app error:", error.message);
  }
}

async function testStaticFiles() {
  console.log("\n🔍 Testing Static Files...");
  try {
    const response = await makeRequest(
      `${BASE_URL}/static/js/main.6ede2efb.js`
    );
    if (response.status === 200) {
      console.log("✅ Static JS files loading");
    } else {
      console.log("❌ Static JS files failed");
      console.log("   Status:", response.status);
    }
  } catch (error) {
    console.log("❌ Static files error:", error.message);
  }
}

async function testSocketIO() {
  console.log("\n🔍 Testing Socket.IO Connection...");
  try {
    // Test if Socket.IO endpoint responds
    const response = await makeRequest(`${BASE_URL}/socket.io/`);
    if (response.status === 200 || response.status === 400) {
      console.log("✅ Socket.IO endpoint responding");
    } else {
      console.log("❌ Socket.IO endpoint failed");
      console.log("   Status:", response.status);
    }
  } catch (error) {
    console.log("❌ Socket.IO test error:", error.message);
  }
}

async function checkRenderStatus() {
  console.log("\n🔍 Checking Render Status...");
  console.log("   Base URL:", BASE_URL);
  console.log("   Environment:", process.env.NODE_ENV || "development");

  // Test basic connectivity
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log("✅ Server is running and responding");
    } else {
      console.log("❌ Server is not responding properly");
    }
  } catch (error) {
    console.log("❌ Cannot connect to server:", error.message);
  }
}

// Main function
async function runChecks() {
  console.log("🚀 Starting Deployment Error Check...");
  console.log("=====================================");

  await checkRenderStatus();
  await testHealthEndpoint();
  await testApiEndpoint();
  await testMainApp();
  await testStaticFiles();
  await testSocketIO();

  console.log("\n=====================================");
  console.log("🏁 Error check completed!");
  console.log("\n📋 Next Steps:");
  console.log("1. If you see ❌ errors, check Render logs");
  console.log("2. If main app fails, check build process");
  console.log("3. If Socket.IO fails, check WebSocket settings");
  console.log("4. Check browser console for client-side errors");
}

// Run the checks
if (require.main === module) {
  runChecks().catch(console.error);
}

module.exports = { runChecks };
