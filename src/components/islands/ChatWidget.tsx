import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useConversation } from '@elevenlabs/react';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? 'https://nqskllzyphlhmuhzpcdy.supabase.co';
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc2tsbHp5cGhsaG11aHpwY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDIyMjEsImV4cCI6MjA3ODcxODIyMX0.3Th9Bu441NwQT5C0-Ye9YPW7YnCtY7DGkUdT_iCd_4M';
const WA_DIGITS = '529818198199';
const WELCOME =
  '¡Hola! 🐝 Soy la asistente de Beeghee México. Puedo ayudarte con información sobre el pan de abeja, nuestros productos, o cómo hacer tu pedido. ¿En qué te puedo ayudar?';

const ACTION_REGEX = /\[ACTION:(add_to_cart|contact|whatsapp|navigate)(?::([^\]]*))?\]/g;

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedAction {
  type: string;
  params?: string;
}

function parseActions(content: string): { text: string; actions: ParsedAction[] } {
  const actions: ParsedAction[] = [];
  const text = content.replace(ACTION_REGEX, (_, type, params) => {
    actions.push({ type, params });
    return '';
  }).trim();
  return { text, actions };
}

function triggerAction(action: string) {
  if (typeof window === 'undefined') return;
  if (action === 'contact') {
    window.location.href = '/contacto';
  } else if (action === 'whatsapp') {
    window.open(
      `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent('Hola! Quiero comprar Beeghee en México.')}`,
      '_blank'
    );
  } else if (action.startsWith('navigate:')) {
    const path = action.slice('navigate:'.length);
    window.location.href = path;
  } else if (action.startsWith('add_to_cart:')) {
    window.location.href = '/tienda';
  }
}

const actionLabels: Record<string, string> = {
  add_to_cart: 'Ver en Tienda 🛒',
  contact: 'Contactar Soporte 📧',
  whatsapp: 'Abrir WhatsApp 📱',
  navigate: 'Ir',
};

