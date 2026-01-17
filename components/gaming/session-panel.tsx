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
      case GamingSessionStatus.FAILED:
        return 'Failed';
      default:
        return session.status;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Active Session: {session.node.name}</span>
          <span className="flex items-center gap-2 text-sm font-normal text-purple-300">
            <Clock className="h-4 w-4" />
            {timeRemaining}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session status indicator */}
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <p className="font-medium text-white">Status: <span className="text-purple-300">{getStatusDisplay()}</span></p>
        </div>

        {/* Starting state */}
        {session.status === GamingSessionStatus.STARTING && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <span className="ml-2 text-gray-400">Starting your gaming VM...</span>
          </div>
        )}

        {/* Server URL section - shown when VM is ready */}
        {session.node.serverIp && session.status !== GamingSessionStatus.STARTING && (
          <div className="space-y-2">
            <Label className="text-gray-300">Server URL (copy to Moonlight)</Label>
            <div className="flex gap-2">
              <Input value={session.node.serverIp} readOnly className="font-mono bg-gray-700 border-gray-600 text-white" />
              <Button variant="outline" size="icon" onClick={copyServerUrl} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Add this IP address in your Moonlight client to connect
            </p>
          </div>
        )}

        {/* PIN input section - shown when awaiting pairing */}
        {session.status === GamingSessionStatus.AWAITING_PAIRING && (
          <form action={pinAction} className="space-y-4">
            <input type="hidden" name="sessionId" value={session.id} />
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-gray-300">Enter PIN from Moonlight</Label>
              <Input
                id="pin"
                name="pin"
                type="text"
                placeholder="Enter 4-digit PIN"
                maxLength={8}
                className="font-mono text-center text-lg tracking-widest bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                After adding the server in Moonlight, it will display a PIN. Enter it here to complete pairing.
              </p>
            </div>
            {pinState?.error && (
              <p className="text-red-400 text-sm">{pinState.error}</p>
            )}
            {pinState?.success && (
              <p className="text-green-400 text-sm">{pinState.success}</p>
            )}
            <Button type="submit" disabled={isPinPending} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
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
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-green-400 font-medium">
              Connected! You can now play games via Moonlight.
            </p>
          </div>
        )}

        {/* Failed session info */}
        {session.status === GamingSessionStatus.FAILED && (
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-red-400 font-medium">
              Failed to start the gaming VM. {session.endReason && `Reason: ${session.endReason}`}
            </p>
            <p className="text-red-500/80 text-sm mt-2">
              Please end this session and try again.
            </p>
          </div>
        )}

        {/* Release button */}
        <form action={releaseAction}>
          <input type="hidden" name="sessionId" value={session.id} />
          {releaseState?.error && (
            <p className="text-red-400 text-sm mb-2">{releaseState.error}</p>
          )}
          <Button
            type="submit"
            variant="destructive"
            disabled={isReleasePending || session.status === GamingSessionStatus.ENDING}
            className="w-full bg-red-600 hover:bg-red-700"
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
