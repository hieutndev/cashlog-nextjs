/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
"use client";

import { useRef, useState, useEffect, type ReactNode, type MouseEvent, type TouchEvent } from "react";
import clsx from "clsx";

interface HorizontalScrollContainerProps {
	children: ReactNode;
	className?: string;
	showScrollbar?: boolean;
}

export default function HorizontalScrollContainer({
	children,
	className,
	showScrollbar = false,
}: HorizontalScrollContainerProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);
	const [showLeftShadow, setShowLeftShadow] = useState(false);
	const [showRightShadow, setShowRightShadow] = useState(false);
	const [hasMoved, setHasMoved] = useState(false);
	const dragStartTimeRef = useRef<number>(0);

	// Check if content is scrollable and update shadows
	const updateShadows = () => {
		const container = scrollContainerRef.current;

		if (!container) return;

		const { scrollLeft, scrollWidth, clientWidth } = container;
		const isScrollable = scrollWidth > clientWidth;

		setShowLeftShadow(isScrollable && scrollLeft > 0);
		setShowRightShadow(isScrollable && scrollLeft < scrollWidth - clientWidth - 1);
	};

	useEffect(() => {
		const container = scrollContainerRef.current;

		if (!container) return;

		// Initial shadow check
		updateShadows();

		// Update shadows on scroll
		const handleScroll = () => {
			updateShadows();
		};

		container.addEventListener("scroll", handleScroll);

		// Update shadows on window resize
		const handleResize = () => {
			updateShadows();
		};

		window.addEventListener("resize", handleResize);

		// Update shadows when children change
		const resizeObserver = new ResizeObserver(() => {
			updateShadows();
		});

		resizeObserver.observe(container);

		return () => {
			container.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleResize);
			resizeObserver.disconnect();
		};
	}, [children]);

	// Capture phase - intercepts before reaching radio buttons
	const handleMouseDownCapture = (e: MouseEvent<HTMLDivElement>) => {
		const container = scrollContainerRef.current;

		if (!container) return;

		// Store the start time and position
		dragStartTimeRef.current = Date.now();
		setIsDragging(true);
		setHasMoved(false);
		setStartX(e.pageX - container.offsetLeft);
		setScrollLeft(container.scrollLeft);
		container.style.cursor = "grabbing";
		container.style.userSelect = "none";
	};

	const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
		// Prevent default to stop text selection while dragging
		e.preventDefault();
	};

	const handleMouseLeave = () => {
		if (isDragging) {
			setIsDragging(false);
			setHasMoved(false);

			if (scrollContainerRef.current) {
				scrollContainerRef.current.style.cursor = "grab";
				scrollContainerRef.current.style.userSelect = "auto";
			}
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);

		// Reset hasMoved after a short delay to allow click events to check it
		setTimeout(() => {
			setHasMoved(false);
		}, 10);

		if (scrollContainerRef.current) {
			scrollContainerRef.current.style.cursor = "grab";
			scrollContainerRef.current.style.userSelect = "auto";
		}
	};

	const handleClick = (e: MouseEvent<HTMLDivElement>) => {
		// If we dragged, prevent the click from propagating to children
		if (hasMoved) {
			e.preventDefault();
			e.stopPropagation();
		}
	};

	// Capture phase handler to intercept clicks on radio buttons
	const handleClickCapture = (e: MouseEvent<HTMLDivElement>) => {
		// If we dragged, prevent the click from reaching children (like radio buttons)
		if (hasMoved) {
			e.preventDefault();
			e.stopPropagation();
		}
	};

	const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
		if (!isDragging) return;

		const container = scrollContainerRef.current;

		if (!container) return;

		const x = e.pageX - container.offsetLeft;
		const walk = (x - startX) * 2; // Scroll speed multiplier

		// Only set hasMoved if we've actually moved more than a few pixels
		if (Math.abs(walk) > 5) {
			setHasMoved(true);
			e.preventDefault();
		}

		container.scrollLeft = scrollLeft - walk;
	};

	// Touch events for mobile
	const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
		const container = scrollContainerRef.current;

		if (!container) return;

		setIsDragging(true);
		setStartX(e.touches[0].pageX - container.offsetLeft);
		setScrollLeft(container.scrollLeft);
	};

	const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
		if (!isDragging) return;

		const container = scrollContainerRef.current;

		if (!container) return;

		const x = e.touches[0].pageX - container.offsetLeft;
		const walk = (x - startX) * 2;

		container.scrollLeft = scrollLeft - walk;
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
	};

	// Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const container = scrollContainerRef.current;

		if (!container) return;

		switch (e.key) {
			case "ArrowLeft":
				e.preventDefault();
				container.scrollBy({ left: -200, behavior: "smooth" });
				break;
			case "ArrowRight":
				e.preventDefault();
				container.scrollBy({ left: 200, behavior: "smooth" });
				break;
			case "Home":
				e.preventDefault();
				container.scrollTo({ left: 0, behavior: "smooth" });
				break;
			case "End":
				e.preventDefault();
				container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
				break;
		}
	};

	return (
		<div className="relative w-full">
			{/* Left Shadow */}
			{showLeftShadow && (
				<div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
			)}

			{/* Scrollable Container */}
			<div ref={scrollContainerRef}
				aria-label="Scrollable card container"
				className={clsx(
					"overflow-x-auto",
					"cursor-grab active:cursor-grabbing",
					"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg",
					{
						"scrollbar-hide": !showScrollbar,
					},
					className
				)}
				style={{
					userSelect: isDragging ? "none" : "auto",
				}}
				tabIndex={0}
				onClick={handleClick}
				onClickCapture={handleClickCapture}
				onKeyDown={handleKeyDown}
				onMouseDown={handleMouseDown}
				onMouseDownCapture={handleMouseDownCapture}
				onMouseLeave={handleMouseLeave}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onTouchEnd={handleTouchEnd}
				onTouchMove={handleTouchMove}
				onTouchStart={handleTouchStart}
			>
				<div
					className={clsx(
						"flex flex-row gap-4 flex-nowrap",
						{
							"pointer-events-none": isDragging && hasMoved,
						}
					)}
				>
					{children}
				</div>
			</div>

			{/* Right Shadow */}
			{showRightShadow && (
				<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
			)}
		</div>
	);
}

