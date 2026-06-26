"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Send, Loader2, X } from "lucide-react"

import api, { normalizeError } from "../../services/api"
import { cn } from "../../lib/utils"

// Brand-aligned orb tones (mint/teal greens that read against the Quirk palette).
const ORB_TONES = {
  base: "oklch(97% 0.01 150)",
  accent1: "oklch(84% 0.16 152)",
  accent2: "oklch(82% 0.11 178)",
  accent3: "oklch(88% 0.14 140)",
}

// Theme-adaptive glass surfaces. color-mix keeps them translucent over whatever
// the canvas colour is, so they work in both light and dark mode automatically.
const GLASS_PANEL = {
  background: "color-mix(in srgb, var(--colors-canvas) 78%, transparent)",
  backdropFilter: "blur(22px) saturate(150%)",
  WebkitBackdropFilter: "blur(22px) saturate(150%)",
  border: "1px solid color-mix(in srgb, var(--colors-ink) 12%, transparent)",
}
const GLASS_FIELD = {
  background: "color-mix(in srgb, var(--colors-canvas-soft) 72%, transparent)",
  border: "1px solid color-mix(in srgb, var(--colors-ink) 10%, transparent)",
}
const HAIRLINE = "color-mix(in srgb, var(--colors-ink) 10%, transparent)"

const ColorOrb = ({
  dimension = "192px",
  className,
  tones,
  spinDuration = 20,
}) => {
  const palette = { ...ORB_TONES, ...tones }
  const dimValue = parseInt(dimension.replace("px", ""), 10)

  const blurStrength = dimValue < 50 ? Math.max(dimValue * 0.008, 1) : Math.max(dimValue * 0.015, 4)
  const contrastStrength = dimValue < 50 ? Math.max(dimValue * 0.004, 1.2) : Math.max(dimValue * 0.008, 1.5)
  const pixelDot = dimValue < 50 ? Math.max(dimValue * 0.004, 0.05) : Math.max(dimValue * 0.008, 0.1)
  const shadowRange = dimValue < 50 ? Math.max(dimValue * 0.004, 0.5) : Math.max(dimValue * 0.008, 2)
  const maskRadius = dimValue < 30 ? "0%" : dimValue < 50 ? "5%" : dimValue < 100 ? "15%" : "25%"
  const adjustedContrast = dimValue < 30 ? 1.1 : dimValue < 50 ? Math.max(contrastStrength * 1.2, 1.3) : contrastStrength

  return (
    <div
      className={cn("color-orb", className)}
      style={{
        width: dimension,
        height: dimension,
        "--base": palette.base,
        "--accent1": palette.accent1,
        "--accent2": palette.accent2,
        "--accent3": palette.accent3,
        "--spin-duration": `${spinDuration}s`,
        "--blur": `${blurStrength}px`,
        "--contrast": adjustedContrast,
        "--dot": `${pixelDot}px`,
        "--shadow": `${shadowRange}px`,
        "--mask": maskRadius,
      }}
    >
      <style>{`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        .color-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          transform: scale(1.1);
        }
        .color-orb::before,
        .color-orb::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transform: translateZ(0);
        }
        .color-orb::before {
          background:
            conic-gradient(from calc(var(--angle) * 2) at 25% 70%, var(--accent3), transparent 20% 80%, var(--accent3)),
            conic-gradient(from calc(var(--angle) * 2) at 45% 75%, var(--accent2), transparent 30% 60%, var(--accent2)),
            conic-gradient(from calc(var(--angle) * -3) at 80% 20%, var(--accent1), transparent 40% 60%, var(--accent1)),
            conic-gradient(from calc(var(--angle) * 2) at 15% 5%, var(--accent2), transparent 10% 90%, var(--accent2)),
            conic-gradient(from calc(var(--angle) * 1) at 20% 80%, var(--accent1), transparent 10% 90%, var(--accent1)),
            conic-gradient(from calc(var(--angle) * -2) at 85% 10%, var(--accent3), transparent 20% 80%, var(--accent3));
          box-shadow: inset var(--base) 0 0 var(--shadow) calc(var(--shadow) * 0.2);
          filter: blur(var(--blur)) contrast(var(--contrast));
          animation: spin var(--spin-duration) linear infinite;
        }
        .color-orb::after {
          background-image: radial-gradient(circle at center, var(--base) var(--dot), transparent var(--dot));
          background-size: calc(var(--dot) * 2) calc(var(--dot) * 2);
          backdrop-filter: blur(calc(var(--blur) * 2)) contrast(calc(var(--contrast) * 2));
          mix-blend-mode: overlay;
        }
        .color-orb[style*="--mask: 0%"]::after { mask-image: none; }
        .color-orb:not([style*="--mask: 0%"])::after { mask-image: radial-gradient(black var(--mask), transparent 75%); }
        @keyframes spin { to { --angle: 360deg; } }
        @media (prefers-reduced-motion: reduce) { .color-orb::before { animation: none; } }
      `}</style>
    </div>
  )
}

