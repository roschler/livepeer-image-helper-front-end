"use client"

// import { redirect } from "next/navigation"
import ReaderViewport from "./viewport"
import {getDefaultAuthSession} from "@/app/static-auth/client-side-auth";

export default async function ReaderPage() {
	const session = getDefaultAuthSession();

	// window.location.href = "/reader"; // Redirect to the reader page

	// Removing session check for now.
	// if (!session) {
	// 	return redirect("/");
	// }

	return (
		<div>
			<ReaderViewport session={session} />
		</div>
	);
}

