"use client";

import { useState } from "react";

const defaultConfig = {
  scheme: "dejoy://",
  universalLink: "https://t.dejoy.io",
  appStoreId: "6737566580",
  packageName: "io.dejoy",
  fallbackUrl: "https://t.dejoy.io",
  timeout: "1500",
};

class AppOpener {
  constructor(config) {
    this.scheme = config.scheme;
    this.appStoreId = config.appStoreId;
    this.packageName = config.packageName;
    this.universalLink = config.universalLink;
    this.timeout = config.timeout || 1500;
    this.fallbackUrl = config.fallbackUrl;
    this.onLog = config.onLog || (() => {});

    const ua = navigator.userAgent;
    this.isIOS = /iPad|iPhone|iPod/.test(ua);
    this.isAndroid = /Android/.test(ua);
    this.isWechat = /MicroMessenger/i.test(ua);
  }

  getStoreUrl() {
    if (this.isIOS && this.appStoreId) {
      return `https://apps.apple.com/app/id${this.appStoreId}`;
    }

    if (this.isAndroid && this.packageName) {
      return `https://play.google.com/store/apps/details?id=${this.packageName}`;
    }

    if (this.appStoreId) {
      return `https://apps.apple.com/app/id${this.appStoreId}`;
    }

    if (this.packageName) {
      return `https://play.google.com/store/apps/details?id=${this.packageName}`;
    }

    return this.fallbackUrl || "https://www.apple.com/app-store/";
  }

  openStore() {
    const storeUrl = this.getStoreUrl();
    this.onLog(`跳转商店下载页: ${storeUrl}`);
    window.location.href = storeUrl;
  }

  open() {
    this.onLog(`UA: ${navigator.userAgent}`);
    this.onLog(
      `环境: iOS=${this.isIOS}, Android=${this.isAndroid}, WeChat=${this.isWechat}`,
    );

    if (this.isWechat) {
      this.handleWechat();
      return;
    }

    let timer = null;
    let opened = false;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("webkitvisibilitychange", onVisibilityChange);
    };

    const onVisibilityChange = () => {
      if (document.hidden || document.webkitHidden) {
        opened = true;
        cleanup();
        this.onLog("页面进入后台，判断为 App 已被唤起");
      }
    };

    const launchApp = () => {
      if (this.isIOS && this.universalLink) {
        this.onLog(`尝试 Universal Link: ${this.universalLink}`);
        window.location.href = this.universalLink;
        return;
      }

      if (this.scheme) {
        this.onLog(`尝试 Scheme: ${this.scheme}`);
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = this.scheme;
        document.body.appendChild(iframe);

        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 2000);
        return;
      }

      const storeUrl = this.getStoreUrl();
      this.onLog(`没有 Scheme，直接跳转: ${storeUrl}`);
      window.location.href = storeUrl;
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("webkitvisibilitychange", onVisibilityChange);

    timer = setTimeout(() => {
      if (!opened) {
        cleanup();
        const storeUrl = this.getStoreUrl();
        this.onLog(`超时未唤起，跳转: ${storeUrl}`);
        window.location.href = storeUrl;
      }
    }, this.timeout);

    launchApp();
  }

  handleWechat() {
    const storeUrl = this.getStoreUrl();
    this.onLog(`微信环境，提示复制链接: ${storeUrl}`);

    if (confirm(`检测到您在微信内，是否复制下载链接？\n${storeUrl}`)) {
      this.copyText(storeUrl);
    }
  }

  async copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("textarea");
        input.value = text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      alert("链接已复制，请在浏览器中打开");
      this.onLog("复制成功");
    } catch (error) {
      alert(`复制失败，请手动复制：${text}`);
      this.onLog(`复制失败: ${error.message}`);
    }
  }
}

export default function Home() {
  const [config, setConfig] = useState(defaultConfig);
  const [logs, setLogs] = useState(["等待测试..."]);

  const log = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((currentLogs) => [...currentLogs, `[${time}] ${message}`]);
  };

  const updateConfig = (key, value) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      [key]: value,
    }));
  };

  const getOpenerConfig = () => ({
    ...config,
    scheme: config.scheme.trim(),
    universalLink: config.universalLink.trim(),
    appStoreId: config.appStoreId.trim(),
    packageName: config.packageName.trim(),
    fallbackUrl: config.fallbackUrl.trim(),
    timeout: Number(config.timeout) || 1500,
    onLog: log,
  });

  const handleOpen = () => {
    setLogs(["开始测试唤起..."]);
    new AppOpener(getOpenerConfig()).open();
  };

  const handleStoreUrl = () => {
    const opener = new AppOpener(getOpenerConfig());
    opener.openStore();
  };

  return (
    <main className="container">
      <h1>App Opener 测试 Demo</h1>
      <p className="tips">
        建议用手机浏览器打开本页面测试。桌面浏览器通常无法真正唤起移动 App，
        超时后会跳转到应用商店或兜底链接。
      </p>

      <label htmlFor="scheme">Scheme</label>
      <input
        id="scheme"
        value={config.scheme}
        onChange={(event) => updateConfig("scheme", event.target.value)}
      />

      <label htmlFor="universalLink">Universal Link</label>
      <input
        id="universalLink"
        value={config.universalLink}
        onChange={(event) => updateConfig("universalLink", event.target.value)}
      />

      <label htmlFor="appStoreId">App Store ID</label>
      <input
        id="appStoreId"
        value={config.appStoreId}
        onChange={(event) => updateConfig("appStoreId", event.target.value)}
      />

      <label htmlFor="packageName">Android Package Name</label>
      <input
        id="packageName"
        value={config.packageName}
        onChange={(event) => updateConfig("packageName", event.target.value)}
      />

      <label htmlFor="fallbackUrl">Fallback URL</label>
      <input
        id="fallbackUrl"
        value={config.fallbackUrl}
        onChange={(event) => updateConfig("fallbackUrl", event.target.value)}
      />

      <label htmlFor="timeout">Timeout(ms)</label>
      <input
        id="timeout"
        type="number"
        value={config.timeout}
        onChange={(event) => updateConfig("timeout", event.target.value)}
      />

      <button type="button" onClick={handleOpen}>
        测试唤起 App
      </button>
      <button type="button" className="secondary" onClick={handleStoreUrl}>
        测试跳转商店下载页
      </button>

      <div className="log">{logs.join("\n")}</div>
    </main>
  );
}
