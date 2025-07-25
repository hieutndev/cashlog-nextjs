import { Divider } from "@heroui/divider";
import React from "react";
import { Metadata } from "next";

import Container from "@/components/shared/container/container";
import ContentHeader, { BreadcrumbsType } from "@/components/shared/partials/content-header";

export const metadata: Metadata = {
	title: "Transactions",
};

export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
	const transationBreadcrumbs: BreadcrumbsType[] = [
		{
			label: ["Transactions"],
			key: "^/transactions",
		},
		{
			label: ["Transactions", "Import from Excel"],
			key: "^/transactions/import-transactions",
		},
	];

	return (
		<Container
			shadow
			className={"bg-white border border-gray-200 rounded-xl"}
			orientation={"vertical"}
		>
			<ContentHeader
				breadcrumbs={transationBreadcrumbs}
				title={"Transactions"}
			/>
			<Divider />
			{children}
		</Container>
	);
}
