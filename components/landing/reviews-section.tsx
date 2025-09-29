"use client";

import { Image } from "@heroui/image";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';

// @ts-ignore - side-effect CSS import
import 'swiper/css';
// @ts-ignore - side-effect CSS import
import 'swiper/css/free-mode';
import LandingSectionHeader from "./landing-section-header";

interface Review {
	id: number;
	name: string;
	role: string;
	content: string;
	rating: number;
	avatar: string;
}

const reviews: Review[] = [
	{ id: 1, name: "Jessica Chani", role: "Teacher", content: "Automatic categorization saved me hours — now I actually understand where my money goes.", rating: 5, avatar: "/cashlog_icon.png" },
	{ id: 2, name: "Charles Leclerc", role: "Businessman", content: "Forecasts stopped surprises. I can plan payroll and savings with confidence.", rating: 5, avatar: "/cashlog_icon.png" },
	{ id: 3, name: "Agnes Florence", role: "Doctor", content: "The reports are clear and useful — I manage my practice finances much easier now.", rating: 5, avatar: "/cashlog_icon.png" },
	{ id: 4, name: "Daniel Sigma", role: "Architect", content: "An intuitive dashboard that brings cards, accounts and budgets together.", rating: 5, avatar: "/cashlog_icon.png" },
	{ id: 5, name: "Maria Santos", role: "Marketing Manager", content: "Budget tools keep me on track and help me hit my goals every month.", rating: 5, avatar: "/cashlog_icon.png" },
	{ id: 6, name: "Robert Kim", role: "Entrepreneur", content: "Streamlined tracking and fast reconciliation — huge time saver for my business.", rating: 5, avatar: "/cashlog_icon.png" }
];

export default function ReviewsSection() {




	return (
		<section className="py-20 bg-white">
			<div className="w-full flex flex-col gap-4">
				<LandingSectionHeader
					description={"Financy gets good reviews from many users for its convenient and useful features."}
					preTitle={"What they say about us"}
					title={"Good Reviews from our Users!"}

				/>
				<div className="w-full h-full py-4 overflow-hidden">
					<Swiper
						autoplay={{
							delay: 0,
							disableOnInteraction: false,
							pauseOnMouseEnter: false,
							reverseDirection: false
						}}
						className="py-8 px-4 sm:px-6 lg:px-8"
						freeMode={true}
						loop={true}
						modules={[Autoplay, FreeMode]}
						slidesPerView={'auto'}
						spaceBetween={20}
						speed={3000}
						style={{ width: '100%' }}
					>
						{reviews.map((r) => (
							<SwiperSlide key={r.id} className="max-w-96 py-4">
								<Card className="h-full">
									<CardHeader className="flex items-center gap-4 p-4">
										<div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
											<Image alt={r.name} className="object-cover w-full h-full" height={48} src={r.avatar} width={48} />
										</div>
										<div>
											<div className="text-sm font-semibold text-gray-900">{r.name}</div>
											<div className="text-xs text-gray-500">{r.role}</div>
										</div>
									</CardHeader>
									<CardBody className="p-4 pt-0">
										<p className="text-sm text-gray-700">{r.content}</p>
										<div className="mt-4 text-sm text-yellow-500">{Array.from({ length: r.rating }).map((_, i) => (
											<span key={i}>★</span>
										))}</div>
									</CardBody>
								</Card>
							</SwiperSlide>
						))}
					</Swiper>
				</div>
			</div>
		</section>
	);
}