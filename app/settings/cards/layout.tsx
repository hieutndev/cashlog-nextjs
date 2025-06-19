import React from "react";
import { Metadata } from "next";

interface SettingCardLayoutProps {
	children: React.ReactNode;
}

export const metadata: Metadata = {
	title: "Setting - Cards",
};

export default function SettingCardLayout({ children }: SettingCardLayoutProps) {
	return <>{children}</>;
}
