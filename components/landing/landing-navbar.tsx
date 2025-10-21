"use client";

import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { useRouter } from "next/navigation";

import { useAuth } from "../providers/auth-provider";

import { SITE_CONFIG } from "@/configs/site-config";
import ICONS from "@/configs/icons";


export default function LandingNavbar() {

	const router = useRouter();

	const { isLoggedIn } = useAuth();

	return (
		<nav className="w-full bg-white border-b border-gray-100">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-4">
					{/* Company Logo */}
					<Image
						alt={"CashLog"}
						className={"w-auto max-h-8"}
						height={1200}
						src={SITE_CONFIG.LOGO.HORIZONTAL}
						width={1200}
					/>
					{/* Login & Register Buttons */}
					<div className={"flex items-center gap-4"}>
						{isLoggedIn
							? <Button color={"primary"}
								endContent={ICONS.NEXT.MD}
								variant={"light"}
								onPress={() => router.push('/dashboard')}
							>
								Dashboard
							</Button> : (
								<>
									<Button
										className={"hidden md:block"}
										color={"primary"}
										variant={"light"}
										onPress={() => router.push('/sign-in')}
									>
										Login
									</Button>
									<Button
										color={"primary"}
										variant={"solid"}
										onPress={() => router.push('/sign-up')}
									>
										Get Started
									</Button>
								</>)}
					</div>
				</div>
			</div>
		</nav>
	);
}