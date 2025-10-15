"use client";

import { Button } from "@heroui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useAuth } from "../providers/auth-provider";

import ICONS from "@/configs/icons";

export default function CTASection() {

	const router = useRouter();

	const { isLoggedIn } = useAuth();

	return (
		<section className="relative py-20 bg-gradient-to-br from-primary/90 to-primary overflow-hidden">
			<div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-6">
				{/* Left column: existing content */}
				<div className="flex flex-col gap-8">
					<h2 className="text-5xl font-semibold text-white leading-normal">
						Ready to take control of your finances?
					</h2>
					<p className="text-xl text-white/90 mb-8 max-w-2xl">
						Start tracking, forecasting, and planning in minutes. Join thousands who manage their money with clarity and confidence.
					</p>
					<div className="flex items-start md:items-center">
						<Button
							className="px-9 py-4 bg-primary shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white text-white hover:bg-white hover:text-primary"
							endContent={ICONS.NEXT.LG}
							size="lg"
							onPress={() => isLoggedIn ? router.push('/overview') : router.push('/sign-up')}
						>
							{isLoggedIn ? "Start Tracking" : "Create your free account"}
						</Button>
					</div>
				</div>

				{/* Right column: larger image with a smaller overlay at bottom-left */}
				<div className="hidden lg:flex justify-center">
					<div className="relative w-full max-w-full h-full">
						{/* Large below image */}
						<div className="absolute left-12 -top-48 bg-white/5 rounded-3xl p-2 shadow-xl backdrop-blur-sm overflow-hidden">
							<Image alt="Dashboard preview large" className="w-full h-auto rounded-xl" height={1200} src="/cta-placeholder.svg" width={1200} />
						</div>

						{/* Small overlay image positioned at bottom-left of the large image */}
						<div className="absolute left-0 -bottom-28 w-40 md:w-56 transform translate-y-6 md:translate-y-8">
							<div className="bg-white rounded-2xl p-3 shadow-2xl">
								<Image alt="Dashboard preview small" className="w-full h-auto rounded-lg" height={180} src="/cta-placeholder.svg" width={260} />
							</div>
						</div>
					</div>
				</div>
			</div>


			{/* Decorative bubbles (kept absolute so they overlap both columns) */}
			<div className="absolute inset-0 pointer-events-none">
				{/* soft white glows */}
				<div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-sm" />
				<div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full blur-sm" />
				<div className="absolute bottom-20 left-32 w-24 h-24 bg-white/10 rounded-full blur-sm" />
				<div className="absolute bottom-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-sm" />
				<div className="absolute bottom-10 right-96 w-20 h-20 bg-white/10 rounded-full blur-sm" />
				<div className="absolute bottom-10 right-1/2 w-20 h-20 bg-white/10 rounded-full blur-sm" />
				<div className="absolute top-10 left-1/2 w-20 h-20 bg-white/10 rounded-full blur-sm" />

			</div>
		</section>
	);
}