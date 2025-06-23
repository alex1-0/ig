"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Trash2, Plus, ArrowUp } from "lucide-react"

const WORDS = [
  "Pizza",
  "Strand",
  "Kino",
  "Schule",
  "Auto",
  "Handy",
  "Musik",
  "Sport",
  "Buch",
  "Kaffee",
  "Hund",
  "Katze",
  "Baum",
  "Haus",
  "Wasser",
  "Feuer",
  "Berg",
  "See",
  "Stadt",
  "Land",
  "Freund",
  "Familie",
  "Arbeit",
  "Urlaub",
  "Party",
  "Spiel",
  "Film",
  "Foto",
  "Brief",
  "Geschenk",
]

const SIMILAR_WORDS = {
  Pizza: ["Pasta", "Burger", "Döner"],
  Strand: ["Meer", "Pool", "See"],
  Kino: ["Theater", "Konzert", "Show"],
  Schule: ["Uni", "Büro", "Bibliothek"],
  Auto: ["Bus", "Zug", "Fahrrad"],
  Handy: ["Tablet", "Laptop", "Computer"],
  Musik: ["Radio", "Konzert", "Lied"],
  Sport: ["Fitness", "Gym", "Training"],
  Buch: ["Zeitung", "Magazin", "Roman"],
  Kaffee: ["Tee", "Kakao", "Saft"],
  Hund: ["Katze", "Hamster", "Vogel"],
  Katze: ["Hund", "Maus", "Tiger"],
  Baum: ["Busch", "Blume", "Gras"],
  Haus: ["Wohnung", "Villa", "Hütte"],
  Wasser: ["Saft", "Milch", "Tee"],
  Feuer: ["Kerze", "Licht", "Sonne"],
  Berg: ["Hügel", "Tal", "Felsen"],
  See: ["Fluss", "Teich", "Meer"],
  Stadt: ["Dorf", "Bezirk", "Viertel"],
  Land: ["Staat", "Nation", "Region"],
  Freund: ["Kumpel", "Buddy", "Partner"],
  Familie: ["Verwandte", "Clan", "Sippe"],
  Arbeit: ["Job", "Beruf", "Tätigkeit"],
  Urlaub: ["Reise", "Trip", "Ausflug"],
  Party: ["Feier", "Event", "Fest"],
  Spiel: ["Game", "Match", "Partie"],
  Film: ["Movie", "Serie", "Video"],
  Foto: ["Bild", "Selfie", "Schnappschuss"],
  Brief: ["Mail", "Nachricht", "Post"],
  Geschenk: ["Präsent", "Überraschung", "Mitbringsel"],
}

