import "./globals.css";

export const metadata = {
  title: "App Opener 测试 Demo",
  description: "用于测试 H5 唤起 App、应用商店跳转和微信环境复制链接",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
