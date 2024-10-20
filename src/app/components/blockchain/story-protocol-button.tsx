// This module contains a component for encapsulating the work needed
// to do blockchain work with the Story Protocol and also includes
// code and object for managing blockchain and wallet operations
// with MetaMask as the target wallet.

// Import necessary modules
import React, { useEffect, useState } from 'react';
import {UserBlockchainPresence} from "@/app/components/blockchain/user-blockchain-presence";
import {NotifyFuncWithJsonObject} from "@/app/components/blockchain/blockchain-common";

// Verbose logging flag
export const bVerboseStoryProtocolManager = true;
const CONSOLE_CATEGORY = 'story-protocol-manager';

// StoryProtocolButton component
interface StoryProtocolManagerProps {
    enforceChainId: string | null;
    onInit?: (ubp: UserBlockchainPresence, notifyMe: NotifyFuncWithJsonObject) => void;
}

/**
 * DEPRECATED: This component is not currently used.  The viewport is handing
 *  the button click itself.
 *
 * StoryProtocolButton component
 */
export const StoryProtocolButton: React.FC<StoryProtocolManagerProps> =
        ({
            enforceChainId,
            onInit,
        }) => {

    const [userBlockchainPresence, setUserBlockchainPresence] = useState<UserBlockchainPresence | null>(
        null
    );

    useEffect(() => {
        const ubp = new UserBlockchainPresence(enforceChainId);
        setUserBlockchainPresence(ubp);

        // Define notifyMe function
        const notifyMeFunction: NotifyFuncWithJsonObject = (jsonObj: Record<string, unknown>) => {
            console.log('notifyMe called with:', jsonObj);
            // Handle the notification
        };

        if (onInit) {
            onInit(ubp, notifyMeFunction);
        }

        // Do any initialization or event subscription here
        // For example, subscribe to blockchain events and call notifyMe when events occur

        return () => {
            // Cleanup if necessary
        };
    }, [enforceChainId, onInit]);

    const handleButtonClick = async () => {
        if (userBlockchainPresence) {
            const preflightSuccess = await userBlockchainPresence.preflightCheck();
            if (preflightSuccess) {
                // Proceed with blockchain interaction
            }
        }
    };

    return <button onClick={handleButtonClick}>Connect to MetaMask</button>;
};

/*

USAGE BY VIEWPORT EXAMPLE:

import React, { useEffect, useState } from 'react';
import { StoryProtocolButton } from './StoryProtocolButton'; // Adjust the path as needed
import { UserBlockchainPresence } from './StoryProtocolButton'; // Assuming it's exported

interface ViewportProps {
  enforceChainId: string | null;
}

const Viewport: React.FC<ViewportProps> = ({ enforceChainId }) => {
  const [userBlockchainPresence, setUserBlockchainPresence] = useState<UserBlockchainPresence | null>(null);

  useEffect(() => {
    if (userBlockchainPresence) {
      // Access to UserBlockchainPresence object here
      console.log('UserBlockchainPresence object:', userBlockchainPresence);
    }
  }, [userBlockchainPresence]);

  const handleInit = (ubp: UserBlockchainPresence) => {
    setUserBlockchainPresence(ubp);
  };

  return (
    <div>
      <h1>Viewport</h1>
      <StoryProtocolButton enforceChainId={enforceChainId} onInit={handleInit} />
    </div>
  );
};

export default Viewport;

*/

