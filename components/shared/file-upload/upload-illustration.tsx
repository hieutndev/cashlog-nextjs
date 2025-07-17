export const UploadIllustration = () => (
	<div className="relative w-24 h-24">
		<svg
			aria-label="Upload illustration"
			className="w-full h-full"
			fill="none"
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Upload File Illustration</title>
			<circle
				className="stroke-gray-200 dark:stroke-gray-700"
				cx="50"
				cy="50"
				r="45"
				strokeDasharray="4 4"
				strokeWidth="2"
			>
				<animateTransform
					attributeName="transform"
					dur="60s"
					from="0 50 50"
					repeatCount="indefinite"
					to="360 50 50"
					type="rotate"
				/>
			</circle>

			<path
				className="fill-blue-100 dark:fill-blue-900/30 stroke-blue-500 dark:stroke-blue-400"
				d="M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
				strokeWidth="2"
			>
				<animate
					attributeName="d"
					dur="2s"
					repeatCount="indefinite"
					values="
                        M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z;
                        M30 38H70C75 38 75 43 75 43V68C75 73 70 73 70 73H30C25 73 25 68 25 68V43C25 38 30 38 30 38Z;
                        M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
				/>
			</path>

			<path
				className="stroke-blue-500 dark:stroke-blue-400"
				d="M30 35C30 35 35 35 40 35C45 35 45 30 50 30C55 30 55 35 60 35C65 35 70 35 70 35"
				fill="none"
				strokeWidth="2"
			/>

			<g className="transform translate-y-2">
				<line
					className="stroke-blue-500 dark:stroke-blue-400"
					strokeLinecap="round"
					strokeWidth="2"
					x1="50"
					x2="50"
					y1="45"
					y2="60"
				>
					<animate
						attributeName="y2"
						dur="2s"
						repeatCount="indefinite"
						values="60;55;60"
					/>
				</line>
				<polyline
					className="stroke-blue-500 dark:stroke-blue-400"
					fill="none"
					points="42,52 50,45 58,52"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
				>
					<animate
						attributeName="points"
						dur="2s"
						repeatCount="indefinite"
						values="42,52 50,45 58,52;42,47 50,40 58,47;42,52 50,45 58,52"
					/>
				</polyline>
			</g>
		</svg>
	</div>
);
