import { Divider } from "@heroui/divider";
import React from "react";
import { Metadata } from "next";

import ContentHeader, { BreadcrumbsType } from "@/components/shared/partials/content-header";
import Container from "@/components/shared/container/container";
import SettingMenu from "@/components/settings/setting-menu";
import SYS_ICONS from "@/config/icons";

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
			customButton: [
				{
					children: "New Card",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: SYS_ICONS.NEW.LG,
					href: "/settings/cards/new",
				},
			],
		},
		{
			label: ["Settings", "Cards", "New"],
			key: "^/settings/cards/new",
			customButton: [
				{
					children: "Back",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: SYS_ICONS.BACK.LG,
					href: "/settings/cards",
				},
			],
		},
		{
			label: ["Settings", "Cards", "Card Details"],
			key: "^/settings/cards/[^/]+",
			customButton: [
				{
					children: "Back",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: SYS_ICONS.BACK.LG,
					href: "/settings/cards",
				},
			],
		},
		{
			label: ["Settings", "Categories"],
			key: "^/settings/categories",
		},
		{
			label: ["Settings", "Forecasts"],
			key: "^/settings/forecasts",
			customButton: [
				{
					children: "New Forecast",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: SYS_ICONS.NEW.LG,
					href: "/settings/forecasts/new",
				},
			],
		},
		{
			label: ["Settings", "Forecasts", "New Forecast"],
			key: "^/settings/forecasts/new",
			customButton: [
				{
					children: "Back",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: SYS_ICONS.BACK.LG,
					href: "/settings/forecasts",
				},
			],
		},
		{
			label: ["Settings", "Forecasts", "Forecast Details"],
			key: "^/settings/forecasts/[^[/]+",
			customButton: [
				{
					children: "Back",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: SYS_ICONS.BACK.LG,
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
