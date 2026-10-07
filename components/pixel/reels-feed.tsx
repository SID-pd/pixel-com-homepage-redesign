'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Volume2, 
  VolumeX, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  ShoppingBag, 
  CheckCircle2, 
  Music, 
  Play, 
  Pause, 
  X, 
  Send,
  Maximize2,
  Sparkles
} from 'lucide-react'
import { SectionHeading } from './section-heading'
import { Reveal, RevealItem } from './reveal'

export interface ReelItem {
  id: number
  videoSrc: string
  fallbackSrc: string
  handle: string
  verified: boolean
  caption: string
  music: string
  likes: string
  comments: string
  product: {
    title: string
    price: string
    desc: string
  }
}

const reelsData: ReelItem[] = [
  {
    id: 1,
    videoSrc: '/reels/reel1.mp4',
    fallbackSrc: './1791192192136259.mp4',
    handle: '@pixovo.official',
    verified: true,
    caption: 'Unboxing memories that last forever ✨ Crafting layflat photobooks with zero spine gap!',
    music: 'Pixovo Original Audio - Memory Craft',
    likes: '18.4K',
    comments: '342',
    product: {
      title: 'Layflat Photobook',
      price: '$29.99',
      desc: '100% Layflat Binding with 400gsm Premium Pearl Paper'
    }
  },
  {
    id: 2,
    videoSrc: '/reels/reel2.mp4',
    fallbackSrc: './download_(1) (1).mp4',
    handle: '@pixovo.creators',
    verified: true,
    caption: 'From phone camera roll straight to a luxury physical photo album 📸 Easy order in 3 mins.',
    music: 'Trending Beats - Studio Vibe',
    likes: '24.9K',
    comments: '512',
    product: {
      title: 'Classic Softcover Album',
      price: '$19.99',
      desc: 'Lightweight flexible cover with crystal clear photo gloss'
    }
  },
  {
    id: 3,
    videoSrc: '/reels/reel3.mp4',
    fallbackSrc: './I finally found a gift that (1) (1) (1).mp4',
    handle: '@pixovo.stories',
    verified: true,
    caption: 'I finally found the ultimate anniversary gift! 🎁 Heartfelt photobooks made in minutes.',
    music: 'Aesthetic Acoustic - Gift Edition',
    likes: '42.1K',
    comments: '890',
    product: {
      title: 'Anniversary Keepsake Book',
      price: '$34.99',
      desc: 'Custom foil stamped hardcover with velvet touch cover'
    }
  },
  {
    id: 4,
    videoSrc: '/reels/reel4.mp4',
    fallbackSrc: './I_got_my_pixovo_photobook-English_(United_States) (1).mp4',
    handle: '@pixovo.reviews',
    verified: true,
    caption: 'My Pixovo Photobook just arrived! 😍 The color accuracy & paper texture exceed all expectations.',
    music: 'Original Sound - Pixovo Unbox',
    likes: '12.8K',
    comments: '198',
    product: {
      title: 'Deluxe Matte Photobook',
      price: '$39.99',
      desc: 'Studio grade anti-glare matte finish paper'
    }
  },
  {
    id: 5,
    videoSrc: '/reels/reel5.mp4',
    fallbackSrc: './Pixovo Ad (2) (1).mp4',
    handle: '@pixovo.official',
    verified: true,
    caption: 'Transform your holiday photos into keepsake albums 🎄 Special discount active now!',
    music: 'Holiday Chill - Festive Vibez',
    likes: '31.5K',
    comments: '640',
    product: {
      title: 'Holiday Edition Album',
      price: '$24.99',
      desc: 'Festive themed templates & gold embossed accents'
    }
  },
  {
    id: 6,
    videoSrc: '/reels/reel6.mp4',
    fallbackSrc: './Untitled design (1)-esv2-50p-bg-5p-music-m (1).mp4',
    handle: '@pixovo.design',
    verified: true,
    caption: "Flip through life's finest moments 📖 Premium layflat binding with zero spine gap.",
    music: 'Ambient Piano - Memory Lane',
    likes: '29.2K',
    comments: '425',
    product: {
      title: 'Pro Seamless Layflat',
      price: '$44.99',
      desc: 'Ultra luxury rigid pages with archival ink print'
    }
  }
]

