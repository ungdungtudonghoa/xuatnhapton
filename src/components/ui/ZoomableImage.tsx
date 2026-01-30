'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, X, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ZoomableImageProps {
    src: string
    alt: string
    onClose: () => void
}

export function ZoomableImage({ src, alt, onClose }: ZoomableImageProps) {
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    const containerRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5))
    const handleReset = () => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
    }

    const onWheel = (e: React.WheelEvent) => {
        if (e.deltaY < 0) handleZoomIn()
        else handleZoomOut()
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale <= 1) return
        setIsDragging(true)
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        })
    }

    const handleMouseUp = () => setIsDragging(false)

    // Prevent scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300"
            onWheel={onWheel}
        >
            {/* Toolbar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10" onClick={handleZoomOut}>
                    <ZoomOut className="h-5 w-5" />
                </Button>
                <div className="w-12 text-center text-white text-sm font-bold">
                    {Math.round(scale * 100)}%
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10" onClick={handleZoomIn}>
                    <ZoomIn className="h-5 w-5" />
                </Button>
                <div className="w-[1px] h-6 bg-white/20 mx-1" />
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10" onClick={handleReset}>
                    <RotateCcw className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/80 rounded-full h-10 w-10 ml-2" onClick={onClose}>
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Instruction */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] text-white/50 text-xs flex items-center gap-2 pointer-events-none">
                <Move className="h-3 w-3" />
                {scale > 1 ? 'Kéo để di chuyển • Cuộn chuột để phóng to/thu nhỏ' : 'Cuộn chuột để phóng to'}
            </div>

            {/* Image Container */}
            <div
                ref={containerRef}
                className={`relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                    className="relative max-w-[90%] max-h-[90%] select-none shrink-0"
                >
                    <img
                        ref={imageRef}
                        src={src}
                        alt={alt}
                        className="w-full h-full object-contain pointer-events-none shadow-2xl"
                    />
                </div>
            </div>
        </div>
    )
}
