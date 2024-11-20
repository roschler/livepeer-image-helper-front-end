"use client";

import {forwardRef, type PropsWithChildren, useImperativeHandle, useState} from "react";
import { Root, ToggleGroup, Separator, Link } from "@radix-ui/react-toolbar";
import { Button } from "@radix-ui/themes";

import {EnumImageProcessingModes} from "@/app/reader/types";

type ReaderToolbarProps = {
	disabled?: boolean;
	onGenreSelect: (genre: string) => void;
	onGenreChange: (genre: string) => void;
	onProcessImage: (imageProcessingMode: EnumImageProcessingModes) => void; // Updated to accept the refining state
	doShareImageOnTwitter: () => void;
	doMintTokenOnStoryProtocol: () => void;
} & PropsWithChildren;

export type ReaderToolbarHandle = {
	setTwitterButtonEnabled: (enabled: boolean) => void;
};

const ReaderToolbar = forwardRef<ReaderToolbarHandle, ReaderToolbarProps>((props, ref) => {
	const [genre, setGenre] = useState("magic");
	const [isTwitterButtonEnabled, setIsTwitterButtonEnabled] = useState(true); // Control the Twitter button state
	const [bIsRefining, setBIsRefining] = useState(false); // New state variable for refining

	const changeHandler = (e: React.MouseEvent) => {
		setGenre(e.currentTarget.id);
		props.onGenreChange(e.currentTarget.id);
	};

	const selectHandler = () => {
		props.onGenreSelect(genre);
	};

	const newImageImageHandler = () => {
		props.onProcessImage(EnumImageProcessingModes.NEW);
	};

	const refineImageHandler = () => {
		props.onProcessImage(EnumImageProcessingModes.REFINE);
	};

	const enhanceImageHandler = () => {
		props.onProcessImage(EnumImageProcessingModes.ENHANCE);
	};

	/**
	 * Handler for when the user clicks on the Twitter share
	 *  button
	 */
	const handleTwitterShare = () => {
		try {
			// Tell the viewport the user clicked the share image on Twitter button.
			props.doShareImageOnTwitter();
		} catch (error) {
			if (error instanceof Error) {
				console.error(error.message);
			} else {
				console.error("An unknown error occurred.");
			}
		}
	};

	/**
	 * Handler for when the user clicks on the mint token
	 *  to Story Protocol button
	 */
	const handleStoryProtocolClick = () => {
		try {
			// Tell the viewport the user clicked Story Protocol button.
			props.doMintTokenOnStoryProtocol();
		} catch (error) {
			if (error instanceof Error) {
				console.error(error.message);
			} else {
				console.error("An unknown error occurred.");
			}
		}
	};

	// Expose setTwitterButtonEnabled to the parent component via the ref
	useImperativeHandle(ref, () => ({
		setTwitterButtonEnabled(enabled: boolean) {
			setIsTwitterButtonEnabled(enabled);
		},
	}));

	return (
		<Root
			className="mt-4 flex min-w-max rounded-md bg-white p-[10px] shadow-[0_2px_10px] shadow-blackA4"
			aria-label="Formatting options width=500px flex-wrap=nowrap"
		>
			{/*
			<ToggleGroup
				type="single"
				defaultValue="magic"
				aria-label="Story Genre Selector"
				className="flex gap-0 sm:gap-2 lg:gap-3"
			>
				{Object.keys(storyGenres).map((genre) => (
					<StoryGenreButton
						disabled={props.disabled}
						onClick={changeHandler}
						id={genre}
						key={genre}
					/>
				))}
			</ToggleGroup>
			*/}
			<Separator className="mx-[10px] w-[1px] bg-mauve6"/>
			{/*
			<Link
				className="ml-0.5 mr-3 mt-0.5 hidden h-[32px] w-[120px] flex-shrink-0 flex-grow-0 basis-auto items-center justify-center rounded bg-transparent bg-white px-[5px] text-[13px] leading-none text-mauve11 outline-none first:ml-0 hover:cursor-pointer hover:bg-transparent hover:text-violet11 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7 data-[state=on]:bg-violet5 data-[state=on]:text-violet11 sm:inline-flex"
				href="#"
			>
				{storyGenres[genre as keyof typeof storyGenres]}
			</Link>
			*/}
			<Separator className="mx-[10px] hidden w-[1px] bg-mauve6 sm:inline-flex"/>

			{/* New Twitter share button with enabled/disabled state */}
			<Button
				style={{marginRight: "3px"}}
				onClick={handleTwitterShare}
				disabled={!isTwitterButtonEnabled} // Control Twitter button enabled state
			>
				<img src="/nft-supreme/twitter-button-1.jpg" alt="Share on Twitter"/>
			</Button>

			{/* New Story Protocol mint NFT button with enabled/disabled state */}
			<Button
				style={{marginRight: "3px"}}
				onClick={handleStoryProtocolClick}
				disabled={!isTwitterButtonEnabled} // Piggyback on the Twitter button enabled state
			>
				<img src="/nft-supreme/story-protocol-button-1.png" alt="Share on Twitter"/>
			</Button>

			{/* New Image button */}
			<Button style={{marginLeft: "3px", backgroundColor: "greenyellow"}} onClick={newImageImageHandler}>
				New Image
			</Button>

			{/* Enhance button */}
			<Button style={{marginLeft: "3px", backgroundColor: "deepskyblue"}} onClick={enhanceImageHandler}>
				{"Enhance"}
			</Button>

			{/* Refine button */}
			<Button style={{marginLeft: "3px", backgroundColor: "indianred"}} onClick={refineImageHandler}>
				{"Refine"}
			</Button>
		</Root>
	);
});

ReaderToolbar.displayName = "ReaderToolbar";

export default ReaderToolbar;
