import { MessageCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../hooks/useChat';

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineIds, lastSeen } = useSocket();
  const chat = useChat(user, socket);
  const { activeUser } = chat;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Sidebar: full screen on mobile until a chat is opened */}
      <aside
        className={`${
          activeUser ? 'hidden md:flex' : 'flex'
        } w-full shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:w-80 lg:w-96`}
      >
        <Sidebar
          currentUser={user}
          conversations={chat.conversations}
          activeUserId={activeUser?._id}
          onSelectUser={chat.openChat}
          onlineIds={onlineIds}
          lastSeen={lastSeen}
          typingFrom={chat.typingFrom}
        />
      </aside>

      <main className={`${activeUser ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
        {activeUser ? (
          <ChatWindow
            key={activeUser._id}
            currentUserId={user._id}
            user={activeUser}
            messages={chat.messages}
            hasMore={chat.hasMore}
            loading={chat.loadingMessages}
            online={onlineIds.has(activeUser._id)}
            lastSeen={lastSeen[activeUser._id] || activeUser.lastSeen}
            isTyping={Boolean(chat.typingFrom[activeUser._id])}
            onBack={chat.closeChat}
            onLoadEarlier={chat.loadEarlier}
            onSend={chat.sendMessage}
            onDeleteMessage={chat.deleteMessage}
            onTyping={(isTyping) => chat.emitTyping(activeUser._id, isTyping)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <MessageCircle size={28} />
            </span>
            <h2 className="text-lg font-semibold">Pick a conversation</h2>
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Choose a chat from the sidebar, or search for a username to start a new one.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}