import { Root } from "@radix-ui/react-label"
import type { PropsWithChildren } from "react"

export type PromptLabelProps = {
	value: string
	onChange: (prompt: string) => void
	onTakeAction: (genre: string) => void
} & PropsWithChildren

import { useRef, useEffect } from "react";

export default function PromptLabel(props: PromptLabelProps) {
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

	const changeHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		props.onChange(e.target.value);

		// Auto-adjust height based on content
		if (textAreaRef.current) {
			textAreaRef.current.style.height = "auto";
			textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
		}
	};

	useEffect(() => {
		// Auto-resize on initial render if there is already content
		if (textAreaRef.current) {
			textAreaRef.current.style.height = "auto";
			textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
		}
	}, []);

	const handleFocus = () => {
		// Select all text when the text area receives focus
		if (textAreaRef.current) {
			textAreaRef.current.select();
		}
	};

	// Detect Enter key and trigger onTakeAction when pressed
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter") {
			e.preventDefault(); // Prevent the default behavior of adding a newline
			props.onTakeAction(props.value); // Call the onTakeAction prop
		}
	};

	return (
		<div className="m-6 flex flex-wrap items-center gap-[15px] px-6">
			<Root className="leading-1 text-sm font-bold" htmlFor="promptInput">
				Prompt &gt;
			</Root>
			<textarea
				ref={textAreaRef}
				className="selection:color-white inline-flex w-[420px] appearance-none items-center justify-center rounded-[4px] bg-blackA2 px-[10px] text-[15px] leading-none text-white shadow-[0_0_0_1px] shadow-blackA6 outline-none selection:bg-blackA6 focus:shadow-[0_0_0_2px_black]"
				id="prompt-input-textarea-license-assistant"
				onChange={changeHandler}
				onFocus={handleFocus}
				onKeyDown={handleKeyDown} // Add the key down event handler to detect Enter key
				value={props.value}
				rows={2} // Default two rows visible
				style={{
					overflow: "hidden", // Prevent scrollbars
					resize: "none", // Disable manual resizing
					// height: "auto", // Let the height adjust automatically
					minHeight: "50px", // Ensure it has a minimum height
				}}
			/>
		</div>
	);
}

