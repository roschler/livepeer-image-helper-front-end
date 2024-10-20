import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import PromptInput, { PromptLabelProps } from "@/app/components/prompt-input";
import { Spinner } from "@radix-ui/themes";
import ChatbotInteractionFloating from "@/app/components/chatbot-interaction-floating";

interface ChatbotInteractionProps extends PromptLabelProps {
    titleText: string;
    isStreaming: boolean;
    stateText: string;
}

// Define the ChatbotInteractionRef interface to expose methods to the parent
export interface ChatbotInteractionRef {
    setText: (newText: string) => void;
    setVisibility: (visible: boolean) => void;
}

// Use forwardRef with the correct ref type
const ChatbotInteraction = forwardRef<ChatbotInteractionRef, ChatbotInteractionProps>(
    (props, ref) => {
        const [isVisible, setIsVisible] = useState(true);
        const textareaRef = useRef<HTMLTextAreaElement>(null);

        // Function to set the textarea content
        const updateTextareaText = (newText: string) => {
            if (textareaRef.current) {
                textareaRef.current.value = newText;
            }
        };

        // Expose methods to the parent component
        useImperativeHandle(ref, () => ({
            setVisibility(visible: boolean) {
                setIsVisible(visible);
            },
            setText(newText: string) {
                updateTextareaText(newText);
            },
        }));

        return (
            <div
                id="chatbot-interaction-container-div"
                className={`chatbot-interaction-container ${!isVisible ? "hidden" : ""}`}
            >
                {/* Title section */}
                <div id="title-div">
                    <h2 className="chatbot-interaction">{props.titleText}</h2>
                </div>

                <div
                    id="state-text"
                    className="w-[500px] mx-auto text-center px-12 text-justify font-medium text-red-400 animate-pulse-brightness"
                >
                    {props.stateText}
                </div>
                <div className={`grid items-center justify-center ${props.isStreaming ? "opacity-90" : "opacity-0"}`}>
                    <Spinner size="3" className="mt-3" />
                </div>

                {/* Textarea section */}
                <textarea
                    id="chatbot-interaction-textarea"
                    ref={textareaRef}
                    // Add other necessary props here
                />
            </div>
        );
    }
);

ChatbotInteraction.displayName = "ChatbotInteraction";

export default ChatbotInteraction;
