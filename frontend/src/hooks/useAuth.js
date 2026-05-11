import { useContext } from "react";
import { AuthContext } from "../context/auth-context.js";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé sous AuthProvider");
  return ctx;
}
