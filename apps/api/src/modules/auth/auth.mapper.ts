import type { PublicUser } from '@pulsechat/contracts';
import type { Profile, User } from '@prisma/client';

interface UserWithProfile extends User {
  profile: Profile | null;
}

export function toPublicUser(user: UserWithProfile): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.profile?.username ?? '',
    displayName: user.profile?.displayName ?? null,
    avatarKey: user.profile?.avatarKey ?? null,
  };
}
