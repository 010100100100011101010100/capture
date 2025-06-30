"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Clock, Palette, ChevronDown, ChevronUp, Target, Mountain, Trash2 } from "lucide-react"
import { InstallButton } from "@/components/install-button"
// Remove this import line:
// import { PWAFeatures } from "@/components/pwa-features"

interface Note {
  id: string
  content: string
  createdAt: number
  section: "30min" | "60min" | "2hours" | "24hours" | "1year" | "10years"
}

const DURATIONS = {
  "30min": 30 * 60 * 1000,
  "60min": 60 * 60 * 1000,
  "2hours": 2 * 60 * 60 * 1000,
  "24hours": 24 * 60 * 60 * 1000,
  "1year": 365 * 24 * 60 * 60 * 1000,
  "10years": 10 * 365 * 24 * 60 * 60 * 1000,
}

const SECTION_LABELS = {
  "30min": "30 Minutes",
  "60min": "60 Minutes",
  "2hours": "2 Hours",
  "24hours": "24 Hours",
  "1year": "1 Year",
  "10years": "10 Years",
}

const COLOR_THEMES = {
  electric: {
    name: "Electric",
    background: "bg-yellow-300",
    sections: {
      "30min": "bg-red-200 border-red-600",
      "60min": "bg-blue-200 border-blue-600",
      "2hours": "bg-green-200 border-green-600",
      "24hours": "bg-purple-200 border-purple-600",
      "1year": "bg-orange-200 border-orange-600",
      "10years": "bg-indigo-200 border-indigo-600",
    },
  },
  neon: {
    name: "Neon",
    background: "bg-pink-300",
    sections: {
      "30min": "bg-cyan-200 border-cyan-600",
      "60min": "bg-lime-200 border-lime-600",
      "2hours": "bg-orange-200 border-orange-600",
      "24hours": "bg-rose-200 border-rose-600",
      "1year": "bg-amber-200 border-amber-600",
      "10years": "bg-violet-200 border-violet-600",
    },
  },
  retro: {
    name: "Retro",
    background: "bg-orange-300",
    sections: {
      "30min": "bg-amber-200 border-amber-600",
      "60min": "bg-emerald-200 border-emerald-600",
      "2hours": "bg-violet-200 border-violet-600",
      "24hours": "bg-teal-200 border-teal-600",
      "1year": "bg-rose-200 border-rose-600",
      "10years": "bg-blue-200 border-blue-600",
    },
  },
  midnight: {
    name: "Midnight",
    background: "bg-slate-800",
    sections: {
      "30min": "bg-red-800 border-red-300",
      "60min": "bg-blue-800 border-blue-300",
      "2hours": "bg-green-800 border-green-300",
      "24hours": "bg-purple-800 border-purple-300",
      "1year": "bg-orange-800 border-orange-300",
      "10years": "bg-indigo-800 border-indigo-300",
    },
  },
}

