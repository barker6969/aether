// Mock device generators for Aether Repair Tool
const MTK_DEVICES = [
  { model: "MT6895 (Dimensity 8100)", brand: "Xiaomi Redmi K50", android: "13", patch: "2024-08-05" },
  { model: "MT6983 (Dimensity 9000)", brand: "OPPO Find X5", android: "13", patch: "2024-09-01" },
  { model: "MT6789 (Helio G99)", brand: "Realme Narzo 60", android: "14", patch: "2024-11-05" },
  { model: "MT6781 (Helio G96)", brand: "Tecno Camon 19", android: "12", patch: "2024-04-01" },
  { model: "MT6877 (Dimensity 920)", brand: "Vivo V23 Pro", android: "13", patch: "2024-07-05" },
];

const QC_DEVICES = [
  { model: "SM8650 (Snapdragon 8 Gen 3)", brand: "Samsung S24 Ultra", android: "14", patch: "2024-12-01" },
  { model: "SM8550 (Snapdragon 8 Gen 2)", brand: "OnePlus 11", android: "14", patch: "2024-10-05" },
  { model: "SM7475 (Snapdragon 7+ Gen 2)", brand: "Realme GT Neo 5", android: "13", patch: "2024-06-01" },
  { model: "SM6375 (Snapdragon 695)", brand: "Motorola G73", android: "13", patch: "2024-05-05" },
  { model: "SM8475 (Snapdragon 8+ Gen 1)", brand: "ASUS ROG 6", android: "13", patch: "2024-08-05" },
];

const randomHex = (len) =>
  Array.from({ length: len }, () =>
    "0123456789ABCDEF"[Math.floor(Math.random() * 16)]
  ).join("");

const randomIMEI = () => {
  let base = "";
  for (let i = 0; i < 14; i++) base += Math.floor(Math.random() * 10);
  return base + Math.floor(Math.random() * 10);
};

const maskIMEI = (imei) => imei.slice(0, 4) + " ****** " + imei.slice(-3);

const randomSerial = () => "R9F" + randomHex(8);

export const generateDevice = (chipset = "auto") => {
  const pool =
    chipset === "MTK" ? MTK_DEVICES : chipset === "QC" ? QC_DEVICES : Math.random() < 0.5 ? MTK_DEVICES : QC_DEVICES;
  const base = pool[Math.floor(Math.random() * pool.length)];
  const imei = randomIMEI();
  const imei2 = randomIMEI();
  const platform = MTK_DEVICES.includes(base) ? "MediaTek" : "Qualcomm";
  return {
    ...base,
    platform,
    imei,
    imei_masked: maskIMEI(imei),
    imei2,
    imei2_masked: maskIMEI(imei2),
    serial: randomSerial(),
    bootloader: platform === "MediaTek" ? "BROM v" + (5 + Math.floor(Math.random() * 6)) + ".2104" : "EDL 9008",
    cpuId: randomHex(16),
    storage: ["128GB UFS 3.1", "256GB UFS 3.1", "512GB UFS 4.0"][Math.floor(Math.random() * 3)],
    ram: ["6GB", "8GB", "12GB", "16GB"][Math.floor(Math.random() * 4)],
    region: ["EU", "GLOBAL", "INDIA", "CN", "MEA"][Math.floor(Math.random() * 5)],
    detectedAt: new Date(),
  };
};

export const COM_PORTS = ["COM3", "COM5", "COM7", "USB-Serial CH340", "USB Mass Storage"];

export const ACTION_LOG_TEMPLATES = {
  bypass_frp: [
    { level: "INFO", text: "Initiating FRP bypass sequence ..." },
    { level: "INFO", text: "Loading auth file: $PLATFORM_auth_v3.bin" },
    { level: "INFO", text: "Sending DA (Download Agent) to preloader..." },
    { level: "INFO", text: "Reading partition table from emmc_user ..." },
    { level: "INFO", text: "Locating frp partition @ 0x{HEX} ..." },
    { level: "WARN", text: "Anti-rollback counter: 8 — proceeding read-only" },
    { level: "INFO", text: "Patching factory reset protection flags ..." },
    { level: "SUCCESS", text: "FRP successfully bypassed. Reboot device to apply." },
  ],
  repair_imei: [
    { level: "INFO", text: "Reading current IMEI from NV partition ..." },
    { level: "INFO", text: "Backing up md1img → /backup/md1img_{TS}.bin" },
    { level: "INFO", text: "Calculating Luhn checksum ..." },
    { level: "INFO", text: "Writing IMEI1: {IMEI}" },
    { level: "INFO", text: "Writing IMEI2: {IMEI2}" },
    { level: "SUCCESS", text: "IMEI repair complete. Verify with *#06#" },
  ],
  unlock_bootloader: [
    { level: "WARN", text: "WARNING: This will erase all userdata." },
    { level: "INFO", text: "Requesting unlock token from device ..." },
    { level: "INFO", text: "Token: {HEX} — verifying signature ..." },
    { level: "INFO", text: "Sending fastboot oem unlock-go ..." },
    { level: "INFO", text: "Erasing locked partition headers ..." },
    { level: "SUCCESS", text: "Bootloader unlocked. OEM lock = 0" },
  ],
  erase_userdata: [
    { level: "WARN", text: "Beginning destructive operation: format userdata" },
    { level: "INFO", text: "Unmounting /data ..." },
    { level: "INFO", text: "Issuing TRIM on userdata partition ..." },
    { level: "INFO", text: "Wiping metadata + dalvik-cache ..." },
    { level: "SUCCESS", text: "Userdata erased. Device will boot to setup wizard." },
  ],
  read_info: [
    { level: "INFO", text: "Probing chipset over USB ..." },
    { level: "INFO", text: "Detected: {MODEL}" },
    { level: "INFO", text: "CPU ID: {CPUID}" },
    { level: "INFO", text: "Serial: {SERIAL}" },
    { level: "SUCCESS", text: "Device fingerprint captured." },
  ],
};

export const fillTemplate = (text, device) =>
  text
    .replace("{HEX}", "0x" + randomHex(8))
    .replace("{IMEI}", device?.imei || randomIMEI())
    .replace("{IMEI2}", device?.imei2 || randomIMEI())
    .replace("{TS}", Date.now())
    .replace("{MODEL}", device?.model || "Unknown")
    .replace("{CPUID}", device?.cpuId || randomHex(16))
    .replace("{SERIAL}", device?.serial || randomSerial())
    .replace("$PLATFORM", device?.platform === "MediaTek" ? "mtk" : "qcom");
