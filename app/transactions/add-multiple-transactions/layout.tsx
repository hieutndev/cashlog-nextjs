import { ReactNode } from "react";
import { Metadata } from "next";

interface AddMultipleTransactionsLayoutProps {
    children: ReactNode[];
}

export const metadata: Metadata = {
    title: "Add Multiple Transactions",
};

export default function AddMultipleTransactionsLayout({ children }: AddMultipleTransactionsLayoutProps) {
    return children;
}
