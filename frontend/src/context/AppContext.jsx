import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { generateDevice, COM_PORTS, ACTION_LOG_TEMPLATES, fillTemplate } from "../lib/mockData";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const formatTime = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

let logIdCounter = 0;

export const AppProvider = ({ children }) => {
  const [status, setStatus] = useState("idle"); // idle | searching | connected | working
  const [device, setDevice] = useState(null);
  const [comPort, setComPort] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeAction, setActiveAction] = useState(null);
  const [progress, setProgress] = useState(0);
  const [autoConnect, setAutoConnect] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [credits, setCredits] = useState(100);
  const timersRef = useRef([]);

  const pushLog = useCallback((level, text) => {
    setLogs((prev) => {
      const next = [
        ...prev,
        { id: ++logIdCounter, ts: formatTime(), level, text },
      ];
      return next.length > 500 ? next.slice(-500) : next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    pushLog("INFO", "Console cleared by user.");
  }, [pushLog]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const startSearch = useCallback(() => {
    clearTimers();
    setStatus("searching");
    setDevice(null);
    setComPort(null);
    pushLog("INFO", "Aether driver loaded. Scanning USB bus ...");
    pushLog("INFO", "Listening on COM ports: " + COM_PORTS.join(", "));

    const t1 = setTimeout(() => pushLog("INFO", "Probing for MTK preloader signature ..."), 900);
    const t2 = setTimeout(() => pushLog("INFO", "Probing for Qualcomm EDL 9008 ..."), 1700);
    const t3 = setTimeout(() => {
      const dev = generateDevice("auto");
      const port = COM_PORTS[Math.floor(Math.random() * COM_PORTS.length)];
      setDevice(dev);
      setComPort(port);
      setStatus("connected");
      pushLog("SUCCESS", `Handshake OK on ${port}`);
      pushLog("SUCCESS", `Device detected: ${dev.model}`);
      pushLog("INFO", `Brand: ${dev.brand} | Android ${dev.android} | Patch ${dev.patch}`);
    }, 2800);
    timersRef.current = [t1, t2, t3];
  }, [pushLog]);

  const disconnect = useCallback(() => {
    clearTimers();
    pushLog("WARN", "Device disconnected by user.");
    setStatus("idle");
    setDevice(null);
    setComPort(null);
    setActiveAction(null);
    setProgress(0);
  }, [pushLog]);

  const runAction = useCallback(
    (actionKey, label) => {
      if (status !== "connected" || activeAction) return;
      const template = ACTION_LOG_TEMPLATES[actionKey];
      if (!template) return;
      setActiveAction(label);
      setStatus("working");
      setProgress(0);
      pushLog("INFO", `>>> EXECUTING: ${label}`);

      template.forEach((step, idx) => {
        const t = setTimeout(
          () => {
            pushLog(step.level, fillTemplate(step.text, device));
            setProgress(Math.round(((idx + 1) / template.length) * 100));
            if (idx === template.length - 1) {
              const finishT = setTimeout(() => {
                setActiveAction(null);
                setStatus("connected");
                setProgress(0);
              }, 600);
              timersRef.current.push(finishT);
            }
          },
          (idx + 1) * 700
        );
        timersRef.current.push(t);
      });
    },
    [status, activeAction, device, pushLog]
  );

  // Boot sequence
  useEffect(() => {
    pushLog("INFO", "[Aether] Initializing modules...");
    const boot = [
      { delay: 250, level: "INFO", text: "[Aether] Loading kernel driver aether-usb 2.4.1 ... OK" },
      { delay: 500, level: "INFO", text: "[Aether] Qualcomm Sahara Engine Loaded" },
      { delay: 750, level: "INFO", text: "[Aether] MediaTek BROM Engine Loaded" },
      { delay: 1000, level: "INFO", text: "[Aether] Apple DFU Pipeline Loaded (checkm8 / pongoOS)" },
      { delay: 1250, level: "INFO", text: "[Aether] Wallet sync · license active" },
      { delay: 1500, level: "SUCCESS", text: "[Aether] Ready. Awaiting target device." },
    ];
    boot.forEach((b) => {
      const t = setTimeout(() => pushLog(b.level, b.text), b.delay);
      timersRef.current.push(t);
    });
    if (autoConnect) {
      const t = setTimeout(() => startSearch(), 1900);
      timersRef.current.push(t);
    }
    return () => clearTimers();
  }, []);

  const value = {
    status,
    device,
    comPort,
    logs,
    activeAction,
    progress,
    autoConnect,
    soundEnabled,
    credits,
    setCredits,
    setAutoConnect,
    setSoundEnabled,
    startSearch,
    disconnect,
    runAction,
    pushLog,
    clearLogs,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
