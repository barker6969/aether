import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { generateDevice, COM_PORTS, ACTION_LOG_TEMPLATES, fillTemplate } from "../lib/mockData";
import { useCliBridge } from "../hooks/useCliBridge";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// Mapping from a UI action key to the JSON-RPC method on the local CLI bridge.
// When the bridge is connected we call the real method (which streams
// mtkclient output back as log lines). When the bridge is offline we fall
// back to the deterministic demo simulation in mockData.js.
const BRIDGE_METHODS = {
  bypass_frp:        { method: "mtk.frp_bypass" },
  unlock_bootloader: { method: "mtk.unlock_bootloader" },
  erase_userdata:    { method: "mtk.erase_userdata" },
  read_info:         { method: "mtk.read_info" },
  // repair_imei requires user input (an IMEI); handled separately by a future modal.
};

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
  const cliBridge = useCliBridge();

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

      // PATH A — bridge is live AND we have a real method for this action.
      // Stream mtkclient output line-by-line into the console.
      const bridgeMap = BRIDGE_METHODS[actionKey];
      if (
        bridgeMap &&
        cliBridge.status === "connected" &&
        typeof cliBridge.runJob === "function"
      ) {
        setActiveAction(label);
        setStatus("working");
        setProgress(0);
        pushLog("INFO", `>>> EXECUTING (LIVE): ${label}`);
        pushLog("INFO", `aether-cli → ${bridgeMap.method}`);

        cliBridge
          .runJob(bridgeMap.method, bridgeMap.params || {}, (ev) => {
            if (ev.stream === "stdout" && ev.line) {
              pushLog("INFO", ev.line);
            } else if (ev.stream === "stderr" && ev.line) {
              pushLog("WARN", ev.line);
            } else if (ev.stream === "done") {
              if (ev.exit_code === 0) {
                pushLog("SUCCESS", `${label} completed (exit 0).`);
              } else {
                pushLog("ERROR", `${label} failed (exit ${ev.exit_code}).`);
              }
              const finishT = setTimeout(() => {
                setActiveAction(null);
                setStatus("connected");
                setProgress(0);
              }, 600);
              timersRef.current.push(finishT);
            }
          })
          .catch((e) => {
            pushLog("ERROR", `bridge error: ${e?.message || e}`);
            setActiveAction(null);
            setStatus("connected");
            setProgress(0);
          });
        return;
      }

      // PATH B — DEMO MODE. No bridge, no real CLI: play back the canned
      // mockData template so the dashboard still feels alive for prospects.
      const template = ACTION_LOG_TEMPLATES[actionKey];
      if (!template) return;
      setActiveAction(label);
      setStatus("working");
      setProgress(0);
      pushLog("INFO", `>>> EXECUTING (DEMO): ${label}`);

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
    [status, activeAction, device, pushLog, cliBridge]
  );

  // Boot sequence — ref-guarded so it runs once even if deps change.
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
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
  }, [autoConnect, pushLog, startSearch]);

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
    cliBridge,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
