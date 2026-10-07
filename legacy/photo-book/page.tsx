export default function PhotoBookPage() {
  return (
    <iframe
      src="https://dev.pixovo.com/photobook/"
      title="Pixovo Photo Book Studio"
      className="fixed inset-0 w-screen h-screen border-0 z-50 bg-background"
      allow="camera; microphone; payment; clipboard-read; clipboard-write"
    />
  )
}
