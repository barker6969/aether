import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { WindowChrome } from "./components/WindowChrome";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import Dashboard from "./pages/Dashboard";
import MTKService from "./pages/MTKService";
import QualcommService from "./pages/QualcommService";
import IPhoneService from "./pages/IPhoneService";
import Logs from "./pages/Logs";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";

function Shell() {
  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
      <WindowChrome />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 bg-[#040405] bg-noise overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mtk" element={<MTKService />} />
            <Route path="/qualcomm" element={<QualcommService />} />
            <Route path="/iphone" element={<IPhoneService />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
