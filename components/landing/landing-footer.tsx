"use client";

import Link from "next/link";
import { Divider } from "@heroui/divider";

import packageJson from "../../package.json";

export default function LandingFooter() {
	return (
		<footer className="bg-white p-2 border-t border-gray-200">
			<div className="max-w-xl mx-auto py-6 text-center flex flex-col gap-2">
				<p className="mt-3 text-xs text-gray-600 italic">Hosted by <Link className={"text-primary"} href="#">@hieutndev</Link> / v{packageJson.version}</p>
				<Divider />
				<div className="text-xs text-gray-500 space-x-4">
					<Link className={"text-gray-500"} href="#">Terms</Link>
					<Link className={"text-gray-500"} href="#">Privacy</Link>
					<Link className={"text-gray-500"} href="#">Help Center</Link>
				</div>
			</div>
		</footer>
	);
}