const SPEED_FACTOR = 1

const FormContext = createContext({})
const useFormContext = () => useContext(FormContext)

export function MorphPanel({ workspaceId, projectId }) {
  const wrapperRef = useRef(null)
  const textareaRef = useRef(null)

  const [showForm, setShowForm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState([])

  // Keep a ref of the latest messages so sendMessage can read prior history
  // without going stale inside its closure.
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  const triggerClose = useCallback(() => {
    setShowForm(false)
    textareaRef.current?.blur()
  }, [])

  const triggerOpen = useCallback(() => {
    setShowForm(true)
    setTimeout(() => textareaRef.current?.focus())
  }, [])

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const history = messagesRef.current.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setIsProcessing(true)
    try {
      const { data } = await api.post("/ai/chat", { message: trimmed, workspaceId, projectId, history })
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch (err) {
      const status = err?.response?.status
      const { message } = normalizeError(err)
      const content = status === 503
        ? "Quirk AI isn't configured yet. Ask your admin to add a GEMINI_API_KEY or GROQ_API_KEY to the server .env file."
        : message || "Could not reach the AI service."
      setMessages((prev) => [...prev, { role: "assistant", content, error: true }])
    } finally {
      setIsProcessing(false)
    }
  }, [workspaceId, projectId])

  useEffect(() => {
    function clickOutsideHandler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target) && showForm) {
        triggerClose()
      }
    }
    document.addEventListener("mousedown", clickOutsideHandler)
    return () => document.removeEventListener("mousedown", clickOutsideHandler)
  }, [showForm, triggerClose])

  const ctx = useMemo(
    () => ({ showForm, isProcessing, triggerOpen, triggerClose, sendMessage, messages }),
    [showForm, isProcessing, triggerOpen, triggerClose, sendMessage, messages]
  )

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center justify-center max-sm:bottom-5 max-sm:right-4">
      <motion.div
        ref={wrapperRef}
        data-panel
        className="relative z-[3] flex flex-col items-center overflow-hidden text-[var(--colors-ink)] shadow-[var(--shadow-modal)]"
        style={GLASS_PANEL}
        initial={false}
        animate={{
          width: showForm ? FORM_WIDTH : "auto",
          height: showForm ? FORM_HEIGHT : 46,
          borderRadius: showForm ? 20 : 9999,
        }}
        transition={{ type: "spring", stiffness: 550 / SPEED_FACTOR, damping: 45, mass: 0.7, delay: showForm ? 0 : 0.08 }}
      >
        <FormContext.Provider value={ctx}>
          <DockBar />
          <ChatForm ref={textareaRef} />
        </FormContext.Provider>
      </motion.div>
    </div>
  )
}

