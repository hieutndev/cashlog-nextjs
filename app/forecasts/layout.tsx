import { Metadata } from "next";
import { Divider } from "@heroui/divider";

import Container from "@/components/shared/container/container";
import ContentHeader, { BreadcrumbsType } from "@/components/shared/partials/content-header";

export const metadata: Metadata = {
	title: "Forecasts",
};

export default function ForecastsLayout({ children }: { children: React.ReactNode }) {
	const forecastBreadcrumbs: BreadcrumbsType[] = [
		{
			label: ["Forecasts"],
			key: "^/forecasts",
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
