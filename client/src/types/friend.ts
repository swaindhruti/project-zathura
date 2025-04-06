export type User = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
};

export type FriendRequest = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  sender?: User;
  receiver?: User;
  senderId: string;
  receiverId: string;
};
