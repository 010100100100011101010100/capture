"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Check, Loader2 } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if already installed
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes("utm_source=homescreen")

    setIsInstalled(standalone)

    const handler = (e: Event) => {
      console.log("beforeinstallprompt fired - install button ready")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    // Listen for successful installation
    const appInstalledHandler = () => {
      console.log("PWA was installed")
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", appInstalledHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", appInstalledHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: Show manual install instructions
      alert(
        "To install CAPTURE:\n\n" +
          "Desktop: Look for install icon in address bar or Menu → Install CAPTURE\n" +
          "Mobile: Share button → Add to Home Screen",
      )
      return
    }

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
        setIsInstalled(true)
        setCanInstall(false)
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error("Error during installation:", error)
    } finally {
      setIsInstalling(false)
    }
  }

  // Don't show if already installed
  if (isInstalled) {
    return (
      <Button
        disabled
        className="bg-green-500 text-white font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3"
        title="App is installed"
      >
        <Check className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      className="bg-blue-500 hover:bg-blue-600 text-white font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      title={canInstall ? "Install CAPTURE as an app" : "Install CAPTURE (manual)"}
    >
      {isInstalling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
    </Button>
  )
}
