// APP.JS
// Purpose: Main application file
// Handles routing and authentication state

import React, { useState } from "react";
import { getCurrentUser, isLoggedIn } from "./api/auth";
import Login from "./pages/Login";

const App = () => {
  const [user, setUser] = useState(isLoggedIn() ? getCurrentUser() : null);

  const handleLogin = (data) => {
    setUser({
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      department: data.department,
    });
  };

  // If not logged in, show login screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Logged in — dashboard coming next
  return (
    <div style={{ padding: 24 }}>
      <h2>Hoş geldin, {user.full_name}!</h2>
      <p>Rol: {user.role}</p>
    </div>
  );
};

export default App;