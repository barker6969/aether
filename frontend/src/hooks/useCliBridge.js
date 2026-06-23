import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useCliBridge — connect to the local Aether CLI WebSocket bridge.
 *
 * 1. Reads `localStorage.aether.bridge` (default: `ws://127.0.0.1:8765`).
 * 2. Auto-reconnects every 5s if the CLI is offline.
 * 3. Performs a JSON-RPC `hello` handshake on connect.
 * 4. Returns { status, info, call, lastEvent }.
 *
 * NOTE: native WebSocket cannot speak raw TCP/newline-JSON — the CLI must run
 * an actual WS upgrade (e.g. via `tokio-tungstenite`). Until then this hook
 * sits idle and reports `status = "offline"`, which is the correct behaviour
 * for demo mode.
 */
const DEFAULT_URL = "ws://127.0.0.1:8765";

let rpcId = 0;

export function useCliBridge() {
  const [status, setStatus] = useState("offline"); // offline | connecting | connected
  const [info, setInfo] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const wsRef = useRef(null);
  const pendingRef = useRef(new Map());
  const reconnectRef = useRef(null);

  const url =
    (typeof window !== "undefined" &&
      window.localStorage?.getItem("aether.bridge")) ||
    DEFAULT_URL;

  const enabled =
    typeof window !== "undefined" &&
    window.localStorage?.getItem("aether.bridge.enabled") === "1";

  const cleanup = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;
    setStatus("connecting");
    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      setStatus("offline");
      reconnectRef.current = setTimeout(connect, 5000);
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      // handshake
      const id = ++rpcId;
      ws.send(JSON.stringify({ jsonrpc: "2.0", id, method: "hello", params: {} }));
      pendingRef.current.set(id, (res) => setInfo(res));
    };

    ws.onmessage = (msg) => {
      let payload;
      try { payload = JSON.parse(msg.data); } catch { return; }
      if (payload.id != null && pendingRef.current.has(payload.id)) {
        const cb = pendingRef.current.get(payload.id);
        pendingRef.current.delete(payload.id);
        cb(payload.result ?? payload.error);
      } else if (payload.method === "event") {
        setLastEvent(payload.params);
      }
    };

    ws.onerror = () => { /* will trigger onclose */ };
    ws.onclose = () => {
      setStatus("offline");
      setInfo(null);
      wsRef.current = null;
      reconnectRef.current = setTimeout(connect, 5000);
    };
  }, [enabled, url]);

  const call = useCallback((method, params = {}) => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error("CLI offline"));
        return;
      }
      const id = ++rpcId;
      pendingRef.current.set(id, resolve);
      ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
      // 8s timeout
      setTimeout(() => {
        if (pendingRef.current.has(id)) {
          pendingRef.current.delete(id);
          reject(new Error("CLI timeout"));
        }
      }, 8000);
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return cleanup;
  }, [enabled, connect, cleanup]);

  return { status, info, lastEvent, call, enabled, url };
}
