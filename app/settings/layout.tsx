import { Divider } from "@heroui/divider";
import React from "react";
import { Metadata } from "next";

import ContentHeader, { BreadcrumbsType } from "@/components/shared/partials/content-header";
import Container from "@/components/shared/container/container";
import SettingMenu from "@/components/settings/setting-menu";
import ICONS from "@/configs/icons";

export const metadata: Metadata = {
	title: "Settings",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	const settingBreadcrumbs: BreadcrumbsType[] = [
		{
			label: ["Settings", "General"],
			key: "^/settings",
		},
		{
			label: ["Settings", "Cards"],
			key: "^/settings/cards",
		},
		{
			label: ["Settings", "Cards", "New"],
			key: "^/settings/cards/new",
		},
		{
			label: ["Settings", "Cards", "Card Details"],
			key: "^/settings/cards/[^/]+",
		},
		{
			label: ["Settings", "Categories"],
			key: "^/settings/categories",
		},
		{
			label: ["Settings", "Recurring"],
			key: "^/settings/forecasts",
		},
		{
			label: ["Settings", "Recurring", "New Recurring"],
			key: "^/settings/forecasts/new",
			customButton: [
				{
					children: "Back",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: ICONS.BACK.LG,
					href: "/settings/forecasts",
				},
			],
		},
		{
			label: ["Settings", "Recurring", "Recurring Details"],
			key: "^/settings/forecasts/[^[/]+",
			customButton: [
				{
					children: "Back",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: ICONS.BACK.LG,
					href: "/settings/forecasts",
				},
			],
		},
	];

	return (
		<Container
			shadow
			className={"bg-white border border-gray-200 rounded-xl"}
			orientation={"vertical"}
		>
			<ContentHeader
				breadcrumbs={settingBreadcrumbs}
				title={"Settings"}
			/>
			<Divider />
			<div className={"grid grid-cols-12 gap-4"}>
				<SettingMenu />
				{children}
			</div>
		</Container>
	);
}
