"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

// Use anon key here — this is the browser client for realtime only
const supabaseRealtime = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  order_id: string;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
};

type Props = {
  orderId: string;
  customerName?: string;
  isDriver?: boolean;
};

export default function OrderChat({ orderId, customerName, isDriver = false }: Props) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(true);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const myId = Number((session?.user as any)?.id);
  const myRole = (session?.user as any)?.role;

  // Refs so the realtime callback always reads the *latest* open/myId
  // without forcing the subscription effect below to depend on them.
  const openRef = useRef(open);
  const myIdRef = useRef(myId);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  // Shared helper: merge any messages not already in state, in order.
  // Used by both the initial fetch, the realtime handler, and the
  // polling fallback below, so there's one single place dedup happens.
  function mergeMessages(incoming: Message[]) {
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !existingIds.has(m.id));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }

  // Fetch existing messages
  useEffect(() => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/messages?order_id=${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch messages");
        return r.json();
      })
      .then((data) => {
        setMessages(data.messages || []);
        setLoading(false);
        setUnread(0);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      });
  }, [orderId]);

  // ---- POLLING FALLBACK ----
  // Independent of the realtime websocket below. Every 3 seconds, asks the
  // server "any new messages for this order?" and merges them in. This is
  // what GUARANTEES messages show up even if the Supabase Realtime
  // subscription never connects, gets dropped, or is misconfigured on a
  // given network. Realtime (below) is still used for the instant feel
  // when it does work — this is just the safety net.
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(() => {
      fetch(`/api/messages?order_id=${orderId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.messages) {
            mergeMessages(data.messages);
          }
        })
        .catch(() => {
          // Silent fail on poll — realtime or the next poll may still work.
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Supabase realtime subscription.
  //
  // IMPORTANT: this effect only depends on `orderId`. Do NOT add `open` or
  // `myId` here. Adding them tears down and recreates the channel every
  // time those values change, and `removeChannel()` resolves asynchronously.
  // If the effect re-fires before the previous teardown finishes (common in
  // dev with Strict Mode, or from fast toggling), you can end up calling
  // `.on()` on a channel that the client already marked as subscribed,
  // which throws: "cannot add postgres_changes callbacks ... after
  // subscribe()". Subscribing once per orderId and reading open/myId via
  // refs avoids the race entirely.
  useEffect(() => {
    if (!orderId) return;

    console.log("Setting up realtime subscription for order:", orderId);

    const channel = supabaseRealtime
      .channel(`order-chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("New message received via realtime:", payload);
          const incoming = payload.new as Message;

          mergeMessages([incoming]);

          // Only count as unread if chat is closed and message is not from me
          if (!openRef.current && incoming.sender_id !== myIdRef.current) {
            setUnread((prev) => prev + 1);
          }

          // Auto-scroll to bottom
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to realtime updates");
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log("Removing realtime subscription");
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) {
        supabaseRealtime.removeChannel(ch);
      }
    };
  }, [orderId]); // <- only orderId, nothing else

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, open]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        setUnread(0);
      }, 200);
    }
  }, [open]);

  async function sendMessage() {
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    setNewMessage("");
    setError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      console.log("Message sent successfully:", data);

      // Optimistically merge in our own sent message right away too,
      // in case neither realtime nor the next poll tick has fired yet.
      if (data.message) {
        mergeMessages([data.message]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Toggle chat
  const toggleChat = () => {
    setOpen(!open);
    if (!open) {
      setUnread(0);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex items-center gap-3 rounded-t-2xl">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
          {isDriver ? "🚚" : "👤"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {isDriver
              ? `Chat with ${customerName || "Customer"}`
              : "Chat with your Driver"}
          </p>
          <p className="text-blue-200 text-xs">
            Order #{orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-blue-200 text-xs">Live</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 mx-4 mt-2 rounded-lg border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: "200px", maxHeight: "340px" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full py-8">
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-gray-400 text-sm font-medium">No messages yet</p>
            <p className="text-gray-300 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === myId;
            const isDriverMsg = msg.sender_role?.toLowerCase() === "driver";

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}>
                {/* Avatar for other person */}
                {!isMe && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0 ${
                    isDriverMsg ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    {isDriverMsg ? "🚚" : "👤"}
                  </div>
                )}

                <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {/* Sender label for other person */}
                  {!isMe && (
                    <p className="text-xs text-gray-400 mb-1 px-1 font-medium">
                      {isDriverMsg ? "🚚 Driver" : msg.sender_name}
                    </p>
                  )}

                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : isDriverMsg
                        ? "bg-blue-50 text-gray-800 rounded-bl-sm border border-blue-100"
                        : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>

                  <p className={`text-xs mt-1 px-1 ${
                    isMe ? "text-gray-400" : "text-gray-300"
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Avatar for me */}
                {isMe && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs ml-2 mt-1 flex-shrink-0 text-white">
                    Me
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white rounded-b-2xl flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-black"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="w-9 h-9 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full flex items-center justify-center hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105 active:scale-95"
        >
          {sending ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          )}
        </button>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}