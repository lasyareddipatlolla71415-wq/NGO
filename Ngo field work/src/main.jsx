import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const theme = createTheme({
  fontSizes: {
    xs: "15px",
    sm: "17px",
    md: "19px",
    lg: "21px",
    xl: "25px",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications />
          <AuthProvider>
            <App />
          </AuthProvider>
        </MantineProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);