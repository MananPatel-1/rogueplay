import { Inngest, EventSchemas } from 'inngest';

// Define event types for type safety
type Events = {
  'gaming/vm.start.requested': {
    data: {
      sessionId: number;
      nodeId: number;
      tensorDockInstanceId: string;
    };
  };
};

export const inngest = new Inngest({
  id: 'gaming-saas',
  schemas: new EventSchemas().fromRecord<Events>(),
});
