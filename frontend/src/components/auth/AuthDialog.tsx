"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthDialog({
  open,
  mode,
  onClose,
  onLogin,
  onRegister,
}: {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  if (!open) return null;

  const submit = async () => {
    try {
      setBusy(true);
      setErr(null);
      if (mode === "login") {
        await onLogin(email, pwd);
      } else {
        await onRegister(email, pwd, name);
      }
    } catch (error: any) {
      let msg = "Failed";
      if (error?.response?.data) {
        msg = error.response.data.message || error.response.data.error || msg;
      } else if (error?.message) {
        msg = error.message;
      }
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      <div className="w-[380px] rounded-xl bg-white p-5 shadow">
        <div className="text-lg font-semibold mb-3">{mode === "login" ? "Sign In" : "Register"}</div>
        {mode === "register" && (
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative mb-4">
          <input
            type={showPwd ? "text" : "password"}
            className="w-full border rounded px-3 py-2 pr-10"
            placeholder="Password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            aria-label="Toggle password visibility"
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {err ? <div className="text-sm text-red-600 mb-3">{err}</div> : null}
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={submit}
            className="flex-1 rounded bg-red-700 text-white px-4 py-2 disabled:opacity-50"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <button
            disabled={busy}
            onClick={onClose}
            className="rounded border px-4 py-2"
          >
            Cancel
          </button>
        </div>
        <div className="mt-3 text-sm">
          {mode === "login" ? (
            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("switch-auth", { detail: "register" })
                )
              }
              className="text-blue-700 underline"
            >
              Need an account? Register
            </button>
          ) : (
            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("switch-auth", { detail: "login" })
                )
              }
              className="text-blue-700 underline"
            >
              Have an account? Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
