import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Spinner } from "@radix-ui/themes";

export interface EnhancedSpinnerProps {
    isStreaming: boolean;
    updateIntervalSecs: number;
    spinnerSize: SpinnerSizes;
    spinnerClasses?: string;
}

// Define SpinnerSizes as a union of allowed string literals
export type SpinnerSizes = "1" | "2" | "3";

export interface EnhancedSpinnerRef {
    resetSpinner: () => void;
}

const EnhancedSpinner = forwardRef<EnhancedSpinnerRef, EnhancedSpinnerProps>(
    ({ isStreaming, updateIntervalSecs, spinnerSize, spinnerClasses = "" }, ref) => {
        const [secondsElapsed, setSecondsElapsed] = useState(0);

        useEffect(() => {
            if (isStreaming) {
                const intervalId = setInterval(() => {
                    setSecondsElapsed((prev) => prev + updateIntervalSecs);
                }, updateIntervalSecs * 1000);

                return () => clearInterval(intervalId);
            }
        }, [isStreaming, updateIntervalSecs]);

        // Expose the resetSpinner function
        useImperativeHandle(ref, () => ({
            resetSpinner() {
                setSecondsElapsed(0);
            },
        }));

        return (
            <div
                className={`flex items-center justify-center ${
                    isStreaming ? "opacity-90" : "opacity-0"
                }`}
            >
                <Spinner size={spinnerSize} className={spinnerClasses} />
                <div
                    id="seconds-elapsed-div"
                    className="seconds-elapsed ml-2"
                    style={{ marginTop: "12px" }}
                >
                    {secondsElapsed}s
                </div>
            </div>
        );
    }
);

EnhancedSpinner.displayName = "EnhancedSpinner";

export default EnhancedSpinner;