function MessageBubble({ message }: { message: Msg }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#D4A017]/20 px-4 py-2.5 text-sm text-foreground">
          {message.content}
        </div>
      </div>
    );
  }
  const { text, actions } = parseActions(message.content);
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md border border-border bg-white px-4 py-2.5 text-sm text-foreground whitespace-pre-wrap">
          {text}
        </div>
        {actions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {actions.map((a, i) => {
              const str = a.params ? `${a.type}:${a.params}` : a.type;
              const label = a.type === 'navigate' ? `Ir a ${a.params ?? '/'}` : actionLabels[a.type] ?? a.type;
              return (
                <button
                  key={i}
                  onClick={() => triggerAction(str)}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#D4A017] px-3 py-1 text-xs font-medium text-[#8B6914] transition-colors hover:bg-[#D4A017]/10"
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md border border-border bg-white px-4 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4A017]" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4A017]" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4A017]" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function VoicePanel() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    clientTools: {
      agregar_al_carrito: () => {
        if (typeof window !== 'undefined') window.location.href = '/tienda';
        return 'Producto agregado al carrito';
      },
      abrir_contacto: () => {
        if (typeof window !== 'undefined') window.location.href = '/contacto';
        return 'Abriendo página de contacto';
      },
    },
    onError: () => {
      setError('No se pudo conectar al asistente de voz. Intenta de nuevo.');
    },
  });

  const start = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mx-elevenlabs-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON}`,
          apikey: SUPABASE_ANON,
        },
      });
      if (!res.ok) throw new Error('token');
      const data = await res.json();
      if (!data.signed_url) throw new Error('no signed url');
      await conversation.startSession({ signedUrl: data.signed_url });
    } catch (err: any) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Permite el acceso al micrófono para usar el chat por voz.'
          : 'No se pudo iniciar la llamada. Intenta de nuevo.'
      );
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const end = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === 'connected';
  const statusText = isConnecting
    ? 'Conectando...'
    : conversation.isSpeaking
      ? 'Hablando...'
      : isConnected
        ? 'Escuchando...'
        : 'Toca para iniciar';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="relative flex items-center justify-center">
        {isConnected && (
          <>
            <span className="absolute h-24 w-24 rounded-full bg-[#D4A017]/30 animate-ping" />
            <span className="absolute h-20 w-20 rounded-full bg-[#D4A017]/20 animate-ping" />
          </>
        )}
        <button
          onClick={isConnected ? undefined : start}
          disabled={isConnecting}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all ${
            isConnected ? 'bg-[#D4A017] text-white shadow-lg' : 'bg-[#D4A017]/10 text-[#D4A017] hover:bg-[#D4A017]/20'
          } ${isConnecting ? 'animate-pulse' : ''}`}
          aria-label={isConnected ? 'Micrófono activo' : 'Iniciar chat por voz'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
      </div>

      <p className="text-sm font-medium text-muted-foreground">{statusText}</p>
      {error && <p className="text-xs text-destructive text-center max-w-xs">{error}</p>}

      {isConnected && (
        <button
          onClick={end}
          className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
          Terminar llamada
        </button>
      )}
    </div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: Msg = { role: 'user', content };
      const history = [...messages, userMsg];
      setMessages(history);
      setIsLoading(true);

      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/mx-chatbot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON}`,
            apikey: SUPABASE_ANON,
          },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            products: [
              { slug: 'beeghee-bee-bread', name: 'Beeghee Pan de Abeja', price: 'varies', currency: 'MXN' },
              { slug: 'chocolate-bars-6', name: 'Barras de Chocolate Orgánico (6)', price: 'varies', currency: 'MXN' },
              { slug: 'chocolate-bites-12', name: 'Bocaditos de Chocolate Orgánico (12)', price: 'varies', currency: 'MXN' },
            ],
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error('no stream');

        const decoder = new TextDecoder();
        let buffer = '';
        let acc = '';
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                acc += delta;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: 'assistant', content: acc };
                  return next;
                });
              }
            } catch {}
          }
        }

        if (!isOpen) setHasUnread(true);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setMessages((prev) => {
          const base =
            prev[prev.length - 1]?.role === 'assistant' && prev[prev.length - 1]?.content === ''
              ? prev.slice(0, -1)
              : prev;
          return [
            ...base,
            {
              role: 'assistant',
              content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo. 🐝',
            },
          ];
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isOpen]
  );

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A017] text-white shadow-lg transition-all hover:bg-[#8B6914] hover:scale-105 ${pulse ? 'animate-pulse' : ''}`}
          aria-label="Abrir chat de asistencia"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white" />
          )}
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9997] bg-black/40 sm:hidden" onClick={() => setIsOpen(false)} />
          <div className="fixed z-[9998] bottom-0 right-0 sm:bottom-24 sm:right-6 w-full sm:max-w-[400px] h-full sm:h-auto sm:max-h-[600px] flex flex-col rounded-none sm:rounded-2xl shadow-2xl border border-border overflow-hidden bg-background">
            <div className="flex items-center justify-between bg-gradient-to-r from-[#D4A017] to-[#B8860B] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐝</span>
                <h3 className="text-sm font-semibold text-white">Beeghee México — Asistente</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVoiceMode((v) => !v)}
                  className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label={voiceMode ? 'Chat por texto' : 'Chat por voz'}
                  title={voiceMode ? 'Chat por texto' : 'Chat por voz'}
                >
                  {voiceMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Cerrar chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {voiceMode ? (
              <VoicePanel />
            ) : (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <div className="flex flex-col gap-3 p-4">
                    {messages.map((msg, i) => (
                      <MessageBubble key={i} message={msg} />
                    ))}
                    {isLoading && (messages.length === 0 || messages[messages.length - 1]?.content !== '') && (
                      <TypingIndicator />
                    )}
                    <div ref={bottomRef} />
                  </div>
                </div>
                <div className="border-t border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4A017] text-white transition-colors hover:bg-[#8B6914] disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Enviar mensaje"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
