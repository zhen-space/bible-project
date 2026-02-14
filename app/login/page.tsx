"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem("adminKey") ?? "";
      if (existing) setKey(existing);
    } catch {}
  }, []);

  function save() {
    try {
      localStorage.setItem("adminKey", key.trim());
      setSaved(true);
      router.push("/");
    } catch {
      alert("存取 localStorage 失敗（可能是瀏覽器限制）");
    }
  }

  function clear() {
    try {
      localStorage.removeItem("adminKey");
      setKey("");
      setSaved(false);
      alert("已清除管理 key");
    } catch {}
  }

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>管理入口</h1>
      <div style={{ color: "#666", marginBottom: 16 }}>
        只有你自己用：輸入管理 key 之後，才會在註釋上看到「刪除」按鈕。
      </div>

      <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
        Admin Key
      </label>
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="輸入 ADMIN_DELETE_KEY"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ccc",
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={save}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          儲存並回首頁
        </button>

        <button
          onClick={clear}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          清除
        </button>
      </div>

      {saved && <div style={{ marginTop: 12, color: "#0a7" }}>已儲存 ✅</div>}
    </main>
  );
}
