import { Metadata } from "next";
import { Divider } from "@heroui/divider";

import Container from "@/components/shared/container/container";
import ContentHeader, { BreadcrumbsType } from "@/components/shared/partials/content-header";
import ICONS from "@/configs/icons";

export const metadata: Metadata = {
	title: "Forecasts",
};

export default function ForecastsLayout({ children }: { children: React.ReactNode }) {
	const forecastBreadcrumbs: BreadcrumbsType[] = [
		{
			label: ["Forecasts"],
			key: "^/forecasts",
			customButton: [
				{
					children: "New Forecast",
					color: "primary",
					variant: "solid",
					size: "lg",
					startContent: ICONS.NEW.LG,
					href: "settings/forecasts/new",
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
				breadcrumbs={forecastBreadcrumbs}
				title={"Forecasts"}
			/>
			<Divider />
			{children}
		</Container>
	);
}
