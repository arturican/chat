export type EntityId = string;
export type IsoDateString = string;
export type Cursor = string;

export type Nullable<T> = T | null;

export interface PublicUser {
  id: EntityId;
  email: string;
  username: string;
  displayName: Nullable<string>;
  avatarKey: Nullable<string>;
}
