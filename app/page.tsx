"use client";

import CTASection from "@/components/landing/cta-section";
import LandingFooter from "@/components/landing/landing-footer";
import HeroSection from "@/components/landing/hero-section";
import LandingNavbar from "@/components/landing/landing-navbar";
import ReviewsSection from "@/components/landing/reviews-section";
import StatisticsSection from "@/components/landing/statistics-section";
import WhyChooseSection from "@/components/landing/why-choose-section";

export default function AppIndexPage() {
	return (
		<div className="min-h-screen bg-white">
			<LandingNavbar />
			<HeroSection />
			<StatisticsSection />
			<WhyChooseSection />
			<ReviewsSection />
			<CTASection />
			<LandingFooter />
		</div>
	);
}
