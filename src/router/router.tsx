import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Auth } from '@/pages/auth/Auth.tsx';
import { Chat } from '@/pages/chat/Chat.tsx';
import { Profile } from '@/pages/profile/Profile.tsx';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/chat',
    element: <Chat />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '*',
    element: <Navigate to="/auth" replace />,
  },
]);
