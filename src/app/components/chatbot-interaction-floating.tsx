import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
} from "react";
import { Button, Spinner } from "@radix-ui/themes";
import {ArrowLeftIcon} from "lucide-react";

interface ChatbotInteractionFloatingProps {
    titleText: string;
    isStreaming: boolean;
    stateText: string;
    onTakeAction: (userInput: string) => void;
    handleStoryProtocolClick: () => void;
    handleBackButtonClick: () => void;
}

export interface ChatbotInteractionFloatingRef {
    setText: (newText: string) => void;
    setTextExplainer: (newText: string) => void;
    setVisibility: (visible: boolean) => void;
}

const ChatbotInteractionFloating = forwardRef<
    ChatbotInteractionFloatingRef,
    ChatbotInteractionFloatingProps
>((props, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [textareaValue, setTextareaValue] = useState("");
    const [textareaValueExplainer, setTextareaValueExplainer] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const textareaExplainerRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
        setVisibility(visible: boolean) {
            setIsVisible(visible);
        },
        setText(newText: string) {
            setTextareaValue(newText);
        },
        setTextExplainer(newText: string) {
            setTextareaValueExplainer(newText);
        },
    }));

    useEffect(() => {
        setTextareaValue("");
    }, [props.titleText]);

    const handleTextareaChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        setTextareaValue(event.target.value);
    };

    const handleTextareaKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
        }
    };

    const handleInputChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        setInputValue(event.target.value);
    };

    const handleInputKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (props.onTakeAction) {
                props.onTakeAction(inputValue);
            }
            setInputValue("");
        }
    };

    const handleGoClick = () => {
        if (props.onTakeAction) {
            props.onTakeAction(inputValue);
        }
        setInputValue("");
    };

    const handleBackArrowClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirmationResponse = (confirm: boolean) => {
        setShowConfirmation(false);
        if (confirm) {
            props.handleBackButtonClick();
        }
    };

    return (
        <div
            id="chatbot-interaction-container-div"
            className={`chatbot-interaction-container ${!isVisible ? "hidden" : ""}`}
            style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: isVisible ? "flex" : "none",
                flexDirection: "column",
                backgroundColor: "white",
                padding: "20px",
                boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
                width: "80%",
                maxWidth: "500px",
                height: "auto",
                color: "rgb(87 52 52)"
            }}
        >
            <div id="title-div">
                <div id="child-of-title-div"
                     style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                    <div id="back-button-container" style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0", // light gray background
                        borderRadius: "8px",        // rounded corners for style
                        padding: "8px",             // padding for spacing
                        marginRight: "10px"         // space from title
                    }}>
                        <button
                            className="my-back-arrow-btn"
                            onClick={handleBackArrowClick}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.5em",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <ArrowLeftIcon style={{fontSize: "1.8em", color: "#007bff"}}/>
                        </button>
                    </div>
                    <h3 className="chatbot-floating-interaction-header">{props.titleText}</h3>
                    <Button
                        style={{marginLeft: "3px"}}
                        onClick={props.handleStoryProtocolClick}
                    >
                        <img src="/nft-supreme/story-protocol-button-1.png" alt="Story Protocol"/>
                    </Button>
                </div>
            </div>

            {showConfirmation && (
                <div className="confirmation-box" style={{
                    backgroundColor: "#f0f0f0",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center",
                    marginTop: "10px"
                }}>
                    <p>Are you sure you want to exit the license assistant?</p>
                    <div style={{display: "flex", justifyContent: "center", gap: "10px"}}>
                        <button
                            onClick={() => handleConfirmationResponse(true)}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "green",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                marginTop: "5px"
                            }}
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => handleConfirmationResponse(false)}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "red",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                marginTop: "5px"
                            }}
                        >
                            No
                        </button>
                    </div>
                </div>
            )}

            <div id="state-text-chatbot-interaction-floating" className="w-[500px] mx-auto text-center px-12 text-justify font-medium animate-pulse-brightness" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#ffcccc" }}>
                {props.stateText}
            </div>
            <div className={`grid items-center justify-center ${props.isStreaming ? "opacity-90" : "opacity-0"}`}>
                <Spinner size="3" className="mt-3" />
            </div>
            <textarea readOnly id="chatbot-explainer-textarea" ref={textareaExplainerRef} value={textareaValueExplainer} />
            <textarea id="chatbot-interaction-textarea" ref={textareaRef} value={textareaValue} onChange={handleTextareaChange} onKeyDown={handleTextareaKeyDown} />
            <div id="prompt-input-box-div" className="prompt-input-box">
                <label id="prompt-input-box-label" className="prompt-input-box-label">Your input:</label>
                <textarea id="chatbot-interaction-input-box" value={inputValue} onChange={handleInputChange} onKeyDown={handleInputKeyDown} className="prompt-input-box-textarea" />
                <button id="prompt-input-box-button" className="rt-reset rt-BaseButton rt-r-size-2 rt-variant-solid rt-Button" onClick={handleGoClick}>Go</button>
            </div>
        </div>
    );
});

ChatbotInteractionFloating.displayName = "ChatbotInteractionFloating";

export default ChatbotInteractionFloating;
