import { ReactNode } from "react";
import { Metadata } from "next";

interface ImportTransactionsLayoutProps {
	children: ReactNode[];
}

export const metadata: Metadata = {
	title: "Import Transactions",
};

export default function ImportTransactionsLayout({ children }: ImportTransactionsLayoutProps) {
	return children;
}
