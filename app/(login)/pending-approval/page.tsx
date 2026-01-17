import Link from 'next/link';
import { CircleIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <div className="mt-6 flex justify-center">
          <Clock className="h-16 w-16 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Account Pending Approval
        </h2>
        <p className="mt-4 text-center text-gray-600">
          Your account has been created successfully and is pending admin approval.
        </p>
        <p className="mt-2 text-center text-gray-500 text-sm">
          You will be able to sign in once an administrator approves your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/sign-in">
          <Button
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
