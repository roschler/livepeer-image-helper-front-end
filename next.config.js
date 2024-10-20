/** @type {import("next").NextConfig} */
const config = {
	output: 'export',
	distDir: 'static-site-content', // Specify custom output directory
	basePath: '/nft-supreme', // Add the /public base path
	assetPrefix: '/nft-supreme',
	// Rename this to "images" if you want React/Next
	//  image optimization but remember, you can't do
	//  that with a purely static, client side only
	//  front end!
	/*
	images_optimization_disabled: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.livepeer.cloud",
				port: "",
				pathname: "/stream/**",
			},
			{
				protocol: "https",
				hostname: "obj-store.livepeer.cloud",
				port: "",
				pathname: "/livepeer-cloud-ai-images/**",
			},
		],
	},
	 */
}

export default config;
