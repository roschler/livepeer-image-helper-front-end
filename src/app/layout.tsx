import "@/styles/globals.css"
import "@radix-ui/themes/styles.css"
import { Theme } from "@radix-ui/themes"
import { Exo } from "next/font/google"

const exo = Exo({
	subsets: ["latin"],
	variable: "--font-sans",
})

// Remember, the asset URL must be prefixed with the
//  basePath specified in next.config.js
export const metadata = {
	title: "Livepeer Image Helper, v. 1.7",
	description: "Stable diffusion, without confusion!",
	icons: [
		{ rel: "apple-touch-icon", sizes: "180x180", url: "/nft-supreme/apple-touch-icon.png" },
		{ rel: "icon", type: "image/png", sizes: "32x32", url: "/nft-supreme/favicon-32x32.png" },
		{ rel: "icon", type: "image/png", sizes: "16x16", url: "/nft-supreme/favicon-16x16.png" },
	],
	manifest: "/nft-supreme/site.webmanifest",
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body className={`font-sans ${exo.variable}`}>
				<Theme
					accentColor="lime"
					grayColor="olive"
					scaling="110%"
					appearance="dark"
				>
					<main
						className="flex-container flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-500 to-orange-800 text-white">
						{children}
					</main>
				</Theme>
			</body>
		</html>
	)
}

