import React, { useState } from 'react';

interface ChildComponentProps {
    count: number; // Explicitly declaring that count is a number
}

// 1. Setting up a child component that receives props (state)
function ChildComponent({ count }: ChildComponentProps) {
    return (
        <div>
            <h2>Current Count: {count}</h2>
        </div>
    );
}

// 2. Parent component that sets up state and binds it to the child component
function ParentComponent() {
    // 3. Set up a state variable using useState (count)
    const [count, setCount] = useState(0);

    // Event handler that changes the state (increases count)
    const incrementCount = () => {
        setCount(count + 1); // This triggers a re-render
    };

    return (
        <div>
            <h1>Simple Counter App</h1>

            {/* 4. A button that will change the state when clicked */}
            <button onClick={incrementCount}>Increment Count</button>

            {/* Pass the count state to the ChildComponent */}
            <ChildComponent count={count} />
        </div>
    );
}

// Main App that renders the parent component
function App() {
    return (
        <div className="App">
            <ParentComponent />
        </div>
    );
}

export default App;
