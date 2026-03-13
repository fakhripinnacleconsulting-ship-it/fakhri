
"use client";
import { useSession } from "next-auth/react";

export default function DebugPage() {
    const { data: session, status } = useSession();

    return (
        <div style={{ padding: '20px' }}>
            <h1>Session Debug</h1>
            <p>Status: {status}</p>
            <pre>{JSON.stringify(session, null, 2)}</pre>
            <button onClick={() => window.location.reload()}>Reload</button>
        </div>
    );
}
