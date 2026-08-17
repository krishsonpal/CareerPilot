/**
 * EmbeddedChatbot — Inline variant of InternshipChatbot
 *
 * Renders the streaming AI chat as an inline (non-floating) component
 * for use in the student dashboard and dedicated chat page.
 * All streaming logic is in InternshipChatbot (uses useChat hook internally).
 */

import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import InternshipChatbot from "./Chatbot/InternshipChatbot";

const EmbeddedChatbot = () => {
  const { token, userRole } = useContext(AppContext);
  const isStudent = token && userRole === "student";

  if (!isStudent) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "400px",
        gap: "16px",
        color: "rgba(255,255,255,0.7)",
        textAlign: "center",
        padding: "24px",
      }}>
        <div style={{ fontSize: "3rem" }}>🤖</div>
        <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "white" }}>
          AI Career Assistant
        </div>
        <div style={{ fontSize: "0.9rem", maxWidth: "320px" }}>
          Log in as a student to access your personalised AI career coach with real-time streaming.
        </div>
        <Link
          to="/login"
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            borderRadius: "10px",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <InternshipChatbot
      position="inline"
      className="embedded-chat"
    />
  );
};

export default EmbeddedChatbot;
