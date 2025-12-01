'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Video, VideoOff, Settings, Camera, Download, RotateCcw } from 'lucide-react'

export function AsciiCam() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [asciiOutput, setAsciiOutput] = useState('')
  const [capturedAscii, setCapturedAscii] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [width, setWidth] = useState(160)
  const [fontSize, setFontSize] = useState(12)
  const [density, setDensity] = useState(0)
  const animationFrameRef = useRef<number>()

  const densitySets = [
    " .:-=+*#%@",
    " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    " ░▒▓█",
  ]

  const asciiChars = densitySets[density]

  useEffect(() => {
    setIsActive(true)
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isActive) {
        e.preventDefault()
        captureSnapshot()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isActive, asciiOutput])

  const captureSnapshot = () => {
    if (asciiOutput) {
      setCapturedAscii(asciiOutput)
    }
  }

  const resetCamera = () => {
    setCapturedAscii('')
  }

  const downloadImage = () => {
    const textToDownload = capturedAscii || asciiOutput
    if (!textToDownload) return

    const lines = textToDownload.split('\n')
    // Remove empty last line if it exists (common with split by \n)
    if (lines[lines.length - 1] === '') lines.pop()
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Font settings matching the display
    const lineHeight = fontSize * 0.55
    const font = `${fontSize}px monospace`
    
    ctx.font = font
    // @ts-ignore - letterSpacing is supported in modern browsers
    ctx.letterSpacing = '-1px'

    // Calculate dimensions
    // Measure the longest line to be safe
    const maxWidth = lines.reduce((max, line) => {
      return Math.max(max, ctx.measureText(line).width)
    }, 0)
    
    const padding = 40 // Add some padding
    canvas.width = maxWidth + (padding * 2)
    canvas.height = (lines.length * lineHeight) + (padding * 2)

    // Re-apply context settings after resize (canvas reset clears context)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.font = font
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'
    // @ts-ignore
    ctx.letterSpacing = '-1px'

    // Draw text
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + (i * lineHeight))
    })

    // Download
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `ascii-cam-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  useEffect(() => {
    if (isActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isActive])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        processFrame()
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setIsActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    const height = Math.floor((width * video.videoHeight) / video.videoWidth)

    canvas.width = width
    canvas.height = height

    ctx.drawImage(video, 0, 0, width, height)

    ctx.filter = 'contrast(1.5)'
    ctx.drawImage(video, 0, 0, width, height)
    ctx.filter = 'none'

    const imageData = ctx.getImageData(0, 0, width, height)
    const pixels = imageData.data

    let ascii = ''

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4
        const r = pixels[offset]
        const g = pixels[offset + 1]
        const b = pixels[offset + 2]

        const brightness = (r + g + b) / 3
        const charIndex = Math.floor((brightness / 255) * (asciiChars.length - 1))
        ascii += asciiChars[charIndex]
      }
      ascii += '\n'
    }

    setAsciiOutput(ascii)
    animationFrameRef.current = requestAnimationFrame(processFrame)
  }

  useEffect(() => {
    if (isActive) {
      processFrame()
    }
  }, [width, density])

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0 relative">
        <div className="flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-9 w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold tracking-tight">
          {"ASCII Webcam Filter"}
        </h1>

        <div className="flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={resetCamera}
            disabled={!capturedAscii}
            className={`h-9 w-9 ${capturedAscii ? 'text-white' : 'text-zinc-600'}`}
            title="Reset Camera"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={captureSnapshot}
            disabled={!isActive || !!capturedAscii}
            className="h-9 w-9"
            title="Capture (Space)"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={downloadImage}
            disabled={!asciiOutput && !capturedAscii}
            className="h-9 w-9"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant={isActive ? 'secondary' : 'default'}
            size="icon"
            onClick={() => setIsActive(!isActive)}
            className={`h-9 w-9 ${isActive ? 'bg-white text-black hover:bg-gray-200' : ''}`}
          >
            {isActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 border-r border-border p-6 space-y-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="space-y-3">
              <label className="text-sm font-medium">Resolution (Width)</label>
              <Slider
                value={[width]}
                onValueChange={(value) => setWidth(value[0])}
                min={60}
                max={320}
                step={4}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{width} characters</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Size</label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={6}
                max={24}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{fontSize}px</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Character Density</label>
              <Slider
                value={[density]}
                onValueChange={(value) => setDensity(value[0])}
                min={0}
                max={2}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground font-mono">
                {asciiChars.split('').join(' ')}
              </p>
            </div>
          </div>
        )}

        {/* ASCII Output */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden bg-black w-full h-full">
          {isActive || capturedAscii ? (
            <pre
              className="font-mono text-foreground select-none whitespace-pre leading-none"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: `${fontSize * 0.55}px`,
                letterSpacing: '-1px',
                maxWidth: '100%',
                maxHeight: '100%',
                overflow: 'hidden'
              }}
            >
              {capturedAscii || asciiOutput}
            </pre>
          ) : (
            <div className="text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Click the camera icon to start</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden video and canvas elements */}
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
