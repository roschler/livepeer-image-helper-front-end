"use client"

import "@radix-ui/themes/styles.css"

import { Callout } from "@radix-ui/themes"
import { CircleX } from "lucide-react"

import { useState } from "react";
import ReaderViewport from "./reader/viewport";
import {getDefaultAuthSession} from "@/app/static-auth/client-side-auth";

export default function HomePage() {
	const [showReader, setShowReader] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const defaultAuthSession = getDefaultAuthSession();

	const enterStorytime = () => {
		// if (someConditionForError) {
		if (false) {
			setErrorMessage("An error occurred while trying to enter storytime.");
		} else {
			setShowReader(true);
		}
	};

	return (
		<div className="flex-container container flex flex-col items-center justify-center gap-1 px-4 text-center">
			<h1 className="text-3xl font-bold tracking-wide text-white sm:text-4xl">
				Livepeer Image Helper
			</h1>
			<h3 className="text-xl font-semibold tracking-wide text-white sm:text-2xl italic">
				Stable diffusion, without the confusion!
			</h3>

			{!showReader && (
				<>
					<button className="button text-sky-200 hover:text-sky-100" onClick={enterStorytime}>
						Enter Livepeer Image Helper
					</button>

					{/* Conditionally display the error message */}
					{errorMessage && (
						<div className="h-[300px] w-screen">
						<div className="grid justify-center gap-2">
								<div className="container min-w-[390px]">
									<div className="flex justify-center">
										<Callout.Root
											size="1"
											color="amber"
											className="flex w-max text-center"
										>
											<Callout.Icon>
												<CircleX/>
											</Callout.Icon>
											<Callout.Text>{errorMessage}</Callout.Text>
										</Callout.Root>
									</div>
								</div>
							</div>
						</div>
					)}
				</>
			)}

			{showReader && <ReaderViewport session={defaultAuthSession}/>}
		</div>
	);
}
