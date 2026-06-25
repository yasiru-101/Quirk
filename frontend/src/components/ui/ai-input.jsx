"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from "react"
import { cx } from "class-variance-authority"
import { AnimatePresence, motion } from "motion/react"
import { Send, Loader2 } from "lucide-react"

import { Button } from "./button"
import { cn } from "../../lib/utils"

const ColorOrb = ({
  dimension = "192px",
  className,
  tones,
  spinDuration = 20,
}) => {
  const fallbackTones = {
    base: "oklch(95% 0.02 264.695)",
    accent1: "oklch(75% 0.15 350)",
    accent2: "oklch(80% 0.12 200)",
    accent3: "oklch(78% 0.14 280)",
  }

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
  const [successFlag, setSuccessFlag] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [responseMsg, setResponseMsg] = useState(null)

  const triggerClose = useCallback(() => {
    setShowForm(false)
    textareaRef.current?.blur()
    setTimeout(() => {
        setResponseMsg(null) 
    }, 500)
  }, [])

  const triggerOpen = useCallback(() => {
    setShowForm(true)
    setTimeout(() => {
      textareaRef.current?.focus()
    })
  }, [])

  const handleSuccess = useCallback((resText) => {
    setSuccessFlag(true)
    setResponseMsg(resText)
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
    () => ({ showForm, successFlag, isProcessing, setIsProcessing, triggerOpen, triggerClose, workspaceId, projectId, responseMsg }),
    [showForm, successFlag, isProcessing, setIsProcessing, triggerOpen, triggerClose, workspaceId, projectId, responseMsg]
  )

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center justify-center">
      <motion.div
        ref={wrapperRef}
        data-panel
        className={cx(
          "bg-white dark:bg-gray-900 shadow-2xl relative z-3 flex flex-col items-center overflow-hidden border max-sm:bottom-5"
        )}
        initial={false}
        animate={{
          width: showForm ? FORM_WIDTH : "auto",
          height: showForm ? FORM_HEIGHT : 44,
          borderRadius: showForm ? 14 : 20,
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
          <InputForm ref={textareaRef} onSuccess={handleSuccess} />
        </FormContext.Provider>
      </motion.div>
    </div>
  )
}

function DockBar() {
  const { showForm, triggerOpen } = useFormContext()
  return (
    <footer className="mt-auto flex h-[44px] items-center justify-center whitespace-nowrap select-none">
      <div className="flex items-center justify-center gap-2 px-3 max-sm:h-10 max-sm:px-2">
        <div className="flex w-fit items-center gap-2">
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
                <ColorOrb dimension="24px" tones={{ base: "oklch(22.64% 0 0)" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          type="button"
          className="flex h-fit flex-1 justify-end rounded-full px-2 !py-0.5"
          variant="ghost"
          onClick={triggerOpen}
        >
          <span className="truncate">Ask AI</span>
        </Button>
      </div>
    </footer>
  )
}

const FORM_WIDTH = 360
const FORM_HEIGHT = 400 

const InputForm = React.forwardRef(({ onSuccess }, ref) => {
  const { triggerClose, showForm, isProcessing, setIsProcessing, workspaceId, projectId, responseMsg } = useFormContext()
  const btnRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!ref.current.value.trim() || isProcessing) return;

    const message = ref.current.value;
    setIsProcessing(true);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, workspaceId, projectId })
        });
        const data = await res.json();
        
        if (res.ok) {
            onSuccess(data.reply);
            ref.current.value = ""; // clear input
        } else {
            onSuccess("Error: " + (data.message || "Failed to process request."));
        }
    } catch (error) {
        onSuccess("Network error: Could not reach AI service.");
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
      className="absolute bottom-0 bg-white dark:bg-gray-900"
      style={{ width: FORM_WIDTH, height: FORM_HEIGHT, pointerEvents: showForm ? "all" : "none" }}
    >
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 550 / SPEED_FACTOR, damping: 45, mass: 0.7 }}
            className="flex h-full flex-col p-1"
          >
            <div className="flex justify-between items-center py-2 px-2 border-b">
              <div className="flex items-center gap-2">
                <ColorOrb dimension="24px" tones={{ base: "oklch(22.64% 0 0)" }} />
                <p className="text-foreground text-sm font-medium select-none">
                    Quirk AI
                </p>
              </div>
              <button
                type="button"
                onClick={triggerClose}
                className="text-gray-500 hover:text-gray-700 w-6 h-6 flex justify-center items-center rounded-full bg-gray-100"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 text-sm whitespace-pre-wrap">
                {responseMsg ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-gray-800 dark:text-gray-200">
                        {responseMsg}
                    </div>
                ) : (
                    <div className="text-gray-400 italic text-center mt-10">
                        How can I help you today?
                    </div>
                )}
            </div>

            <div className="relative border-t p-2">
                <textarea
                ref={ref}
                placeholder="Ask me anything... (Press Enter to send)"
                name="message"
                className="w-full resize-none rounded-md p-3 pr-10 outline-none bg-gray-50 dark:bg-gray-800 text-sm focus:ring-1 focus:ring-blue-500"
                rows={2}
                onKeyDown={handleKeys}
                spellCheck={false}
                disabled={isProcessing}
                />
                <button
                type="submit"
                ref={btnRef}
                disabled={isProcessing}
                className="absolute right-4 bottom-5 text-blue-500 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
                >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
})

export default MorphPanel
