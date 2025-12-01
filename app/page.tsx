import { AsciiCam } from '@/components/ascii-cam'

export default function Page() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black text-foreground flex flex-col">
      <AsciiCam />
    </main>
  )
}
