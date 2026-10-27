"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import rules from "./rules.json";

interface ChatRule {
  intent: string;
  keywords: string[];
  reply: string;
}

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
}

const chatRules = rules as ChatRule[];

function normalizeMessage(message: string): string {
  return message.toLowerCase().trim().replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findRule(intent: string): ChatRule | undefined {
  return chatRules.find((rule) => rule.intent === intent);
}

function getBotReply(message: string): string {
  const normalized = normalizeMessage(message);

  // Rules are checked in the order they appear in rules.json,
  // so specific intents come before broad ones (e.g. Greeting is last).
  const matchedRule = chatRules.find((rule) =>
    rule.keywords.some((keyword) => {
      const normalizedKeyword = normalizeMessage(keyword);
      if (!normalizedKeyword) return false;

      // Whole-word / whole-phrase match, so "hi" does not match "chicken".
      const pattern = new RegExp(
        `(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}([^a-z0-9]|$)`
      );
      return pattern.test(normalized);
    })
  );

  if (matchedRule) return matchedRule.reply;

  // Fallback text is loaded from rules.json; the string below is only a
  // last-resort guard in case the Fallback rule is removed from the file.
  return findRule("Fallback")?.reply ?? "Sorry, I could not understand that.";
}

function getWelcomeMessage(): ChatMessage {
  return {
    id: 1,
    sender: "bot",
    text: findRule("Greeting")?.reply ?? findRule("Fallback")?.reply ?? "",
  };
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [input, setInput] = useState("");
  const nextId = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: nextId.current++,
      sender: "user",
      text: trimmed,
    };

    const botMessage: ChatMessage = {
      id: nextId.current++,
      sender: "bot",
      text: getBotReply(trimmed),
    };

    setMessages((previous) => [...previous, userMessage, botMessage]);
    setInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleClearChat() {
    nextId.current = 2;
    setMessages([getWelcomeMessage()]);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-orange-50 px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex h-[calc(100dvh-2rem)] max-h-[900px] min-h-[520px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-xl sm:h-[calc(100dvh-4rem)]">
        {/* Header */}
        <header className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-500 px-4 py-4 text-white sm:px-6">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl"
            aria-hidden="true"
          >
            🍔
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold sm:text-xl">
              Restaurant Ordering Bot
            </h1>
            <p className="text-xs text-orange-100 sm:text-sm">
              Your virtual food ordering assistant
            </p>
          </div>
        </header>

        {/* Chat window */}
        <section
          aria-label="Chat conversation"
          aria-live="polite"
          className="flex-1 space-y-4 overflow-y-auto bg-orange-50/60 px-3 py-5 sm:px-6"
        >
          {messages.map((message) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm"
                    aria-hidden="true"
                  >
                    🍽️
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                    isUser
                      ? "rounded-br-sm bg-red-600 text-white"
                      : "rounded-bl-sm border border-orange-100 bg-white text-stone-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                </div>

                {isUser && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm"
                    aria-hidden="true"
                  >
                    👤
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </section>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-orange-100 bg-white p-3 sm:gap-3 sm:p-4"
        >
          <label htmlFor="chat-input" className="sr-only">
            Type your message
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about our menu or place an order..."
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
          >
            Send
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            className="shrink-0 rounded-xl border border-orange-300 bg-white px-3 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-200 sm:px-4"
          >
            Clear Chat
          </button>
        </form>

        <footer className="bg-white pb-3 text-center text-[11px] text-stone-400">
          Demo chatbot: menu, prices, and offers are sample data. No real orders are placed.
        </footer>
      </div>
    </main>
  );
}