function DockBar() {
  const { showForm, triggerOpen } = useFormContext()
  return (
    <footer className="mt-auto flex h-[46px] items-center justify-center whitespace-nowrap select-none">
      <button
        type="button"
        onClick={triggerOpen}
        className="flex h-full items-center gap-2 rounded-full px-4 text-sm font-medium text-[var(--colors-ink)] transition hover:text-[var(--colors-primary-active)] focus-ring"
        style={{ opacity: showForm ? 0 : 1, pointerEvents: showForm ? "none" : "all" }}
      >
        <ColorOrb dimension="22px" />
        <span>Ask Quirk AI</span>
      </button>
    </footer>
  )
}

const FORM_WIDTH = 372
const FORM_HEIGHT = 460

const ChatForm = React.forwardRef((_, ref) => {
  const { triggerClose, showForm, isProcessing, sendMessage, messages } = useFormContext()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (showForm && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isProcessing, showForm])

  async function handleSubmit(e) {
    e.preventDefault()
    const value = ref.current?.value || ""
    if (!value.trim() || isProcessing) return
    ref.current.value = ""
    await sendMessage(value)
  }

  function handleKeys(e) {
    if (e.key === "Escape") triggerClose()
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-0 left-0"
      style={{ width: FORM_WIDTH, height: FORM_HEIGHT, pointerEvents: showForm ? "all" : "none" }}
    >
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 550 / SPEED_FACTOR, damping: 45, mass: 0.7 }}
            className="flex h-full flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
              <div className="flex items-center gap-2">
                <ColorOrb dimension="22px" />
                <p className="select-none text-sm font-semibold text-[var(--colors-ink)]">Quirk AI</p>
              </div>
              <button
                type="button"
                onClick={triggerClose}
                aria-label="Close AI assistant"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--colors-ink-muted)] transition hover:bg-[var(--colors-surface-pressed)] hover:text-[var(--colors-ink)] focus-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thread */}
            <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {messages.length === 0 && !isProcessing ? (
                <div className="m-auto flex flex-col items-center gap-3 text-center px-2">
                  <ColorOrb dimension="40px" />
                  <p className="text-sm text-[var(--colors-ink-faint)]">
                    Hi! Ask me about your tasks, or tell me to create one.
                  </p>
                  {!workspaceId && !projectId && (
                    <p className="text-xs text-[var(--colors-priority-urgent)] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                      Open a workspace or project first so I have context to work with.
                    </p>
                  )}
                </div>
              ) : (
                messages.map((m, i) => <Bubble key={i} message={m} />)
              )}
              {isProcessing && <TypingBubble />}
            </div>

            {/* Composer */}
            <div className="p-3" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
              <div className="flex items-end gap-2 rounded-[var(--radius-lg)] p-1.5" style={GLASS_FIELD}>
                <textarea
                  ref={ref}
                  placeholder="Ask me anything…"
                  name="message"
                  rows={1}
                  spellCheck={false}
                  disabled={isProcessing}
                  onKeyDown={handleKeys}
                  className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-[var(--colors-ink)] outline-none placeholder:text-[var(--colors-ink-faint)]"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  aria-label="Send message"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--colors-primary)] text-[var(--colors-on-primary)] transition hover:bg-[var(--colors-primary-hover)] focus-ring disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
})
ChatForm.displayName = "ChatForm"

function Bubble({ message }) {
  const isUser = message.role === "user"
  if (isUser) {
    return (
      <div className="max-w-[82%] self-end rounded-2xl rounded-br-md bg-[var(--colors-primary)] px-3.5 py-2 text-sm leading-relaxed text-[var(--colors-on-primary)]">
        {message.content}
      </div>
    )
  }
  return (
    <div
      className={cn(
        "max-w-[88%] self-start rounded-2xl rounded-bl-md px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
        message.error
          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          : "text-[var(--colors-ink-secondary)]"
      )}
      style={message.error ? undefined : GLASS_FIELD}
    >
      {message.content}
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex max-w-[88%] self-start items-center gap-1.5 rounded-2xl rounded-bl-md px-3.5 py-3" style={GLASS_FIELD}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--colors-ink-faint)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

export default MorphPanel
