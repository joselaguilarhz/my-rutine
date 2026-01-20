/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Atkinson', 'sans-serif'],
				display: ['"Space Grotesk"', 'Atkinson', 'sans-serif'],
			},
			boxShadow: {
				glow: '0 30px 70px rgba(5, 8, 15, 0.55)',
				card: '0 18px 40px rgba(6, 10, 18, 0.45)',
			},
		},
	},
	plugins: [],
};
