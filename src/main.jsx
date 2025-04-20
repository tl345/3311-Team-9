import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { SportsProvider } from "./context/SportsContext";

// Wrapping the App component with BrowserRouter and SportsProvider
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <SportsProvider>
          <App />
        </SportsProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )