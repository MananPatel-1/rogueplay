import { getPendingUsers } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PendingUserActions } from './pending-user-actions';
import { UserX } from 'lucide-react';

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default async function PendingUsersPage() {
  const pendingUsers = await getPendingUsers();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Pending User Approvals</h1>

      <Card>
        <CardHeader>
          <CardTitle>Users Awaiting Approval</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length > 0 ? (
            <ul className="space-y-4">
              {pendingUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      {user.name && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Signed up {getRelativeTime(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  <PendingUserActions userId={user.id} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <UserX className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No pending approvals</p>
              <p className="text-sm text-gray-400">
                New user signups will appear here for approval.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