export default function Component() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteContent, setNewNoteContent] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<keyof typeof DURATIONS>("30min")
  const [currentTheme, setCurrentTheme] = useState<keyof typeof COLOR_THEMES>("electric")
  const [isOneYearOpen, setIsOneYearOpen] = useState(false)
  const [isTenYearsOpen, setIsTenYearsOpen] = useState(false)

  // Add this state and useEffect after the existing state declarations:

  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // Register service worker and PWA features
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration)

          // Check for updates
          registration.addEventListener("updatefound", () => {
            console.log("New service worker found")
          })
        })
        .catch((error) => {
          console.log("SW registration failed:", error)
        })
    }

    // Handle URL shortcuts
    const urlParams = new URLSearchParams(window.location.search)
    const quickSection = urlParams.get("quick")
    if (quickSection && quickSection in DURATIONS) {
      setSelectedSection(quickSection as keyof typeof DURATIONS)
      setIsModalOpen(true)
    }
  }, [])

  // Add this useEffect after the existing service worker registration useEffect:

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setUpdateAvailable(true)
      })
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("capture-notes")
    const savedTheme = localStorage.getItem("capture-theme")
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
    if (savedTheme && savedTheme in COLOR_THEMES) {
      setCurrentTheme(savedTheme as keyof typeof COLOR_THEMES)
    }
  }, [])

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem("capture-notes", JSON.stringify(notes))
  }, [notes])

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("capture-theme", currentTheme)
  }, [currentTheme])

  // Clean up expired notes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setNotes((prevNotes) =>
        prevNotes.filter((note) => {
          const timeElapsed = now - note.createdAt
          const duration = DURATIONS[note.section]
          return timeElapsed < duration
        }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const addNote = () => {
    if (!newNoteContent.trim()) return

    const newNote: Note = {
      id: Date.now().toString(),
      content: newNoteContent.trim(),
      createdAt: Date.now(),
      section: selectedSection,
    }

    setNotes((prev) => [...prev, newNote])
    setNewNoteContent("")
    setIsModalOpen(false)
  }

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }

  const openModal = (section: keyof typeof DURATIONS) => {
    setSelectedSection(section)
    setIsModalOpen(true)
  }

  const getNotesForSection = (section: keyof typeof DURATIONS) => {
    return notes.filter((note) => note.section === section)
  }

  const getTimeRemaining = (note: Note) => {
    const now = Date.now()
    const timeElapsed = now - note.createdAt
    const duration = DURATIONS[note.section]
    const remaining = duration - timeElapsed

    if (remaining <= 0) return "Expired"

    // For long-term notes, show different format
    if (note.section === "1year" || note.section === "10years") {
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
      const years = Math.floor(days / 365)
      const remainingDays = days % 365

      if (years > 0) {
        return `${years}y ${remainingDays}d`
      }
      return `${days}d`
    }

    const minutes = Math.floor(remaining / (60 * 1000))
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const theme = COLOR_THEMES[currentTheme]
  const textColor = currentTheme === "midnight" ? "text-white" : "text-black"
  const sectionTextColor = currentTheme === "midnight" ? "text-white" : "text-black"

  const shortTermSections = ["30min", "60min", "2hours", "24hours"] as const
  const oneYearNotes = getNotesForSection("1year")
  const tenYearNotes = getNotesForSection("10years")

  return (
    <div className={`min-h-screen ${theme.background} p-3 sm:p-4`}>
      {/* PWA Status Indicators */}
      {!isOnline && (
        <div className="fixed top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-50">
          <div className="bg-orange-400 border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-3 text-center">
            <span className="font-black text-black text-sm sm:text-base">📱 OFFLINE MODE - Notes saved locally</span>
          </div>
        </div>
      )}

      {updateAvailable && (
        <div className="fixed top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-50">
          <div className="bg-blue-400 border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-3 text-center">
            <span className="font-black text-black mr-2 sm:mr-3 text-sm sm:text-base">🚀 UPDATE AVAILABLE</span>
            <button
              onClick={handleUpdate}
              className="bg-white text-black font-black border-2 border-black px-2 py-1 sm:px-3 sm:py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-sm"
            >
              REFRESH
            </button>
          </div>
        </div>
      )}
      {/* Remove this line from the return statement:
      // <PWAFeatures /> */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #000;
          border: 3px solid #fff;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #000;
          border: 3px solid #fff;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
          border-radius: 0;
        }
        .slider:hover::-webkit-slider-thumb {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px 0px rgba(0,0,0,1);
        }
        .slider:active::-webkit-slider-thumb {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0px 0px rgba(0,0,0,1);
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl font-black ${textColor} mb-2 md:mb-4 transform -rotate-1`}
              >
                CAPTURE
              </h1>
              <p className={`text-lg sm:text-xl font-bold ${textColor}`}>Capture thoughts before they fade ⚡</p>
            </div>

            {/* Top Right Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Install Button */}
              <InstallButton />

              {/* Theme Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className={`flex items-center gap-2 ${textColor} font-black`}>
                  <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-base sm:text-lg">VIBE</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-3 rounded-none w-full sm:w-auto">
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={Object.keys(COLOR_THEMES).indexOf(currentTheme)}
                    onChange={(e) => {
                      const themeKeys = Object.keys(COLOR_THEMES) as (keyof typeof COLOR_THEMES)[]
                      setCurrentTheme(themeKeys[Number.parseInt(e.target.value)])
                    }}
                    className="w-24 sm:w-32 h-3 bg-gray-300 appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #3b82f6 33%, #10b981 66%, #8b5cf6 100%)`,
                    }}
                  />
                  <span className="font-black text-black text-xs sm:text-sm min-w-[50px] sm:min-w-[60px]">
                    {COLOR_THEMES[currentTheme].name.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Missions Section with Boundary */}
        <div className="mb-12">
          {/* Daily Missions Header */}
          <div className="mb-4 md:mb-6">
            <div
              className={`p-3 sm:p-4 border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-black/5 rounded-full -translate-y-6 translate-x-6 sm:-translate-y-8 sm:translate-x-8"></div>
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-black mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                  DAILY MISSIONS
                </h2>
                <p className="text-sm sm:text-base font-bold text-black/70">Quick captures that fade with time</p>
              </div>
            </div>
          </div>

          {/* Daily Missions Grid */}
          <div
            className={`p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white/80 backdrop-blur-sm`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {shortTermSections.map((key) => {
                const label = SECTION_LABELS[key]
                const sectionNotes = getNotesForSection(key)
                const sectionColors = theme.sections[key]

                return (
                  <div key={key} className="space-y-3 sm:space-y-4">
                    <div
                      className={`p-3 sm:p-4 border-3 sm:border-4 ${sectionColors} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative min-h-[100px] sm:min-h-[120px] flex flex-col justify-between`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className={`text-lg sm:text-xl font-black ${sectionTextColor} flex items-center gap-1 sm:gap-2 leading-tight`}
                        >
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="break-words text-sm sm:text-base">{label.toUpperCase()}</span>
                        </h3>

                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => openModal(key)}
                              className="bg-white hover:bg-gray-100 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-1.5 sm:p-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                            >
                              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                      </div>
                      <div className="mt-auto">
                        <p className={`font-bold ${sectionTextColor} text-xs sm:text-sm`}>
                          {sectionNotes.length} note{sectionNotes.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      {sectionNotes.map((note) => (
                        <Card
                          key={note.id}
                          className={`p-3 sm:p-4 border-3 sm:border-4 ${sectionColors} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-black break-words flex-1 mr-2 text-sm sm:text-base">
                              {note.content}
                            </p>
                            <Button
                              onClick={() => deleteNote(note.id)}
                              className="bg-red-500 hover:bg-red-600 text-white font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                          <div className="text-xs sm:text-sm font-black text-black opacity-70">
                            ⏱️ {getTimeRemaining(note)} left
                          </div>
                        </Card>
                      ))}

                      {sectionNotes.length === 0 && (
                        <div className={`p-3 sm:p-4 border-3 sm:border-4 border-dashed ${sectionColors} bg-white/50`}>
                          <p className="text-black font-bold text-center opacity-50 text-sm">No notes yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Long-term Goals Section */}
        <div className="mb-12">
          {/* Long-term Goals Header */}
          <div className="mb-4 md:mb-6">
            <div
              className={`p-3 sm:p-4 border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-black/5 rounded-full -translate-y-6 translate-x-6 sm:-translate-y-8 sm:translate-x-8"></div>
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-black mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                  <Mountain className="w-6 h-6 sm:w-8 sm:h-8" />
                  LONG-TERM VISIONS
                </h2>
                <p className="text-sm sm:text-base font-bold text-black/70">Goals that shape your future</p>
              </div>
            </div>
          </div>

          {/* Long-term Goals Container with Boundary */}
          <div
            className={`p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white/80 backdrop-blur-sm`}
          >
            <div className="space-y-4 sm:space-y-6">
              {/* 1 Year Section - Important */}
              <Collapsible open={isOneYearOpen} onOpenChange={setIsOneYearOpen}>
                <CollapsibleTrigger asChild>
                  <div className={`cursor-pointer transform hover:scale-[1.01] transition-transform`}>
                    <div
                      className={`p-4 sm:p-5 border-4 sm:border-6 ${theme.sections["1year"]} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-white to-gray-50 relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-black/5 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-12 sm:translate-x-12"></div>
                      <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Target className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                            <div>
                              <h2 className="text-2xl sm:text-3xl font-black text-black mb-1">ANNUAL GOALS</h2>
                              <p className="text-sm sm:text-base font-bold text-black/70">Your year-long aspirations</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <div className="text-lg sm:text-xl font-black text-black">{oneYearNotes.length}</div>
                              <div className="text-xs sm:text-sm font-bold text-black/70">
                                GOAL{oneYearNotes.length !== 1 ? "S" : ""}
                              </div>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                openModal("1year")
                              }}
                              className="bg-black hover:bg-gray-800 text-white font-black border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-3 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                            {isOneYearOpen ? (
                              <ChevronUp className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
                            ) : (
                              <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 sm:mt-3">
                  <div className="space-y-2 sm:space-y-3 pl-2 sm:pl-3">
                    {oneYearNotes.map((note) => (
                      <Card
                        key={note.id}
                        className={`p-4 sm:p-5 border-3 sm:border-4 ${theme.sections["1year"]} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-black text-sm sm:text-base break-words flex-1 mr-2">
                            {note.content}
                          </p>
                          <Button
                            onClick={() => deleteNote(note.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-black/70">
                          🎯 {getTimeRemaining(note)} remaining
                        </div>
                      </Card>
                    ))}
                    {oneYearNotes.length === 0 && (
                      <div
                        className={`p-4 sm:p-5 border-3 sm:border-4 border-dashed ${theme.sections["1year"]} bg-white/50`}
                      >
                        <p className="text-black font-bold text-center opacity-50 text-sm">
                          No annual goals yet - What do you want to achieve this year?
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* 10 Years Section - Most Important */}
              <Collapsible open={isTenYearsOpen} onOpenChange={setIsTenYearsOpen}>
                <CollapsibleTrigger asChild>
                  <div
                    className={`cursor-pointer transform hover:scale-[1.01] sm:hover:scale-[1.02] transition-transform`}
                  >
                    <div
                      className={`p-5 sm:p-6 border-6 sm:border-8 ${theme.sections["10years"]} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-white to-gray-50 relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-black/5 rounded-full -translate-y-10 translate-x-10 sm:-translate-y-16 sm:translate-x-16"></div>
                      <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <Mountain className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
                            <div>
                              <h2 className="text-3xl sm:text-4xl font-black text-black mb-1 sm:mb-2">DECADE VISION</h2>
                              <p className="text-base sm:text-lg font-bold text-black/70">Your 10-year legacy goals</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <div className="text-xl sm:text-2xl font-black text-black">{tenYearNotes.length}</div>
                              <div className="text-xs sm:text-sm font-bold text-black/70">
                                VISION{tenYearNotes.length !== 1 ? "S" : ""}
                              </div>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                openModal("10years")
                              }}
                              className="bg-black hover:bg-gray-800 text-white font-black border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-3 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                            </Button>
                            {isTenYearsOpen ? (
                              <ChevronUp className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                            ) : (
                              <ChevronDown className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 sm:mt-4">
                  <div className="space-y-3 sm:space-y-4 pl-3 sm:pl-4">
                    {tenYearNotes.map((note) => (
                      <Card
                        key={note.id}
                        className={`p-5 sm:p-6 border-4 sm:border-6 ${theme.sections["10years"]} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white`}
                      >
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <p className="font-bold text-black text-base sm:text-lg break-words flex-1 mr-2">
                            {note.content}
                          </p>
                          <Button
                            onClick={() => deleteNote(note.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                            title="Delete vision"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <div className="text-sm sm:text-base font-black text-black/70">
                          🏔️ {getTimeRemaining(note)} remaining
                        </div>
                      </Card>
                    ))}
                    {tenYearNotes.length === 0 && (
                      <div
                        className={`p-5 sm:p-6 border-3 sm:border-4 border-dashed ${theme.sections["10years"]} bg-white/50`}
                      >
                        <p className="text-black font-bold text-center text-base sm:text-lg opacity-50">
                          No decade visions yet - What legacy do you want to build?
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>

        {/* Note Creation Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="border-3 sm:border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white max-w-sm sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-black text-black">
                {selectedSection === "10years"
                  ? "ADD DECADE VISION"
                  : selectedSection === "1year"
                    ? "ADD ANNUAL GOAL"
                    : `ADD NOTE TO ${SECTION_LABELS[selectedSection].toUpperCase()}`}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4">
              <div
                className={`p-2 sm:p-3 border-3 sm:border-4 ${theme.sections[selectedSection]} font-bold text-black text-sm sm:text-base`}
              >
                {selectedSection === "10years"
                  ? "🏔️ This vision will guide you for the next decade"
                  : selectedSection === "1year"
                    ? "🎯 This goal will motivate you for the next year"
                    : `⏰ This note will disappear in ${SECTION_LABELS[selectedSection].toLowerCase()}`}
              </div>

              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder={
                  selectedSection === "10years"
                    ? "What legacy do you want to build in 10 years?"
                    : selectedSection === "1year"
                      ? "What do you want to achieve this year?"
                      : "Write your temporary note here..."
                }
                className="border-3 sm:border-4 border-black font-bold text-base sm:text-lg resize-none focus:ring-0 focus:border-black"
                rows={selectedSection === "10years" || selectedSection === "1year" ? 5 : 3}
                autoFocus
              />

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={addNote}
                  disabled={!newNoteContent.trim()}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-black font-black border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] py-3"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">
                    {selectedSection === "10years"
                      ? "ADD VISION"
                      : selectedSection === "1year"
                        ? "ADD GOAL"
                        : "ADD NOTE"}
                  </span>
                </Button>

                <Button
                  onClick={() => {
                    setIsModalOpen(false)
                    setNewNoteContent("")
                  }}
                  className="bg-red-400 hover:bg-red-500 text-black font-black border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all py-3 px-4 sm:px-6"
                >
                  <span className="text-sm sm:text-base">CANCEL</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mini Footer */}
        <footer className="mt-12 sm:mt-16 mb-6 sm:mb-8">
          <div
            className={`p-3 sm:p-4 border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white`}
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black border-2 border-black transform rotate-45"></div>
                <div>
                  <p className="font-black text-black text-xs sm:text-sm">
                    CRAFTED BY <span className="text-sm sm:text-lg">SHERA</span>
                  </p>
                  <p className="font-bold text-black/70 text-xs">a.k.a Rasesh</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <a
                  href="https://x.com/raseshGaut_BTC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-400 hover:bg-blue-500 text-black font-black border-2 sm:border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-2 py-1 sm:px-3 sm:py-2 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-xs sm:text-sm">TWITTER</span>
                  </div>
                </a>

                <a
                  href="https://github.com/010100100100011101010100"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-400 hover:bg-gray-500 text-black font-black border-2 sm:border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-2 py-1 sm:px-3 sm:py-2 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="text-xs sm:text-sm">GITHUB</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