export function ReelsFeedSection() {
  const [isMuted, setIsMuted] = useState(true)
  const [activeTab, setActiveTab] = useState<'phone' | 'fullscreen'>('phone')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // Drawers state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [commentsList, setCommentsList] = useState([
    { id: 1, user: 'Sarah Jenkins', text: 'The print clarity on the layflat photobook is absolutely insane! Arrived in 2 days 🎉', time: '2h ago' },
    { id: 2, user: 'Marcus Vance', text: 'Did you use matte or glossy paper finish for this one?', time: '5h ago' },
    { id: 3, user: 'Elena Rostova', text: 'Just ordered 3 books for our family wedding gift ❤️ Cant wait!', time: '1d ago' }
  ])
  const [newComment, setNewComment] = useState('')
  
  const [selectedProduct, setSelectedProduct] = useState<{ title: string; price: string; desc: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    setCommentsList(prev => [
      { id: Date.now(), user: 'You', text: newComment.trim(), time: 'Just now' },
      ...prev
    ])
    setNewComment('')
  }

  return (
    <section aria-labelledby="reels-feed-title" className="px-3 md:px-6 my-16">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-secondary/60 px-4 py-12 md:px-12 md:py-20 border border-foreground/5 shadow-sm">
        <SectionHeading
          eyebrow="Community & Video Reels"
          title={
            <span id="reels-feed-title">
              Watch Real Photobooks <em className="text-accent font-serif">In Action</em>
            </span>
          }
          description="Explore real customer unboxing reels, layflat binding demonstrations, and gift inspiration."
        />

        {/* View Mode Switcher Header */}
        <div className="mt-8 flex items-center justify-between max-w-md mx-auto px-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            Pixovo Shorts Feed
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-background border border-foreground/10 shadow-sm text-foreground hover:bg-slate-100 transition"
            >
              {isMuted ? <VolumeX className="size-3.5 text-rose-500" /> : <Volume2 className="size-3.5 text-emerald-500" />}
              <span>{isMuted ? 'Unmute' : 'Muted'}</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'phone' ? 'fullscreen' : 'phone')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-background border border-foreground/10 shadow-sm text-foreground hover:bg-slate-100 transition"
            >
              <Maximize2 className="size-3.5 text-accent" />
              <span>{activeTab === 'phone' ? 'Expand' : 'Phone View'}</span>
            </button>
          </div>
        </div>

        {/* Main Feed Frame */}
        <div className="mt-6 flex justify-center">
          <div
            className={`relative w-full transition-all duration-500 overflow-hidden bg-black ${
              activeTab === 'fullscreen'
                ? 'max-w-4xl h-[780px] rounded-3xl shadow-2xl border-4 border-white dark:border-neutral-800'
                : 'max-w-[420px] h-[820px] rounded-[36px] shadow-2xl border-[10px] border-white dark:border-neutral-800'
            }`}
          >
            {/* Top Glass Header */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/65 via-black/20 to-transparent pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-white/40">
                <div className="size-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-[10px]">
                  P
                </div>
                <span className="text-xs font-extrabold text-slate-900 tracking-tight">Pixovo Reels</span>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                <a
                  href="https://www.google.com/search?q=Pixovo&stick=H4sIAAAAAAAA_-NgU1I1qLAwSElKSzJKTUs1MUszM7C0MqgwMjU3NjFKSTIySjI3skw1X8TKFpBZkV-WDwBRDVDCMgAAAA&hl=en&mat=CQk0NxzWu7hcElcBzAmVZgQcmLTQ9588wX0dgKmZtkzqmi7c250ZVxgyArbiP9uGuvyaK9I1c4VfLseEMozg3ssjRs4hYU41lpPiOmfZ4o1KzJsuvHT0hBVKEkxtnRk-Rsc&authuser=0&ved=1t:350944"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-md border border-white/40 text-[11px] font-bold text-amber-600 hover:scale-105 transition"
                  title="Official Google Reviews"
                >
                  <span>4.9 ★</span>
                </a>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="size-9 rounded-full bg-white/90 backdrop-blur-md border border-white/40 flex items-center justify-center text-slate-900 shadow-md hover:scale-105 active:scale-95 transition"
                  title="Toggle Sound"
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-emerald-600" />}
                </button>
              </div>
            </div>

            {/* Toast Banner */}
            {toastMessage && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl transition-all animate-bounce">
                {toastMessage}
              </div>
            )}

            {/* Vertical Video Feed Container */}
            <div
              ref={containerRef}
              className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative"
              style={{ scrollbarWidth: 'none' }}
            >
              {reelsData.map((reel) => (
                <ReelCardSingle
                  key={reel.id}
                  reel={reel}
                  isGlobalMuted={isMuted}
                  onOpenComments={() => setIsCommentsOpen(true)}
                  onOpenProduct={(p) => setSelectedProduct(p)}
                  onToast={showToast}
                />
              ))}
            </div>

            {/* Comments Sliding Drawer */}
            {isCommentsOpen && (
              <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col justify-end">
                <div className="w-full bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[70%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="w-10 h-1 bg-slate-300 dark:bg-neutral-700 rounded-full mx-auto my-3" />
                  <div className="px-5 pb-3 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Comments ({commentsList.length})
                    </span>
                    <button
                      onClick={() => setIsCommentsOpen(false)}
                      className="size-7 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-900"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    {commentsList.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="size-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.user.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{c.user}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{c.text}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{c.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-2 bg-white dark:bg-neutral-900">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-slate-100 dark:bg-neutral-800 rounded-full px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      onClick={handleAddComment}
                      className="size-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-center"
                    >
                      <Send className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Product Quick View Modal */}
            {selectedProduct && (
              <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col justify-end">
                <div className="w-full bg-white dark:bg-neutral-900 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Featured Product</span>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="size-7 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex gap-4 items-center">
                    <div className="size-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md">
                      📖
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedProduct.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedProduct.desc}</p>
                      <div className="text-base font-extrabold text-rose-500 mt-1">{selectedProduct.price}</div>
                    </div>
                  </div>
                  <button className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-lg hover:opacity-95 transition">
                    Customize Photobook Now
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  )
}

function ReelCardSingle({
  reel,
  isGlobalMuted,
  onOpenComments,
  onOpenProduct,
  onToast
}: {
  reel: ReelItem
  isGlobalMuted: boolean
  onOpenComments: () => void
  onOpenProduct: (p: ReelItem['product']) => void
  onToast: (msg: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showHeartRipple, setShowHeartRipple] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.muted = isGlobalMuted
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
          } else {
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: 0.75 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [isGlobalMuted])

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
    }
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleDoubleClick = () => {
    setIsLiked(true)
    setShowHeartRipple(true)
    setTimeout(() => setShowHeartRipple(false), 800)
  }

  return (
    <div
      className="relative w-full h-full snap-start snap-always bg-black flex items-center justify-center overflow-hidden"
      onDoubleClick={handleDoubleClick}
    >
      <video
        ref={videoRef}
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      >
        <source src={reel.videoSrc} type="video/mp4" />
        <source src={reel.fallbackSrc} type="video/mp4" />
      </video>

      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-10" />

      {/* Double Tap Floating Heart Animation */}
      {showHeartRipple && (
        <div className="absolute z-30 inset-0 flex items-center justify-center pointer-events-none animate-ping">
          <Heart className="size-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
        </div>
      )}

      {/* Play/Pause indicator center */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute z-20 size-16 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-900 cursor-pointer shadow-2xl transition hover:scale-110"
        >
          <Play className="size-8 fill-slate-900 ml-1" />
        </div>
      )}

      {/* Right Actions Bar */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-4">
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`size-11 rounded-full backdrop-blur-md border flex items-center justify-center transition hover:scale-110 shadow-lg ${
              isLiked ? 'bg-rose-100 text-rose-600 border-rose-300' : 'bg-white/90 text-slate-900 border-white/60'
            }`}
          >
            <Heart className={`size-5 ${isLiked ? 'fill-rose-600' : ''}`} />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">{isLiked ? 'Liked' : reel.likes}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onOpenComments}
            className="size-11 rounded-full bg-white/90 backdrop-blur-md border border-white/60 flex items-center justify-center text-slate-900 transition hover:scale-110 shadow-lg"
          >
            <MessageSquare className="size-5" />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">{reel.comments}</span>
        </div>

        {/* Bookmark */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => {
              setIsBookmarked(!isBookmarked)
              onToast(isBookmarked ? 'Removed from saved' : 'Saved to your collection!')
            }}
            className={`size-11 rounded-full backdrop-blur-md border flex items-center justify-center transition hover:scale-110 shadow-lg ${
              isBookmarked ? 'bg-amber-100 text-amber-600 border-amber-300' : 'bg-white/90 text-slate-900 border-white/60'
            }`}
          >
            <Bookmark className={`size-5 ${isBookmarked ? 'fill-amber-600' : ''}`} />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Save</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              onToast('Reel link copied!')
            }}
            className="size-11 rounded-full bg-white/90 backdrop-blur-md border border-white/60 flex items-center justify-center text-slate-900 transition hover:scale-110 shadow-lg"
          >
            <Share2 className="size-5" />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Share</span>
        </div>

        {/* Spinning Disc */}
        <div className="mt-2 size-10 rounded-full bg-white/80 p-0.5 shadow-md">
          <div className={`w-full h-full rounded-full bg-slate-900 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
            <div className="size-3 rounded-full bg-rose-500" />
          </div>
        </div>
      </div>

      {/* Bottom Info Area */}
      <div className="absolute left-4 right-16 bottom-8 z-30 flex flex-col gap-2.5 text-white">
        {/* Product Pill CTA */}
        <div
          onClick={() => onOpenProduct(reel.product)}
          className="self-start flex items-center gap-2.5 bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full border border-white/60 shadow-xl cursor-pointer hover:bg-white transition"
        >
          <div className="size-7 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            🛍️
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold leading-none">{reel.product.title}</span>
            <span className="text-[10px] font-bold text-rose-500">{reel.product.price}</span>
          </div>
          <span className="ml-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Shop
          </span>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center font-bold text-xs text-white shadow-md">
            P
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-white drop-shadow-md">{reel.handle}</span>
            {reel.verified && <CheckCircle2 className="size-3.5 text-sky-400 fill-sky-400 text-white" />}
          </div>
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition backdrop-blur-md border ${
              isFollowing
                ? 'bg-white/20 text-white border-white/40'
                : 'bg-white text-slate-900 border-white hover:bg-slate-100'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Caption */}
        <p className="text-xs text-white/90 drop-shadow-md line-clamp-2 leading-relaxed">
          {reel.caption}
        </p>

        {/* Music Tag */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium">
          <Music className="size-3" />
          <span>{reel.music}</span>
        </div>
      </div>

      {/* Bottom Timeline Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
