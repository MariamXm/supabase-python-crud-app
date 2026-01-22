import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import "./styles/auth.css";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value) => {
    return value.includes("@") && value.includes(".");
  };

  const login = async () => {
    const cleanEmail = email.trim();

    if (!isValidEmail(cleanEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }
  };

  return (
    <div className="auth-container">
      <h2>LOGIN TO YOUR ACCOUNT</h2>

      <input
        className="auth-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div>
        <button className="auth-button login-btn" onClick={login} disabled={loading}>
          Login
        </button>
      </div>
    </div>
  );
}