export default function Component() {
  const [gamePhase, setGamePhase] = useState<"setup" | "reveal" | "playing">("setup")
  const [players, setPlayers] = useState<string[]>([""])
  const [impostorCount, setImpostorCount] = useState([1])
  const [giveHint, setGiveHint] = useState(true)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [gameWord, setGameWord] = useState("")
  const [impostors, setImpostors] = useState<number[]>([])
  const [playerWords, setPlayerWords] = useState<string[]>([]) // Feste Wörter für jeden Spieler
  const [cardOffset, setCardOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const maxOffset = 250

  // Lokale Speicherung laden
  useEffect(() => {
    const savedPlayers = localStorage.getItem("impostor-players")
    const savedSettings = localStorage.getItem("impostor-settings")

    if (savedPlayers) {
      try {
        const parsedPlayers = JSON.parse(savedPlayers)
        if (Array.isArray(parsedPlayers) && parsedPlayers.length > 0) {
          setPlayers(parsedPlayers)
        }
      } catch (e) {
        console.error("Fehler beim Laden der Spieler:", e)
      }
    }

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        if (parsedSettings.impostorCount) setImpostorCount([parsedSettings.impostorCount])
        if (typeof parsedSettings.giveHint === "boolean") setGiveHint(parsedSettings.giveHint)
      } catch (e) {
        console.error("Fehler beim Laden der Einstellungen:", e)
      }
    }
  }, [])

  // Lokale Speicherung speichern
  useEffect(() => {
    const validPlayers = players.filter((p) => p.trim() !== "")
    if (validPlayers.length > 0) {
      localStorage.setItem("impostor-players", JSON.stringify(players))
    }
  }, [players])

  useEffect(() => {
    localStorage.setItem(
      "impostor-settings",
      JSON.stringify({
        impostorCount: impostorCount[0],
        giveHint,
      }),
    )
  }, [impostorCount, giveHint])

  const addPlayer = () => {
    setPlayers([...players, ""])
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index] = name
    setPlayers(newPlayers)
  }

  const startGame = () => {
    const validPlayers = players.filter((p) => p.trim() !== "")
    if (validPlayers.length < 3) {
      alert("Mindestens 3 Spieler benötigt!")
      return
    }

    if (impostorCount[0] >= validPlayers.length) {
      alert("Zu viele Impostors!")
      return
    }

    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)]
    setGameWord(randomWord)

    // Wähle genau so viele Impostors wie eingestellt
    const shuffledIndices = Array.from({ length: validPlayers.length }, (_, i) => i).sort(() => Math.random() - 0.5)
    const selectedImpostors = shuffledIndices.slice(0, impostorCount[0])
    setImpostors(selectedImpostors)

    // Generiere feste Wörter für jeden Spieler
    const wordsForPlayers = validPlayers.map((_, index) => {
      const isImpostor = selectedImpostors.includes(index)
      if (isImpostor) {
        if (giveHint && SIMILAR_WORDS[randomWord]) {
          const hints = SIMILAR_WORDS[randomWord]
          return hints[Math.floor(Math.random() * hints.length)]
        }
        return "IMPOSTOR"
      }
      return randomWord
    })

    setPlayerWords(wordsForPlayers)
    setPlayers(validPlayers)
    setGamePhase("reveal")
    setCurrentPlayerIndex(0)
    setCardOffset(0)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    startY.current = e.touches[0].clientY
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      setAutoHideTimer(null)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const deltaY = startY.current - currentY
    const newOffset = Math.max(0, Math.min(maxOffset, deltaY))
    setCardOffset(newOffset)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Flüssiges Ziehen - jede Bewegung löst Auto-Hide aus
    setCardOffset(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startY.current = e.clientY
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      setAutoHideTimer(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const currentY = e.clientY
    const deltaY = startY.current - currentY
    const newOffset = Math.max(0, Math.min(maxOffset, deltaY))
    setCardOffset(newOffset)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Flüssiges Ziehen - jede Bewegung löst Auto-Hide aus
    setCardOffset(0)
  }

  const hideCard = () => {
    setCardOffset(0)
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      setAutoHideTimer(null)
    }
  }

  const nextPlayer = () => {
    hideCard()
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1)
    } else {
      setGamePhase("playing")
    }
  }

  const resetGame = () => {
    setGamePhase("setup")
    setCurrentPlayerIndex(0)
    setCardOffset(0)
    setPlayerWords([])
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
    }
  }

  const getCurrentPlayerWord = () => {
    return playerWords[currentPlayerIndex] || ""
  }

  const isCurrentPlayerImpostor = () => {
    return impostors.includes(currentPlayerIndex)
  }

  useEffect(() => {
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer)
      }
    }
  }, [autoHideTimer])

  if (gamePhase === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🕵️ IMPOSTOR GAME
              </CardTitle>
              <p className="text-gray-400 text-sm">Einstellungen werden automatisch gespeichert</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-purple-300 text-lg font-semibold">Spieler</Label>
                <div className="space-y-3 mt-2">
                  {players.map((player, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={player}
                        onChange={(e) => updatePlayer(index, e.target.value)}
                        placeholder={`Spieler ${index + 1}`}
                        className="bg-gray-700/50 border-purple-500/30 text-white placeholder-gray-400"
                      />
                      {players.length > 1 && (
                        <Button
                          onClick={() => removePlayer(index)}
                          variant="outline"
                          size="icon"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addPlayer}
                    variant="outline"
                    className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Spieler hinzufügen
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-purple-300 text-lg font-semibold">Anzahl Impostors: {impostorCount[0]}</Label>
                  <Slider
                    value={impostorCount}
                    onValueChange={setImpostorCount}
                    max={Math.max(1, players.filter((p) => p.trim() !== "").length - 1)}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-purple-300 text-lg font-semibold">Impostor bekommt Hinweis</Label>
                  <Switch
                    checked={giveHint}
                    onCheckedChange={setGiveHint}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              </div>

              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 text-lg"
              >
                🚀 SPIEL STARTEN
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gamePhase === "reveal") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 overflow-hidden">
        <div className="max-w-lg mx-auto h-screen flex flex-col">
          {/* Header */}
          <div className="text-center py-4">
            <h2 className="text-xl font-bold text-white">
              Karte {currentPlayerIndex + 1} von {players.length}
            </h2>
            <p className="text-gray-400 text-sm">Ziehe die Karte nach oben um das Wort zu sehen</p>
          </div>

          {/* Reveal Area */}
          <div className="flex-1 relative max-w-sm mx-auto w-full">
            {/* Das versteckte Wort (liegt unter der Karte) - KONSTANT */}
            <div className="absolute top-20 left-0 right-0 h-80 flex items-center justify-center">
              <div
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-purple-500/50 p-8 w-full h-full flex flex-col items-center justify-center"
                style={{
                  clipPath: `inset(${Math.max(0, maxOffset - cardOffset)}px 0 0 0)`,
                  transition: isDragging ? "none" : "clip-path 0.3s ease-out",
                }}
              >
                <div className="text-center space-y-4">
                  <p className="text-4xl font-bold">
                    {isCurrentPlayerImpostor() ? (
                      <span className="text-red-400">{getCurrentPlayerWord()}</span>
                    ) : (
                      <span className="text-green-400">{getCurrentPlayerWord()}</span>
                    )}
                  </p>
                  {isCurrentPlayerImpostor() && getCurrentPlayerWord() !== "IMPOSTOR" && (
                    <p className="text-red-300 text-sm">Du bist der Impostor! Hinweis oben ↑</p>
                  )}
                  {isCurrentPlayerImpostor() && getCurrentPlayerWord() === "IMPOSTOR" && (
                    <p className="text-red-300 text-sm">Du bist der Impostor!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Die ziehbare Karte (liegt über dem Wort) */}
            <div
              ref={cardRef}
              className="absolute top-20 left-0 right-0 h-80 bg-gradient-to-br from-purple-800 to-pink-800 rounded-lg border border-purple-500/50 backdrop-blur-sm cursor-grab active:cursor-grabbing select-none shadow-2xl"
              style={{
                transform: `translateY(-${cardOffset}px)`,
                transition: isDragging ? "none" : "transform 0.3s ease-out",
                boxShadow: cardOffset > 0 ? "0 20px 40px rgba(0,0,0,0.5)" : "0 10px 20px rgba(0,0,0,0.3)",
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                {/* Spielername prominent anzeigen */}
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-white mb-2">{players[currentPlayerIndex]}</h3>
                  <p className="text-purple-200 text-sm">Deine Karte</p>
                </div>

                {/* Zieh-Indikator */}
                <div className="space-y-4">
                  <div className="w-12 h-1 bg-white/50 rounded-full mx-auto"></div>
                  <ArrowUp className="h-8 w-8 text-white/70 mx-auto animate-bounce" />
                  <p className="text-white/80 text-sm">Ziehe nach oben</p>
                </div>

                {/* Progress Indicator - FLÜSSIG */}
                <div className="mt-8 w-full">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full"
                      style={{
                        width: `${(cardOffset / maxOffset) * 100}%`,
                        transition: isDragging ? "none" : "width 0.1s ease-out",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Controls */}
          <div className="text-center mt-8 space-y-4">
            <Button
              onClick={nextPlayer}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3"
            >
              {currentPlayerIndex < players.length - 1
                ? `Nächster: ${players[currentPlayerIndex + 1]}`
                : "Spiel starten!"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎮 SPIEL LÄUFT!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-900/70 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-bold text-purple-300 mb-4">Spielregeln:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Jeder sagt reihum ein Wort, das zum geheimen Wort passt</li>
                <li>
                  • Die {impostorCount[0]} Impostor{impostorCount[0] > 1 ? "s" : ""} kennen das Wort nicht und müssen
                  raten
                </li>
                <li>• Impostors versuchen unentdeckt zu bleiben</li>
                <li>• Nach jeder Runde könnt ihr abstimmen wer der Impostor ist</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-purple-300 font-semibold mb-2">Spieler:</h4>
                <div className="space-y-1">
                  {players.map((player, index) => (
                    <div key={index} className="text-gray-300 text-sm">
                      {index + 1}. {player}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-red-300 font-semibold mb-2">Info:</h4>
                <p className="text-gray-300 text-sm">
                  {impostorCount[0]} Impostor{impostorCount[0] > 1 ? "s" : ""} im Spiel
                </p>
                <p className="text-gray-300 text-sm">Hinweise: {giveHint ? "An" : "Aus"}</p>
              </div>
            </div>

            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3"
            >
              🔄 NEUES SPIEL
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
