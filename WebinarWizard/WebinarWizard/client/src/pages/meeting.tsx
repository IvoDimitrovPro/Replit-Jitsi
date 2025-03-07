import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { initJitsiMeet } from "@/lib/jitsi";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function loadJitsiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://8x8.vc/external_api.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

export default function Meeting() {
  const { roomName } = useParams<{ roomName: string }>();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: token, isLoading: isTokenLoading, error: tokenError } = useQuery<{ jwt: string }>({
    queryKey: [`/api/meetings/token/${roomName}`],
  });

  useEffect(() => {
    if (tokenError) {
      setError("Failed to obtain JWT token. Please check your server configuration.");
      console.error("Token error:", tokenError);
      return;
    }

    if (!token?.jwt || !jitsiContainerRef.current) return;

    // Get Jitsi domain from environment
    const domain = "8x8.vc";
    if (!domain) {
      setError("VITE_JITSI_DOMAIN environment variable is not set");
      return;
    }

    let cleanup: (() => void) | undefined;

    async function initializeJitsi() {
      try {
        await loadJitsiScript();
        cleanup = initJitsiMeet({
          container: jitsiContainerRef.current!,
          domain,
          roomName,
          jwt: token.jwt,
          displayName: "Meeting Participant"
        });
      } catch (err) {
        console.error("Failed to initialize Jitsi:", err);
        setError("Failed to initialize the meeting. Please try again.");
      }
    }

    initializeJitsi();
    return () => cleanup?.();
  }, [token, roomName, tokenError]);

  if (isTokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="text-center max-w-md text-muted-foreground">{error}</p>
        <Button onClick={() => setLocation('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <Card className="w-full h-[calc(100vh-2rem)]">
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </Card>
    </div>
  );
}