'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { approveUser, rejectUser } from '../../actions';
import { ActionState } from '@/lib/auth/middleware';
import { Loader2, Check, X } from 'lucide-react';

export function PendingUserActions({ userId }: { userId: number }) {
  const [approveState, approveAction, approvePending] = useActionState<
    ActionState,
    FormData
  >(approveUser, { error: '' });

  const [rejectState, rejectAction, rejectPending] = useActionState<
    ActionState,
    FormData
  >(rejectUser, { error: '' });

  const isPending = approvePending || rejectPending;

  return (
    <div className="flex items-center space-x-2">
      {(approveState?.error || rejectState?.error) && (
        <span className="text-red-500 text-sm mr-2">
          {approveState?.error || rejectState?.error}
        </span>
      )}
      <form action={approveAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {approvePending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Approve
            </>
          )}
        </Button>
      </form>
      <form action={rejectAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          disabled={isPending}
        >
          {rejectPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <X className="h-4 w-4 mr-1" />
              Reject
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
