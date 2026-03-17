import { ChatWorkspace } from '../../../../src/features/chats/chat-workspace';

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;

  return <ChatWorkspace activeChatId={chatId} />;
}
