'use client';

import { useState, useEffect, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type GamingSession, type GamingNode, GamingSessionStatus } from '@/lib/db/schema';
import { submitPin, releaseSession } from '@/lib/gaming/actions';
import { Clock, Copy, Check, Loader2 } from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
};

interface SessionPanelProps {
  session: GamingSession & { node: GamingNode };
  onSessionEnd?: () => void;
}

export function SessionPanel({ session, onSessionEnd }: SessionPanelProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [pinState, pinAction, isPinPending] = useActionState<ActionState, FormData>(submitPin, {});
  const [releaseState, releaseAction, isReleasePending] = useActionState<ActionState, FormData>(releaseSession, {});

  // Timer countdown effect
  useEffect(() => {
    const updateTimer = () => {
      const remaining = new Date(session.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeRemaining('Expired');
        onSessionEnd?.();
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.expiresAt, onSessionEnd]);

  // Handle successful release
  useEffect(() => {
    if (releaseState?.success) {
      onSessionEnd?.();
    }
  }, [releaseState, onSessionEnd]);

  const copyServerUrl = () => {
    if (session.node.serverIp) {
      navigator.clipboard.writeText(session.node.serverIp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusDisplay = () => {
    switch (session.status) {
      case GamingSessionStatus.STARTING:
        return 'Starting VM...';
      case GamingSessionStatus.AWAITING_PAIRING:
        return 'Awaiting Pairing';
      case GamingSessionStatus.ACTIVE:
        return 'Active';
      case GamingSessionStatus.ENDING:
        return 'Ending...';
      default:
        return session.status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Session: {session.node.name}</span>
          <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <Clock className="h-4 w-4" />
            {timeRemaining}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session status indicator */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">Status: {getStatusDisplay()}</p>
        </div>

        {/* Starting state */}
        {session.status === GamingSessionStatus.STARTING && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Starting your gaming VM...</span>
          </div>
        )}

        {/* Server URL section - shown when VM is ready */}
        {session.node.serverIp && session.status !== GamingSessionStatus.STARTING && (
          <div className="space-y-2">
            <Label>Server URL (copy to Moonlight)</Label>
            <div className="flex gap-2">
              <Input value={session.node.serverIp} readOnly className="font-mono" />
              <Button variant="outline" size="icon" onClick={copyServerUrl}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add this IP address in your Moonlight client to connect
            </p>
          </div>
        )}

        {/* PIN input section - shown when awaiting pairing */}
        {session.status === GamingSessionStatus.AWAITING_PAIRING && (
          <form action={pinAction} className="space-y-4">
            <input type="hidden" name="sessionId" value={session.id} />
            <div className="space-y-2">
              <Label htmlFor="pin">Enter PIN from Moonlight</Label>
              <Input
                id="pin"
                name="pin"
                type="text"
                placeholder="Enter 4-digit PIN"
                maxLength={8}
                className="font-mono text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                After adding the server in Moonlight, it will display a PIN. Enter it here to complete pairing.
              </p>
            </div>
            {pinState?.error && (
              <p className="text-destructive text-sm">{pinState.error}</p>
            )}
            {pinState?.success && (
              <p className="text-green-600 text-sm">{pinState.success}</p>
            )}
            <Button type="submit" disabled={isPinPending} className="w-full">
              {isPinPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pairing...
                </>
              ) : (
                'Submit PIN'
              )}
            </Button>
          </form>
        )}

        {/* Active session info */}
        {session.status === GamingSessionStatus.ACTIVE && (
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-300 font-medium">
              Connected! You can now play games via Moonlight.
            </p>
          </div>
        )}

        {/* Release button */}
        <form action={releaseAction}>
          <input type="hidden" name="sessionId" value={session.id} />
          {releaseState?.error && (
            <p className="text-destructive text-sm mb-2">{releaseState.error}</p>
          )}
          <Button
            type="submit"
            variant="destructive"
            disabled={isReleasePending || session.status === GamingSessionStatus.ENDING}
            className="w-full"
          >
            {isReleasePending || session.status === GamingSessionStatus.ENDING ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ending Session...
              </>
            ) : (
              'End Session'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
