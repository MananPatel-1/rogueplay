'use client';

import { Suspense } from 'react';
import { NodeGrid } from '@/components/gaming/node-grid';
import { Loader2 } from 'lucide-react';

function LoadingFallback() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-2">Cloud Gaming</h1>
      <p className="text-muted-foreground mb-8">
        Select an available gaming node to start your session.
        Sessions last 3 hours and can be released early.
      </p>
      <Suspense fallback={<LoadingFallback />}>
        <NodeGrid />
      </Suspense>
    </section>
  );
}
