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

const ColorOrb = ({
  dimension = "192px",
  className,
  tones,
  spinDuration = 20,
}) => {
  const fallbackTones = ORB_TONES

  const palette = { ...fallbackTones, ...tones }
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
            conic-gradient(
              from calc(var(--angle) * 2) at 25% 70%,
              var(--accent3),
              transparent 20% 80%,
              var(--accent3)
            ),
            conic-gradient(
              from calc(var(--angle) * 2) at 45% 75%,
              var(--accent2),
              transparent 30% 60%,
              var(--accent2)
            ),
            conic-gradient(
              from calc(var(--angle) * -3) at 80% 20%,
              var(--accent1),
              transparent 40% 60%,
              var(--accent1)
            ),
            conic-gradient(
              from calc(var(--angle) * 2) at 15% 5%,
              var(--accent2),
              transparent 10% 90%,
              var(--accent2)
            ),
            conic-gradient(
              from calc(var(--angle) * 1) at 20% 80%,
              var(--accent1),
              transparent 10% 90%,
              var(--accent1)
            ),
            conic-gradient(
              from calc(var(--angle) * -2) at 85% 10%,
              var(--accent3),
              transparent 20% 80%,
              var(--accent3)
            );
          box-shadow: inset var(--base) 0 0 var(--shadow) calc(var(--shadow) * 0.2);
          filter: blur(var(--blur)) contrast(var(--contrast));
          animation: spin var(--spin-duration) linear infinite;
        }

        .color-orb::after {
          background-image: radial-gradient(
            circle at center,
            var(--base) var(--dot),
            transparent var(--dot)
          );
          background-size: calc(var(--dot) * 2) calc(var(--dot) * 2);
          backdrop-filter: blur(calc(var(--blur) * 2)) contrast(calc(var(--contrast) * 2));
          mix-blend-mode: overlay;
        }

        .color-orb[style*="--mask: 0%"]::after {
          mask-image: none;
        }

        .color-orb:not([style*="--mask: 0%"])::after {
          mask-image: radial-gradient(black var(--mask), transparent 75%);
        }

        @keyframes spin {
          to {
            --angle: 360deg;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .color-orb::before {
            animation: none;
          }
        }
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
  const [responseMsg, setResponseMsg] = useState(null)
  const [isError, setIsError] = useState(false)

  const triggerClose = useCallback(() => {
    setShowForm(false)
    textareaRef.current?.blur()
    setTimeout(() => {
        setResponseMsg(null)
        setIsError(false)
    }, 500)
  }, [])

  const triggerOpen = useCallback(() => {
    setShowForm(true)
    setTimeout(() => {
      textareaRef.current?.focus()
    })
  }, [])

  const handleResult = useCallback((resText, error = false) => {
    setResponseMsg(resText)
    setIsError(error)
  }, [])

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
    () => ({ showForm, isProcessing, setIsProcessing, triggerOpen, triggerClose, workspaceId, projectId, responseMsg, isError }),
    [showForm, isProcessing, setIsProcessing, triggerOpen, triggerClose, workspaceId, projectId, responseMsg, isError]
  )

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center justify-center">
      <motion.div
        ref={wrapperRef}
        data-panel
        className={cn(
          "relative z-[3] flex flex-col items-center overflow-hidden border border-[var(--colors-hairline)] bg-[var(--colors-canvas)] text-[var(--colors-ink)] shadow-[var(--shadow-card)] max-sm:bottom-5"
        )}
        initial={false}
        animate={{
          width: showForm ? FORM_WIDTH : "auto",
          height: showForm ? FORM_HEIGHT : 44,
          borderRadius: showForm ? 16 : 9999,
        }}
        transition={{
          type: "spring",
          stiffness: 550 / SPEED_FACTOR,
          damping: 45,
          mass: 0.7,
          delay: showForm ? 0 : 0.08,
        }}
      >
        <FormContext.Provider value={ctx}>
          <DockBar />
          <InputForm ref={textareaRef} onResult={handleResult} />
        </FormContext.Provider>
      </motion.div>
    </div>
  )
}

function DockBar() {
  const { showForm, triggerOpen } = useFormContext()
  return (
    <footer className="mt-auto flex h-[44px] items-center justify-center whitespace-nowrap select-none">
      <button
        type="button"
        onClick={triggerOpen}
        className="flex h-full items-center gap-2 rounded-full px-4 text-sm font-semibold text-[var(--colors-ink)] transition hover:text-[var(--colors-primary-active)] focus-ring max-sm:px-3"
      >
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="blank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="h-5 w-5"
            />
          ) : (
            <motion.div
              key="orb"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ColorOrb dimension="22px" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="truncate">Ask Quirk AI</span>
      </button>
    </footer>
  )
}

const FORM_WIDTH = 360
const FORM_HEIGHT = 420

const InputForm = React.forwardRef(({ onResult }, ref) => {
  const { triggerClose, showForm, isProcessing, setIsProcessing, workspaceId, projectId, responseMsg, isError } = useFormContext()
  const btnRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!ref.current.value.trim() || isProcessing) return;

    const message = ref.current.value;
    setIsProcessing(true);

    try {
        // Use the shared API client so the request carries the HTTP-only auth
        // cookie (withCredentials) and benefits from the 401 refresh interceptor.
        const { data } = await api.post('/ai/chat', { message, workspaceId, projectId });
        onResult(data.reply);
        ref.current.value = ""; // clear input
    } catch (error) {
        const { message: msg } = normalizeError(error);
        onResult(msg || "Could not reach the AI service. Please try again.", true);
    } finally {
        setIsProcessing(false);
    }
  }

  function handleKeys(e) {
    if (e.key === "Escape") triggerClose()
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      btnRef.current?.click()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-0 bg-[var(--colors-canvas)]"
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
            <div className="flex items-center justify-between border-b border-[var(--colors-hairline)] px-4 py-3">
              <div className="flex items-center gap-2">
                <ColorOrb dimension="22px" />
                <p className="select-none text-sm font-semibold text-[var(--colors-ink)]">
                    Quirk AI
                </p>
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

            <div className="flex-1 overflow-y-auto p-4 text-sm whitespace-pre-wrap">
                {responseMsg ? (
                    <div
                        className={cn(
                            "rounded-[var(--radius-md)] border p-3 leading-relaxed",
                            isError
                                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                                : "border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] text-[var(--colors-ink-secondary)]"
                        )}
                    >
                        {responseMsg}
                    </div>
                ) : (
                    <div className="mt-10 flex flex-col items-center gap-3 text-center">
                        <ColorOrb dimension="40px" />
                        <p className="text-[var(--colors-ink-faint)]">
                            How can I help you manage your tasks today?
                        </p>
                    </div>
                )}
            </div>

            <div className="relative border-t border-[var(--colors-hairline)] p-2">
                <textarea
                ref={ref}
                placeholder="Ask me anything…  (Enter to send)"
                name="message"
                className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] p-3 pr-11 text-sm text-[var(--colors-ink)] outline-none transition placeholder:text-[var(--colors-ink-faint)] focus:border-[var(--colors-primary)] focus-ring"
                rows={2}
                onKeyDown={handleKeys}
                spellCheck={false}
                disabled={isProcessing}
                />
                <button
                type="submit"
                ref={btnRef}
                disabled={isProcessing}
                aria-label="Send message"
                className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--colors-primary)] text-[var(--colors-on-primary)] transition hover:bg-[var(--colors-primary-hover)] focus-ring disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
})

export default MorphPanel
