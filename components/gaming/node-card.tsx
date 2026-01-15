'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type GamingNode } from '@/lib/db/schema';
import { Monitor } from 'lucide-react';

interface NodeCardProps {
  node: GamingNode;
  disabled?: boolean;
  isPending?: boolean;
}

export function NodeCard({ node, disabled, isPending }: NodeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          {node.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Status: {node.status}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          disabled={disabled || isPending || node.status !== 'available'}
          className="w-full"
        >
          {isPending ? 'Starting...' : 'Start Session'}
        </Button>
      </CardFooter>
    </Card>
  );
}
