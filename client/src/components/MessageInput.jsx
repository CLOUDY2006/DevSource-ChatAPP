import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const areaRef = useRef(null);
  const typingRef = useRef(false);
  const timerRef = useRef(null);
  const onTypingRef = useRef(onTyping);
  onTypingRef.current = onTyping;

  const stopTyping = () => {
    clearTimeout(timerRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      onTypingRef.current(false);
    }
  };

  // Tell the other person we stopped typing if this chat is closed mid-sentence.
  useEffect(() => () => stopTyping(), []);

  const resize = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setError('');
    resize();
    if (e.target.value.trim()) {
      // send "typing" once, then "stopped" after 1.5s of silence
      if (!typingRef.current) {
        typingRef.current = true;
        onTypingRef.current(true);
      }
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(stopTyping, 1500);
    } else {
      stopTyping();
    }
  };

  const submit = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    stopTyping();
    try {
      await onSend(body);
      setText('');
      requestAnimationFrame(resize);
    } catch (err) {
      setError(err.message); // keep the text so the user can retry
    } finally {
      setSending(false);
      areaRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900 md:px-4">
      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          ref={areaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder="Write a message"
          maxLength={2000}
          className="input max-h-32 resize-none py-2.5"
          aria-label="Message"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || sending}
          className="btn-primary h-11 w-11 shrink-0 !rounded-full !p-0"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
