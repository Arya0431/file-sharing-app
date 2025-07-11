import React, { useState } from "react";

const AuthForm = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const SOCKET_URL = window.location.origin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("Submitting login/register:", { username, password, mode }); // Debug log
    try {
      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const res = await fetch(`${SOCKET_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      console.log("Login/register response:", data); // Debug log
      if (!res.ok) {
        console.log(
          "Login failed with status:",
          res.status,
          "Message:",
          data.message
        );
        setError(data.message || "Unknown error");
      } else if (mode === "login") {
        console.log(
          "Login successful - Token received from backend:",
          data.token
        ); // Debug log
        onAuthSuccess(data.token, username);
      } else {
        setMode("login");
        setError("Registration successful! Please log in.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Login" : "Register"}</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
        <div className="auth-toggle">
          {mode === "login" ? (
            <span>
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("register")}>
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")}>
                Login
              </button>
            </span>
          )}
        </div>
        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
};

export default AuthForm;
