export type EntityId = string;
export type IsoDateString = string;
export type Cursor = string;
export type ChatType = 'direct' | 'group';

export type Nullable<T> = T | null;

export interface PublicUser {
  id: EntityId;
  email: string;
  username: string;
  displayName: Nullable<string>;
  avatarKey: Nullable<string>;
}

export interface PublicChat {
  id: EntityId;
  type: ChatType;
  title: string;
  members: PublicUser[];
  memberCount: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}
