
export type NotificationType = 'messages' | 'maintenance' | 'payments';

export type NotificationItem = {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
};

export type Notification = {
  type: NotificationType;
  count: number;
  items?: NotificationItem[];
};

export type MessageWithProfile = {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
};
