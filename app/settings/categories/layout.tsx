import React from "react";
import { Metadata } from "next";

interface CategoriesLayoutProps {
	children: React.ReactNode;
}

export const metadata: Metadata = {
	title: "Setting - Categories",
};

export default function CategoriesLayout({ children }: CategoriesLayoutProps) {
	return <>{children}</>;
}
