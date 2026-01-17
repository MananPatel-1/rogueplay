'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type GamingNode } from '@/lib/db/schema';
import { Monitor, Cpu, Zap } from 'lucide-react';

interface NodeCardProps {
  node: GamingNode;
  disabled?: boolean;
  isPending?: boolean;
}

export function NodeCard({ node, disabled, isPending }: NodeCardProps) {
  const isAvailable = node.status === 'available';

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <div className={`p-2 rounded-lg ${isAvailable ? 'bg-purple-600/20' : 'bg-gray-700'}`}>
            <Monitor className={`h-5 w-5 ${isAvailable ? 'text-purple-400' : 'text-gray-500'}`} />
          </div>
          {node.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-gray-500" />
            <span className="text-gray-400">RTX Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className={isAvailable ? 'text-green-400' : 'text-yellow-400'}>
              {isAvailable ? 'Available' : 'In Use'}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          disabled={disabled || isPending || !isAvailable}
          className={`w-full ${
            isAvailable
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Zap className="h-4 w-4 mr-2" />
          {isPending ? 'Starting...' : isAvailable ? 'Start Session' : 'Unavailable'}
        </Button>
      </CardFooter>
    </Card>
  );
}
