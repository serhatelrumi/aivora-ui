// LOGIN PAGE
// Purpose: Entry point of the application
// Elegant dark/light mode login screen with Aivora branding

import React, { useState } from "react";
import { Form, Input, Button, Alert, Switch } from "antd";
import { login } from "../api/auth";

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const colors = {
    bg: darkMode ? "#111214" : "#F9F8F6",
    card: darkMode ? "#1C1E22" : "#FFFFFF",
    border: darkMode ? "#2A2D32" : "#E5E5E7",
    text: darkMode ? "#F9F8F6" : "#111214",
    subtext: darkMode ? "#A0A4AE" : "#6B7280",
    gold: "#D4AF37",
    inputBg: darkMode ? "#2A2D32" : "#F9F8F6",
    inputText: darkMode ? "#FFFFFF" : "#111214",
    placeholder: darkMode ? "#6B7280" : "#9CA3AF",
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(values.username, values.password);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: colors.inputBg,
    border: `1px solid ${colors.border}`,
    color: colors.inputText,
    WebkitTextFillColor: colors.inputText,
    borderRadius: 8,
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.3s ease",
      fontFamily: "'Poppins', sans-serif",
    }}>

      {/* DARK MODE TOGGLE */}
      <div style={{
        position: "fixed",
        top: 24,
        right: 24,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{darkMode ? "🌙" : "☀️"}</span>
        <Switch
          checked={darkMode}
          onChange={setDarkMode}
          style={{ backgroundColor: darkMode ? "#D4AF37" : "#E5E5E7" }}
        />
      </div>

      {/* LOGIN CARD */}
      <div style={{
        width: 420,
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: "48px 40px",
        boxShadow: darkMode
          ? "0 8px 40px rgba(0,0,0,0.4)"
          : "0 8px 40px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
      }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img
            src={darkMode ? "/Aivora_Logo2.png" : "/Aivora_Logo.png"}
            alt="Aivora"
            style={{ height: 80, objectFit: "contain" }}
          />
          <div style={{
            marginTop: 12,
            fontSize: 11,
            letterSpacing: 3,
            color: colors.gold,
            fontWeight: 500,
            textTransform: "uppercase",
          }}>
            Kuyumcu Yönetim Sistemi
          </div>
          <div style={{
            width: 40,
            height: 1,
            background: colors.gold,
            margin: "16px auto 0",
            opacity: 0.6,
          }} />
        </div>

        {/* ERROR */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
        )}

        {/* FORM */}
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={
              <span style={{ color: colors.subtext, fontSize: 12, fontWeight: 500, letterSpacing: 1 }}>
                KULLANICI ADI
              </span>
            }
            name="username"
            rules={[{ required: true, message: "Kullanıcı adı gereklidir." }]}
          >
            <Input
              size="large"
              placeholder="kullanici_adi"
              style={inputStyle}
            />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ color: colors.subtext, fontSize: 12, fontWeight: 500, letterSpacing: 1 }}>
                ŞİFRE
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Şifre gereklidir." }]}
          >
            <Input.Password
              size="large"
              placeholder="••••••••"
              style={inputStyle}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{
                background: colors.gold,
                border: "none",
                color: "#111214",
                fontWeight: 600,
                borderRadius: 8,
                height: 48,
                fontSize: 14,
                letterSpacing: 1,
                fontFamily: "'Poppins', sans-serif",
                cursor: "pointer",
              }}
            >
              GİRİŞ YAP
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: 32,
        fontSize: 11,
        color: colors.subtext,
        letterSpacing: 1,
        textAlign: "center",
      }}>
        © 2026 Aivora · Tüm hakları saklıdır
      </div>
    </div>
  );
};

export default Login;