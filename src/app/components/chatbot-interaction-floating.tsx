import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
} from "react";
import {Button, Spinner} from "@radix-ui/themes";
import {LicenseAssistantNuevoResponse} from "@/app/reader/types";

interface ChatbotInteractionFloatingProps {
    titleText: string;
    isStreaming: boolean;
    stateText: string;
    onTakeAction: (userInput: string) => void; // Handler for the Enter key
    handleStoryProtocolClick: () => void;
}

// Define the ChatbotInteractionFloatingRef interface to expose methods to the parent
export interface ChatbotInteractionFloatingRef {
    setText: (newText: string) => void;
    setTextExplainer: (newText: string) => void;
    setVisibility: (visible: boolean) => void;
}

// Use forwardRef with the correct ref type
const ChatbotInteractionFloating = forwardRef<
    ChatbotInteractionFloatingRef,
    ChatbotInteractionFloatingProps
>((props, ref) => {
    // Set this to false to make our initial state "hidden".
    const [isVisible, setIsVisible] = useState(false);

    const [textareaValue, setTextareaValue] = useState(""); // State for the first textarea content
    const [textareaValueExplainer, setTextareaValueExplainer] = useState(""); // State for the first textarea content
    const [inputValue, setInputValue] = useState(""); // State for the second textarea (input box)
    const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the first textarea
    const textareaExplainerRef = useRef<HTMLTextAreaElement>(null); // Ref for the first textarea

    // Trying to fix problems with floating DIV not hiding.

    // Expose methods to the parent component
    useImperativeHandle(ref, () => ({
        setVisibility(visible: boolean) {
            setIsVisible(visible);
        },
        setText(newText: string) {
            setTextareaValue(newText); // Update the textarea value state
        },
        setTextExplainer(newText: string) {
            setTextareaValueExplainer(newText); // Update the textarea value state
        },
        handleStoryProtocolClick(): void {
            // The user wants to mint the NFT with the license
            //  details they have specified.

            // STUB
            alert("Mint it!");
        }
    }));

    // Update the textareaValue when props.titleText changes (if needed)
    useEffect(() => {
        // For example, reset the textareaValue when titleText changes
        setTextareaValue("");
    }, [props.titleText]);

    // Handler for first textarea input
    const handleTextareaChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        setTextareaValue(event.target.value); // Update state when the user types
    };

    // Handler for first textarea keydown
    const handleTextareaKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent a newline from being added
            // You can handle submission here if needed
        }
    };

    // Handler for second textarea (input box) input
    const handleInputChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        setInputValue(event.target.value); // Update state when the user types
    };

    // Handler for second textarea keydown
    const handleInputKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent a newline from being added
            if (props.onTakeAction) {
                props.onTakeAction(inputValue);
            }
            setInputValue(""); // Clear the input
        }
    };

    // Handler for Go button click
    const handleGoClick = () => {
        if (props.onTakeAction) {
            props.onTakeAction(inputValue);
        }
        setInputValue(""); // Clear the input
    };

    return (
        <div
            id="chatbot-interaction-container-div"
            className={`chatbot-interaction-container ${
                !isVisible ? "hidden" : ""
            }`}
            style={{
                position: "fixed", // Keep the component fixed over the viewport
                top: "50%", // Center vertically
                left: "50%", // Center horizontally
                transform: "translate(-50%, -50%)", // Move the component's center to the middle of the viewport
                // display: "flex",
                display: isVisible ? "flex" : "none",
                flexDirection: "column",
                backgroundColor: "white", // Add a background for visibility
                padding: "20px",
                boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)", // Optional: add shadow for better visibility
                zIndex: 1000, // Ensure the component is above other content
                width: "80%", // Set a reasonable width
                maxWidth: "500px", // Restrict the max width
                height: "auto", // Adjust height automatically
                color: "rgb(87 52 52)"
            }}
        >
            {/* Title section */}
            <div id="title-div">
                <div id="child-of-title-div"
                     style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                    <h3 className="chatbot-floating-interaction-header">{props.titleText}</h3>
                    <Button
                        style={{marginLeft: "3px"}} // Adds some space between the h2 and the Button
                        onClick={props.handleStoryProtocolClick}
                    >
                        <img src="/nft-supreme/story-protocol-button-1.png" alt="Share on Twitter"/>
                    </Button>
                </div>
            </div>

            <div
                id="state-text-chatbot-interaction-floating"
                className="w-[500px] mx-auto text-center px-12 text-justify font-medium animate-pulse-brightness"
                style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#ffcccc",
                }}
            >
                {props.stateText}
            </div>
            <div
                className={`grid items-center justify-center ${
                    props.isStreaming ? "opacity-90" : "opacity-0"
                }`}
            >
                <Spinner size="3" className="mt-3"/>
            </div>

            {/* First Textarea section */}
            <textarea
                readOnly
                id="chatbot-explainer-textarea"
                ref={textareaExplainerRef} // Attach ref here
                value={textareaValueExplainer} // Bind to state
            />

            {/* Second Textarea section */}
            <textarea
                id="chatbot-interaction-textarea"
                ref={textareaRef} // Attach ref here
                value={textareaValue} // Bind to state
                onChange={handleTextareaChange} // Handle user input
                onKeyDown={handleTextareaKeyDown} // Handle Enter key press
            />

            <div id="prompt-input-box-div" className="prompt-input-box">
                {/* Label on the left */}
                <label id="prompt-input-box-label" className="prompt-input-box-label">
                    Your input:
                </label>

                {/* Second Textarea in the middle */}
                <textarea
                    id="chatbot-interaction-input-box"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown} // Handle Enter key press
                    className="prompt-input-box-textarea"
                />

                {/* Button on the right */}
                <button
                    id="prompt-input-box-button"
                    className="rt-reset rt-BaseButton rt-r-size-2 rt-variant-solid rt-Button"
                    onClick={handleGoClick}
                >
                    Go
                </button>
            </div>
        </div>
    );
});

ChatbotInteractionFloating.displayName = "ChatbotInteractionFloating";

export default ChatbotInteractionFloating;
