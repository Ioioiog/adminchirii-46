
export type NotificationType = 'messages' | 'maintenance' | 'payments';

export type NotificationItem = {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  sender_id?: string; // Added sender_id as optional property
};

export type Notification = {
  type: NotificationType;
  count: number;
  items?: NotificationItem[];
};

export type NotificationState = {
  data: Notification[];
  markAsRead: (type: NotificationType) => Promise<void>;
};
