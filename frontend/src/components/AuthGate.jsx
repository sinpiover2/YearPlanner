import { useEffect, useState } from "react";
import {
  getUser,
  handleAuthCallback,
  logout,
  oauthLogin,
} from "@netlify/identity";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const callback = await handleAuthCallback();
        const currentUser = callback?.user ?? (await getUser());
        if (active) {
          setUser(currentUser);
          setStatus("ready");
        }
      } catch {
        if (active) {
          setError("Google sign-in could not be completed.");
          setStatus("ready");
        }
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <main className="auth-gate"><p>Checking teacher access…</p></main>;
  }

  if (!user) {
    return (
      <main className="auth-gate">
        <section className="auth-card" aria-labelledby="auth-title">
          <p className="auth-eyebrow">Year Planner</p>
          <h1 id="auth-title">Teacher access</h1>
          <p>Sign in with the invited Google account to open the planner.</p>
          {error && <p role="alert" className="auth-error">{error}</p>}
          <button type="button" onClick={() => oauthLogin("google")}>Continue with Google</button>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="auth-session-bar">
        <span>Signed in as {user.email}</span>
        <button
          type="button"
          onClick={async () => {
            await logout();
            setUser(null);
          }}
        >
          Sign out
        </button>
      </div>
      {children}
    </>
  );
}
