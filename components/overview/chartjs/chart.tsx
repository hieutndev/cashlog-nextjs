"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartProps {
	columnLabels: string[];
	dataSets: {
		label: string;
		data: number[];
		backgroundColor: string | string[];
		borderColor: string | string[];
		borderWidth: number;
	}[];
}

export default function Chart({ columnLabels: labels, dataSets }: ChartProps) {
	const options = {
		responsive: true,
		scales: {
			x: {
				// stacked: true,
			},
		},
	};

	const data = {
		labels: labels,
		datasets: dataSets.map((dataSet) => ({
			...dataSet,
			barThickness: 20,
			borderWidth: 0.1,
		})),
	};

	return (
		<Bar
			className={"max-h-96 w-full"}
			data={data}
			options={options}
		/>
	);
}
