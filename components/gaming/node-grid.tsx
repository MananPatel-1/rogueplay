'use client';

import { useActionState, useCallback } from 'react';
import useSWR from 'swr';
import { NodeCard } from './node-card';
import { SessionPanel } from './session-panel';
import { claimNode } from '@/lib/gaming/actions';
import { type GamingNode, type GamingSession } from '@/lib/db/schema';
import { Loader2 } from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
  sessionId?: number;
  serverIp?: string;
};

interface NodesResponse {
  nodes: GamingNode[];
  activeSession: (GamingSession & { node: GamingNode }) | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NodeGrid() {
  const { data, error, isLoading, mutate } = useSWR<NodesResponse>(
    '/api/gaming/nodes',
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
    }
  );

  const [claimState, claimAction, isClaimPending] = useActionState<ActionState, FormData>(claimNode, {});

  const handleSessionEnd = useCallback(() => {
    mutate(); // Refresh the data when session ends
  }, [mutate]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load gaming nodes</p>
        <p className="text-sm text-gray-500 mt-2">Please try again later</p>
      </div>
    );
  }

  // If user has active session, show session panel
  if (data?.activeSession) {
    return (
      <SessionPanel
        session={data.activeSession}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  // Otherwise show available nodes
  return (
    <div className="space-y-4">
      {claimState?.error && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
          {claimState.error}
        </div>
      )}

      {claimState?.success && (
        <div className="p-4 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
          Session started! Loading your gaming node...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.nodes?.map((node) => (
          <form key={node.id} action={claimAction}>
            <input type="hidden" name="nodeId" value={node.id} />
            <NodeCard
              node={node}
              disabled={isClaimPending}
              isPending={isClaimPending}
            />
          </form>
        ))}
      </div>

      {data?.nodes?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No nodes available at the moment.</p>
          <p className="text-sm mt-2 text-gray-500">Please check back later or wait for a node to become free.</p>
        </div>
      )}
    </div>
  );
}
