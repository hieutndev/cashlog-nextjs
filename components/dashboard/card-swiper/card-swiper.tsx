"use client"

import type React from "react"

import { useState, useRef } from "react"

import BankCard from "@/components/shared/bank-card/bank-card"
import { TCard } from "@/types/card"

interface CardSwiperProps {
	cards: TCard[];
	loading?: boolean;
	showIndicators?: boolean;
}

export function CardSwiper({ cards, showIndicators = false, loading = false }: CardSwiperProps) {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState(0)
	const [dragOffset, setDragOffset] = useState(0)
	const containerRef = useRef<HTMLButtonElement>(null)

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true)
		setDragStart(e.clientX)
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return
		const offset = e.clientX - dragStart

		setDragOffset(offset)
	}

	const handleMouseUp = () => {
		setIsDragging(false)

		if (Math.abs(dragOffset) > 50) {
			if (dragOffset > 0) {
				// Swipe right - go to previous card (with infinite loop)
				setCurrentIndex((currentIndex - 1 + cards.length) % cards.length)
			} else if (dragOffset < 0) {
				// Swipe left - go to next card (with infinite loop)
				setCurrentIndex((currentIndex + 1) % cards.length)
			}
		}

		setDragOffset(0)
	}

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true)
		setDragStart(e.touches[0].clientX)
		// Prevent default touch behavior to avoid page scroll
		e.preventDefault()
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging) return
		const offset = e.touches[0].clientX - dragStart

		setDragOffset(offset)
		// Prevent default touch behavior to avoid page scroll
		e.preventDefault()
	}

	const handleTouchEnd = (e: React.TouchEvent) => {
		setIsDragging(false)

		if (Math.abs(dragOffset) > 50) {
			if (dragOffset > 0) {
				// Swipe right - go to previous card (with infinite loop)
				setCurrentIndex((currentIndex - 1 + cards.length) % cards.length)
			} else if (dragOffset < 0) {
				// Swipe left - go to next card (with infinite loop)
				setCurrentIndex((currentIndex + 1) % cards.length)
			}
		}

		setDragOffset(0)
		// Prevent default touch behavior to avoid page scroll
		e.preventDefault()
	}

	if (loading || !cards || cards.length === 0) {
		return (
			<div className="w-full h-72 flex items-center justify-center text-gray-500">
				<p>{loading ? "Loading cards..." : "No cards available"}</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Card Display - Stacked Effect */}
			<button
				ref={containerRef}
				className="w-full block relative h-72 cursor-grab active:cursor-grabbing overflow-visible"
				style={{ touchAction: "none", perspective: "1000px" }}
				onMouseDown={handleMouseDown}
				onMouseLeave={handleMouseUp}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onTouchEnd={handleTouchEnd}
				onTouchMove={handleTouchMove}
				onTouchStart={handleTouchStart}
			>
				<div className="relative w-full h-full">
					{cards.map((card, index) => {
						// Calculate offset with infinite loop
						let offset = index - currentIndex

						if (offset < -1) offset += cards.length
						if (offset > 2) offset -= cards.length

						// Show current card, 2 cards behind, and 1 card being swiped away
						if (offset < -1 || offset > 2) return null

						let transform = "translateY(0px) scale(1) rotateX(0deg)"
						let opacity = 1
						let zIndex = 30 - offset * 5

						if (offset === -1) {
							// Card being swiped away - animate to back of stack
							transform = "translateY(-24px) scale(0.95) rotateX(0deg)"
							opacity = 1
							zIndex = 15
						} else if (offset === 0) {
							// Active card - responds to drag
							transform = `translateY(${dragOffset * 0.1}px) scale(1) rotateX(0deg)`
							opacity = 1
							zIndex = 30
						} else if (offset === 1) {
							// First card behind - positioned above, fully opaque
							transform = "translateY(-16px) scale(0.95) rotateX(0deg)"
							opacity = 1
							zIndex = 25
						} else if (offset === 2) {
							// Second card behind - positioned above, fully opaque
							transform = "translateY(-24px) scale(0.95) rotateX(0deg)"
							opacity = 1
							zIndex = 20
						}

						return (
							<div
								key={card.card_id}
								className="absolute inset-0 transition-all duration-500 ease-out bg-white rounded-2xl"
								style={{
									transform,
									opacity,
									zIndex,
									transformStyle: "preserve-3d",
								}}
							>
								<BankCard
									bankCode={card.bank_code}
									cardBalance={card.card_balance}
									cardName={card.card_name}
									className="h-full"
									color={card.card_color}
								/>
							</div>
						)
					})}
				</div>
			</button>

			{/* Indicators */}
			{showIndicators && (<div className="flex justify-center gap-2">
				{cards.map((_, index) => (
					<button
						key={index}
						aria-label={`Go to card ${index + 1}`}
						className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? "w-8 bg-blue-500" : "w-2 bg-slate-600 hover:bg-slate-500"
							}`}
						onClick={() => setCurrentIndex(index)}
					/>
				))}
			</div>)}
		</div>
	)
}

