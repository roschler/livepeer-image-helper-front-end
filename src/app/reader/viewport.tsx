"use client";

import { PropsWithChildren, useRef } from "react";
import React, { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
	EnumImageProcessingModes,
	JsonObjectAndTypeResponseObject, LicenseAssistantNuevoResponse,
	LicenseAssistantRequest,
	MintNftImageDetails,
	MintNftRequest, OperationResultPayload,
	ShareImageOnTwitterPayload, StoreUserBlockchainPresenceRequest,
	storyGenres, StringifiedJsonObject,
	TwitterCardDetails
} from "@/app/reader/types";
import ReaderToolbar, {ReaderToolbarHandle} from "@/app/components/toolbar/toolbar";
import PromptInput from "@/app/components/prompt-input";
import ImageViewer from "@/app/components/image-viewer";
import { Badge, Callout } from "@radix-ui/themes";
import type {
	ServerMessage,
	StatePayload,
	TextPayload,
	AudioPayload,
	ImagePayload,
	ErrorPayload,
} from "@/app/reader/types";
import { Frown } from "lucide-react";
import { getOrCreateAnonymousId } from "@/app/cookies/cookie-management";
import {EnumClientUserMessages} from "@/client-constants/client-user-messages";
import {
	UserBlockchainPresence
} from "@/app/components/blockchain/user-blockchain-presence";
import {EnumChainIds} from "@/app/components/blockchain/blockchain-common";

import {showAllBigintFieldNames} from "@/common/common-routines";
import ChatbotInteractionFloating, {ChatbotInteractionFloatingRef} from "@/app/components/chatbot-interaction-floating";
import EnhancedSpinner, { EnhancedSpinnerRef } from "@/app/components/enhanced-spinner";

// How often we want the spinner elapsed time in seconds
//  DIV to update.
const SPINNER_INTERVAL_SECONDS = 1;

// -------------------- BEGIN: CHATBOT NAMES ------------

// This enum holds the known chatbot names.
export enum EnumChatbotNames {
	"LICENSE_ASSISTANT" = "license_assistant",
	"IMAGE_ASSISTANT" = "image_assistant"
}

// -------------------- END  : CHATBOT NAMES ------------

export interface DiscordSession {
	user: {
		name: string;
		email: string;
		image: string;
		id: string;
	};
}

export interface DefaultSession {
	user?: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
}

type ReaderViewportProps = {
	session: DiscordSession;
} & PropsWithChildren;

const CONSOLE_CATEGORY = 'viewport';

const defaultPrompts = {
	magic: "A photorealistic wizard who lives in a magical forest.",
	scifi: "In a galaxy far, far away, Luke swings a light saber.",
	swords: "A regal knight on a quest to save the kingdom.",
	romance: "A sly fox falls in love with a mysterious feline.",
	drama: "In a small town, a detective uncovers a dark secret.",
	apocalypse: "The world has ended, smoke spews from volcanoes everywhere.",
	hollywood: "A dazzling showgirl dances in a chorus line.",
	singularity: "The Borg has risen and stand ready to take over the world",
};

const defaultImages = {
	urls: [],
};

const genreList = storyGenres;

export default function ReaderViewport(props: ReaderViewportProps) {

	const spinnerRef = useRef<EnhancedSpinnerRef>(null);

	// Reset the enhanced spinner to 0 seconds.
	const resetSpinner = () => {
		spinnerRef.current?.resetSpinner();
	};

	// -------------------- BEGIN: PROMISE RESOLVERS ------------

	// These are the promise resolvers we use as part of
	//  the mechanism we use to asynchronously wait for
	//  an expected response to one of our requests to the
	//  back-end server.

	// This is the resolver that fulfills the promise in
	//  requestMintNftTokenDetailsFromServer() that is waiting
	//  for a response from our back-end serve over the websocket
	//  connection.
	const mintNftImageDetailsResolver = useRef<((details: MintNftImageDetails) => void) | null>(null);

	// This is the promise resolver for the function that
	//  requests the latest server side stored copy of the
	//  user's user blockchain presence object.
	const requestGetUserBlockchainPresenceObjectResolver = useRef<((details: UserBlockchainPresence | null) => void) | null>(null);

	// This is the promise resolver for the function that
	//  asks the server  to update it copy  of the
	//  side stored copy of the user's user blockchain
	//  presence object.
	const requestStoreUserBlockchainPresenceObjectResolver = useRef<((details: boolean) => void) | null>(null);

	// -------------------- END  : PROMISE RESOLVERS ------------

	const user = props.session?.user?.name ?? "Anonymous";
	const defaultPrompt = `New image.  A strange looking tree, craggy, with scary branches, and eerie shadowy mist swirling around it, in the moonlit sky.`;
	const [story, setStory] = useState("What kind of image would you like to create?");
	const [genre, setGenre] = useState("magic");
	const [images, setImages] = useState<ImagePayload>(defaultImages);
	const [prompt, setPrompt] = useState(defaultPrompt);
	const [isStreaming, setIsStreaming] = useState(false);
	const [userHasTyped, setUserHasTyped] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [showCarousel, setShowCarousel] = useState(false);
	const [connectionEstablished, setConnectionEstablished] = useState(false);
	const [stateText, setStateText] = useState("");
	// const [isLocalhost, setIsLocalhost] = useState(false);
	const [connectionAttempt, setConnectionAttempt] = useState(0);
	const imageCarouselRef = useRef<HTMLDivElement | null>(null);

	// State variable for the last back-end server response
	//  we received with a license terms object.
	const [licenseResponseObj, setLicenseResponseObj] = useState<LicenseAssistantNuevoResponse|null>(null);

	// State variable for chatbotName
	const [chatbotName, setChatbotName] =
		useState<EnumChatbotNames>(EnumChatbotNames.IMAGE_ASSISTANT);
	// useState<string>(EnumChatbotNames.LICENSE_ASSISTANT);

	// Create reference objects to access the methods the ChatbotInteraction
	//  component exposes.
	//
	// Ref for the license assistant.
	const cbLicenseAssistantRef = useRef<ChatbotInteractionFloatingRef>(null);

	// Ref for the image assistant.
	const cbImageAssistantRef = useRef<ChatbotInteractionFloatingRef>(null);

	// Maintains the state of whether or not this is the first
	//  license assistant request (chat volley) for a new
	//  NFT minting attempt, or the continuation of an ongoing
	//  session.
	//
	// useRef() maintains the state of whether or not this is the first
	// license assistant request (chat volley) for a new
	// NFT minting attempt, or the continuation of an ongoing
	// session.
	const bIsNewLicenseSession = useRef(true);

	// Make sure the user has not entered anything into the PromptInput
	//  box, before setting it to the default prompt.  This is to
	//  stop error events from overwriting the user's input.
	const initialPromptSet = useRef(false); // Track if the initial default prompt has been set

	// Set the initial prompt once on mount
	useEffect(() => {
		if (!initialPromptSet.current) {
			setPrompt(defaultPrompt);
			initialPromptSet.current = true; // Mark initial prompt as set
		}
	}, []);

	/**
	 * This function shows/hides the license assistant component.
	 *
	 * @param bIsVisible - TRUE shows it, FALSE hides it.
	 */
	const setLicenseAssistantVisibility = (bIsVisible: boolean) => {
		if (cbLicenseAssistantRef.current) {
			cbLicenseAssistantRef.current.setVisibility(bIsVisible);
		}
	}

	/**
	 * This function shows/hides the image assistant component.
	 *
	 * @param bIsVisible - TRUE shows it, FALSE hides it.
	 */
	const setImageAssistantVisibility = (bIsVisible: boolean) => {
		if (cbImageAssistantRef.current) {
			cbImageAssistantRef.current.setVisibility(bIsVisible);
		}
	}

	/**
	 * This function sets the text for the license assistant.
	 *
	 * @param newText - New text to show
	 */
	const setLicenseAssistantText = (newText: string) => {
		if (cbLicenseAssistantRef.current) {
			cbLicenseAssistantRef.current.setText(newText);
		}
	}

	/**
	 * This function sets the text for the license assistant
	 *  explainer box.
	 *
	 * @param newText - New explainer text to show
	 */
	const setLicenseAssistantExplainerText = (newText: string) => {
		if (cbLicenseAssistantRef.current) {
			cbLicenseAssistantRef.current.setTextExplainer(newText);
		}
	}

	/**
	 * Watch for changes to chatbotName and control visibility of the license assistant
	 */
	useEffect(() => {
		if (chatbotName === EnumChatbotNames.LICENSE_ASSISTANT) {
			setLicenseAssistantVisibility(true);
		} else {
			setLicenseAssistantVisibility(false);
		}
	}, [chatbotName]); // This effect will run every time chatbotName changes

	useEffect(() => {
		if (chatbotName === EnumChatbotNames.LICENSE_ASSISTANT) {
			setLicenseAssistantVisibility(true);
		} else {
			setLicenseAssistantVisibility(false);
		}
	}, [chatbotName]);

	// Sets the initial prompt for the license assistant.
	useEffect(() => {
		// Initial prompt for license assistant.
		setLicenseAssistantText(
			"With a Story Protocol license, you have flexibility in how the IP asset can be used, sold, and adapted by others. You can set terms to allow the transfer your license, you can set the fee for licensing your work, or establish an expiration date for the license. You can allow or disallow your work to be used commercially (for profit) and require them to attribute you in their derivative works. An SP license is very powerful and there several other options I have not mentioned. Do you know what kind of license you want to offer?"
		);

		// Initial prompt for license assistant explainer.
		setLicenseAssistantExplainerText("Your license terms will appear here...")
	}, []); // Empty dependency array ensures this runs once after the initial render


	useEffect(() => {
		if (cbLicenseAssistantRef.current) {
			// Use setText to update the textarea content
			// cbLicenseAssistantRef.current.setText('Hello from the parent component!');

			// Use setVisibility to show or hide the ChatbotInteraction component
			// cbLicenseAssistantRef.current.setVisibility(true); // Set to false to hide
		}

		if (cbImageAssistantRef.current) {
			// Use setText to update the textarea content
			// cbLicenseAssistantRef.current.setText('Hello from the parent component!');

			// Use setVisibility to show or hide the ChatbotInteraction component
			// cbLicenseAssistantRef.current.setVisibility(true); // Set to false to hide
		}
	}, []); // Empty dependency array ensures this runs once on mount
	let WEBSOCK_URL = "wss://wss.plasticeducator.com/chatbot";

	// When the user changes the active image in the image
	//  carousel, this variable will be assigned the URL
	//  of the active image.
	let activeImageUrl = '';
	let activeImageDimensions = { width: 0, height: 0 }

	if (typeof window !== 'undefined') {
		// Tried over 10 different Stack Overflow
		//  solutions to stop EsLint from erroring out
		//  when evaluating this line.  Using this
		//  technique to outsmart it.
		const strToEval = `window.location.hostname === 'localhost'`

		const isLocalhostURL: boolean = eval(strToEval) as boolean

		if (isLocalhostURL) {
			// Switch to the local back-end server instance
			WEBSOCK_URL = "ws://localhost:3001/chatbot";
		}
	}

	// console.warn('FORCING REMOTE WSS USE')
	// const useWssUrl = "wss://wss.plasticeducator.com/chatbot";

	// -------------------- BEGIN: ENABLE/DISABLE TWITTER BUTTON ------------

	// Get a reference to our toolbar.
	const toolbarRef = useRef<ReaderToolbarHandle>(null);

	useEffect(() => {
		// Disable/enable the Twitter button as needed.
		if (toolbarRef.current) {
			if (activeImageUrl.length > 0) {
				// Disable Twitter button if we don't have an
				//  active image yet.
				toolbarRef.current.setTwitterButtonEnabled(false);
			} else {
				// Enable Twitter button when we have an active image.
				toolbarRef.current.setTwitterButtonEnabled(true);
			}
		}
	}, [images]);

	// -------------------- END  : ENABLE/DISABLE TWITTER BUTTON ------------

	useEffect(() => {
		if (connectionEstablished) {
			// New client socket session. Clear the error message.
			setErrorMessage('')
		} else {
			// Code to run when connectionEstablished becomes false
			console.log('Connection lost!');
		}
	}, [connectionEstablished]);

	const shouldReconnect = (_closeEvent: CloseEvent) => {
		if (connectionAttempt < 5) {
			setConnectionAttempt((prev) => prev + 1);
			return true;
		}
		console.error("Max reconnection attempts reached");
		return false;
	};

	// -------------------- BEGIN: LICENSE ASSISTANT CHATBOT FUNCTIONS ------------

	const onLicenseAssistantPromptChanged = (value: string ): void => {
		// console.info(CONSOLE_CATEGORY, `The license assistant prompt changed to: ${value}.`);

		setUserHasTyped(true);
		setPrompt(value);
	}

	/**
	 * This is the function that does a chat volley
	 *  with the license assistant.
	 *
	 * @param userInput - The latest user input.
	 */
	const onLicenseAssistantTakeAction = (userInput: string ): void => {
		console.info(CONSOLE_CATEGORY, `The license assistant take action value is: ${userInput}.`);

		// No nested calls.
		if (isStreaming)
			return;

		setStory("");
		// setShowCarousel(false);
		// setIsStreaming(true);

		const userId = getOrCreateAnonymousId();

		// Make the request to our back-end server to
		//  chat with the image assistant.
		sendJsonMessage({
			type: "request_license_assistant",
			payload: {
				user_id: userId,
				prompt: userInput,
				is_new_license_session: bIsNewLicenseSession.current
			} as LicenseAssistantRequest,
		});

		// All subsequent chat volleys should be marked as
		//  an ongoing chat session.
		bIsNewLicenseSession.current = false;
	}

	// -------------------- END  : LICENSE ASSISTANT CHATBOT FUNCTIONS ------------

	/**
	 * Send a JSON message to the back-end server.
	 */
	const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
		WEBSOCK_URL,
		{
			onOpen: () => {
				console.log("Connection opened");
				setConnectionAttempt(0);
				setConnectionEstablished(true);
			},
			onClose: (closeEvent) => {
				console.log("Connection closed");
				console.log(`Code: ${closeEvent.code}, Reason: ${closeEvent.reason}, Clean: ${closeEvent.wasClean}`);
				setConnectionEstablished(false);

				console.info(CONSOLE_CATEGORY, `SOCKET CLOSED.  Setting isStreaming to: FALSE `);
				setIsStreaming(false);

				setErrorMessage(`Disconnected: ${closeEvent.reason}`);
			},
			onError: (error) => {
				console.error("WebSocket error", error);
				setErrorMessage("WebSocket error occurred");
			},
			shouldReconnect,
		}
	);

	// -------------------- BEGIN: EXTENDED SEND JSON MESSAGE ------------

	// The sendJsonMessage() function returned by the React
	//  WebSocket component does not know how to handle
	//  BigInt.  That is why we wrap that function in our
	//  version that does.
	const sendUserBlockchainPresenceMessage = (userBlockchainPresenceObj: UserBlockchainPresence) => {
		if (userBlockchainPresenceObj.publicAddress.length < 1)
			throw new Error(`The public address field is empty`);

		// TODO: Comment out this debug code.
		showAllBigintFieldNames(userBlockchainPresenceObj)

		const payload: StoreUserBlockchainPresenceRequest = {
			user_blockchain_presence_stringified: userBlockchainPresenceObj.toJsonString()
		}

		sendJsonMessage({
			type: "request_store_user_blockchain_presence",
			payload
		});
	}

	// -------------------- END  : EXTENDED SEND JSON MESSAGE ------------

	const connectionStatus = {
		[ReadyState.CONNECTING]: "connecting...",
		[ReadyState.OPEN]: "connected",
		[ReadyState.CLOSING]: "closing",
		[ReadyState.CLOSED]: "closed",
		[ReadyState.UNINSTANTIATED]: "uninitialized...",
	}[readyState];

	const clearError = () => {
		setTimeout(() => {
			setErrorMessage("");
		}, 5000);
	};

	const onGenreChange = (genre: string) => {
		setGenre(genre);
		if (userHasTyped)
			// Don't overwrite user input with genre prompt.
			return;

		setPrompt(
			defaultPrompts[genre as keyof typeof storyGenres].replace("%user%", user)
		);
	};

	/**
	 * This is the function that makes the actual image
	 *  request to our server.
	 */
	const doTheImageRequest = (imageProcessingMode: string) => {
		setShowCarousel(false);

		console.info(CONSOLE_CATEGORY, `doTheImageRequest for image processing mode("${imageProcessingMode}").  Setting isStreaming to: TRUE `);

		// Reset the spinner's seconds display.
		resetSpinner();
		// Set the busy flag.
		setIsStreaming(true);

		setStory("");

		const userId = getOrCreateAnonymousId();

		// Make the request to our back-end server to
		//  chat with the image assistant.
		sendJsonMessage({
			type: "request_image_assistant",
			payload: {
				user_id: userId,
				prompt: prompt,
				image_processing_mode: imageProcessingMode,
				url_to_active_image_in_client: activeImageUrl
			},
		});
	}

	/**
	 * This function is not currently used.
	 */
	const onGenreSelect = (genre: string) => {
		// No nested calls.
		if (isStreaming)
			return;

		doTheImageRequest(EnumImageProcessingModes.REFINE);
	};

	/**
	 * This function is called when the user
	 *  hits the ENTER key in the prompt input box
	 *
	 * @param userInput - The text the user entered.
	 */
	const doMakeImage = (userInput: string) => {
		if (isStreaming)
			return;

		setPrompt(userInput);

		// The default image processing mode for when the user
		//  hits the ENTER key in the prompt input box is
		//  "enhance".
		doTheImageRequest(EnumImageProcessingModes.ENHANCE);
	};

	/**
	 * Ask the back-end server for a user's blockchain presence
	 *  object.
	 *
	 * @param userPublicAddress - The desired public address.
	 *
	 * @returns - Returns the user blockchain presence object
	 *  returned by the server.
	 *
	 * TODO: Add server side signature verification.
	 */
	const requestGetUserBlockchainPresenceObject = async (userPublicAddress: string):Promise<UserBlockchainPresence | null> => {
		sendJsonMessage({
			type: "request_get_user_blockchain_presence",
			payload: {
				user_public_address: userPublicAddress,
			},
		});

		// Return a promise and store the resolver.  The "lastMessage"
		//  useEffect() handler will release the promise when the
		//  back-end server has sent us its latest copy of the
		//  user's user blockchain presence object.
		return new Promise((resolve, reject) => {
			requestGetUserBlockchainPresenceObjectResolver.current = resolve;
		});
	};

	/**
	 * Ask the back-end server to update a user's blockchain presence
	 *  object
	 *
	 * @param userBlockchainPresenceObj - The user blockchain presence
	 *  object to store.
	 *
	 * @returns - Returns the boolean result value from the server.
	 *  TRUE means it successfully stored the user blockchain
	 *  presence object, FALSE it the operation failed.
	 *
	 * TODO: Add server side signature verification.
	 */
	const requestStoreUserBlockchainPresenceObject = async (userBlockchainPresenceObj: UserBlockchainPresence): Promise<boolean> => {

		sendUserBlockchainPresenceMessage(userBlockchainPresenceObj)

		// Return a promise and store the resolver.  The "lastMessage"
		//  useEffect() handler will release the promise when the
		//  back-end server has notified us that is has updated its
		//  server-side copy of the user's user blockchain presence
		//  object.
		return new Promise((resolve, reject) => {
			requestStoreUserBlockchainPresenceObjectResolver.current = resolve;
		});
	};

	const onPromptUpdate = (value: string) => {
		setUserHasTyped(true);
		setPrompt(value);
	};

	const badgeColor = () => {
		return readyState === ReadyState.OPEN ? "lime" : readyState === ReadyState.CLOSED ? "red" : "orange";
	};

	/**
	 * This function is called from the ReaderToolbar
	 *  when the user clicks on the share image on Twitter
	 *  button.  The back-end server will us back a response
	 *  that contains the Twitter card URL we should use to
	 *  open a new window/tab that will show the user a
	 *  prepared tweet they can share on Twitter.
	 */
	const doShareImageOnTwitter = () => {
		console.info(CONSOLE_CATEGORY, `Sharing image on Twitter with URL: ${activeImageUrl}`);

		if (activeImageUrl.length > 0) {
			// Send a request to the server to share this image.
			const userId =
				getOrCreateAnonymousId()

			sendJsonMessage({
				type: "share_image_on_twitter",
				payload: {
					user_id: userId,
					image_url: activeImageUrl,
					dimensions: activeImageDimensions,
					client_user_message: EnumClientUserMessages.TWITTER_SHARE
				},
			});
		}
	}

	/**
	 * This function is called from the ReaderToolbar
	 *  when the user clicks on the refine image
	 *  button.  The back-end server will analyze the
	 *  latest image compared to the last prompt generated
	 *  and return to us a response with suggested feedback
	 *  text to be used on behalf of the user as feedback
	 *  to the current image.
	 */
	const doProcessImage = (imageProcessingMode: EnumImageProcessingModes) => {
		console.info(CONSOLE_CATEGORY, `Requesting image processing.  Mode("${imageProcessingMode}").\n Image URL: ${activeImageUrl}`);

		if (imageProcessingMode === EnumImageProcessingModes.NEW) {
			// Send a request to the server to refine this image.
			doTheImageRequest(imageProcessingMode);
		} else {
			// For all the other image processing modes other
			//  than starting a new image, we ignore a call
			//  to process an image until an image has been
			//  generated.
			if (activeImageUrl.length > 0) {
				// Send a request to the server to refine this image.
				doTheImageRequest(imageProcessingMode);
			}
		}
	}

	/**
	 * This function makes the request to the back-end server for the
	 *  image details we need to mint an NFT.  It is awaitable.
	 */
	const requestMintNftTokenDetailsFromServer = (userBlockchainPresenceObj: UserBlockchainPresence): Promise<MintNftImageDetails> => {
		console.info(CONSOLE_CATEGORY, `Requesting image details in preparation for token minting for image: ${activeImageUrl}`);

		const userId =
			getOrCreateAnonymousId()

		const payloadObj: MintNftRequest = {
			user_id: userId,
			user_blockchain_presence_json_stringified: userBlockchainPresenceObj.toJsonString(),
			image_url: activeImageUrl,
			dimensions: activeImageDimensions,
			client_user_message: '(none)',
		}

		sendJsonMessage({
			type: EnumClientUserMessages.MINT_NFT,
			payload: payloadObj
		});

		// Return a promise and store the resolver.  The "lastMessage"
		//  useEffect() handler will release the promise when the
		//  back-end server has sent use the image NFT details.
		return new Promise((resolve, reject) => {
			mintNftImageDetailsResolver.current = resolve;
		});
	}

	/**
	 * This function is called when the user has pressed the
	 *  back button on the license assistant form
	 *  to cancel the license terms session.
	 *
	 * NOTE: This function, as opposed to the
	 *  Twitter share function, does most of its
	 *  work on the client side.
	 */
	const doHandleBackButtonClick = async()  => {
		// Hide the license assistant.
		setLicenseAssistantVisibility(false);
	}

	/**
	 * This function is called when the user has pressed the
	 *  Story Protocol button on the license assistant form
	 *  to do the actual minting with the selected license
	 *  terms.
	 *
	 * @returns - Returns TRUE if the minting succeeded,
	 *  FALSE if not.
	 *
	 * NOTE: This function, as opposed to the
	 *  Twitter share function, does most of its
	 *  work on the client side.
	 */
	const doMintTokenOnStoryProtocol = async () => {
		console.info(CONSOLE_CATEGORY, `Minting token on Story Protocol network: ${activeImageUrl}`);

		if (activeImageUrl.length > 0) {
			// Hide the license assistant.
			setLicenseAssistantVisibility(false);

			// Create a new user blockchain presence object just
			//  to get the user's public address from Metamask.
			const userBlockchainPresenceObj_new
				// For now, we are only using Story Protocol's
				//  Iliad network.
				= new UserBlockchainPresence(EnumChainIds.Iliad)

			const bPreflightCheckSucceeded =
				// The preflight check will make sure that Metamask is
				//  installed, the user's wallet is set to the correct
				//  chain, and will get the user's currently selected
				//  public address.
				await userBlockchainPresenceObj_new.preflightCheck(setErrorMessage)

			if (bPreflightCheckSucceeded) {
				console.info(CONSOLE_CATEGORY, `Preflight check succeeded for public address: ${userBlockchainPresenceObj_new.publicAddress}`);
			} else {
				console.info(CONSOLE_CATEGORY, `Preflight check failed for public address: ${userBlockchainPresenceObj_new.publicAddress}`);

				// Just exit.  preflightCheck() will have called setErrorMessage() for
				//  us already.
				return false;
			}

			// Now get the most recently stored image of the
			//  user blockchain presence object from the back-end
			//  server.
			const userBlockchainPresenceObj_server =
				await requestGetUserBlockchainPresenceObject(userBlockchainPresenceObj_new.publicAddress)

			// If we get NULL back, this is a new user, so just use the
			//  new user blockchain presence object we created.
			let useUserBlockchainPresenceObj;

			if (userBlockchainPresenceObj_server === null) {
				// -------------------- BEGIN: NEW USER or PUBLIC ADDRESS/CHAIN-ID ------------

				// This is first-time blockchain user, or they are using
				//  a different public address.
				useUserBlockchainPresenceObj = userBlockchainPresenceObj_new;

				console.info(CONSOLE_CATEGORY, `New user.  Initializing needed user elements.`);

				// -------------------- END  : NEW USER or PUBLIC ADDRESS/CHAIN-ID  ------------
			}
			else {
				// -------------------- BEGIN: EXISTING USER OR KNOWN PUBLIC ADDRESS ------------

				// The user's blockchain public address is known to the back-end server

				// Use the server-side copy.
				useUserBlockchainPresenceObj = userBlockchainPresenceObj_server

				console.info(CONSOLE_CATEGORY, `Existing user.  Using their existing user blockchain presence object elements.`);

				// -------------------- END  : EXISTING USER OR KNOWN PUBLIC ADDRESS ------------
			}

			// Request the image NFT minting details from the server
			//  and wait for them.  The "lastMessage" useEffect()
			//  handler will release the promise we are waiting for
			//  when it gets them.  A side effect of this request
			//  is that the server will store the image permanently,
			//  if that has not already done for the generated image.
			const imageDetailsForNftMinting =
				await requestMintNftTokenDetailsFromServer(useUserBlockchainPresenceObj)

			console.info(CONSOLE_CATEGORY, `Received image details for NFT minting from back-end server.`);

			// Does an SPG NFT collection exist yet for this user?
			const bIsSpgNftCollectionRequired =
				!useUserBlockchainPresenceObj.isSpgNftCollectionInitialized();

			if (bIsSpgNftCollectionRequired) {
				// -------------------- BEGIN: CREATE SPG NFT collection ------------

				// No. We need to create an SPG NFT collection for them on
				//  Story Protocol, so that we can register NFTs against
				//  it.
				setStateText(`Creating Story Protocol Gateway collection, a one-time operation.`)
				console.info(CONSOLE_CATEGORY, `Creating SPG NFT collection for current user and public address pair.`);

				// Tell Story Protocol to create a new SPG NFT collection and wait
				//  for the response.

				console.info(CONSOLE_CATEGORY, `CREATING SPG NFT COLLECTION.  Setting isStreaming to: TRUE`);

				// Reset the spinner's seconds display.
				resetSpinner();

				// Set the busy flag.
				setIsStreaming(true)

				// Create a new SPG NFT collection.
				const bIsSuccess =
					await useUserBlockchainPresenceObj.createSpgNftCollection(
						'Livepeer Image Helper',
						'LIH'
					)

				console.info(CONSOLE_CATEGORY, `SPG NFT COLLECTION CREATED.  Setting isStreaming to: FALSE`);

				setIsStreaming(false)

				if (!bIsSuccess) {
					throw new Error(`The attempt to create an SPG NFT collection failed.`);
				}

				// Tell the back-end server to immediately update its
				//  image of the user's blockchain presence object.
				const bIsUpdateSuccessful =
					await requestStoreUserBlockchainPresenceObject(
						useUserBlockchainPresenceObj)

				if (!bIsUpdateSuccessful)
					throw new Error(`The back-end server reported a failure while saving the user's blockchain presence object.`);

				setStateText(`Story Protocol Gateway collection successfully created!`)

				console.info(CONSOLE_CATEGORY, `The creation of a SPG NFT collection for public address(${useUserBlockchainPresenceObj.publicAddress}) succeeded and the user's blockchain presence object has been updated with those details.`);

				// -------------------- END  : CREATE SPG NFT collection ------------
			} else {
				// -------------------- BEGIN: SPG NFT collection already exists ------------

				// Yes. Skip to NFT minting and register step.
				console.info(CONSOLE_CATEGORY, `A SPG NFT collection already exists for the current user/public address pair.`);

				// -------------------- END  : SPG NFT collection already exists ------------
			}

			setStateText(`Minting NFT and registering it on the Story Protocol network.`)

			// Call the method that mints and registers the NFT.

			console.info(CONSOLE_CATEGORY, `MINTING NFT.  Setting isStreaming to: TRUE`);

			// Reset the spinner's seconds display.
			resetSpinner();

			// Set the busy flag.
			setIsStreaming(true);

			if (!licenseResponseObj)
				throw new Error(`The licenseResponseObj variable is unassigned.`);

			const mintAndRegisterResponseObj =
				await useUserBlockchainPresenceObj.mintAndRegisterNft(imageDetailsForNftMinting, licenseResponseObj);

			setStateText(`NFT successfully minted!  Opening explorer page in 30 seconds.`)

			// Recover the user blockchain presence object.
			const userBlockchainPresenceObj_after_mint =
				UserBlockchainPresence.fromJsonString(imageDetailsForNftMinting.user_blockchain_presence_stringified)

			console.info(CONSOLE_CATEGORY, `NFT MINTED.  Setting isStreaming to: FALSE`);

			setIsStreaming(false)

			console.log(`Adding NFT to user's list of owned NFTs.`)

			// Add the new NFT to the user's collection.
			userBlockchainPresenceObj_after_mint.addNftDetailsIntoSpgCollection(mintAndRegisterResponseObj)


			// Get the explorer page URL for the most recently created
			//  NFT.
			const explorerPageUrl =
				userBlockchainPresenceObj_after_mint.getNftExplorerPageUrl()

			// Open the explorer page in 30 seconds, to give the explorer
			//  website time to process our new NFT.

			console.info(CONSOLE_CATEGORY, `OPENING EXPLORER PAGE.  Setting isStreaming to: TRUE`);

			// Reset the spinner's seconds display.
			resetSpinner();

			// Set the busy flag.
			setIsStreaming(true);

			setTimeout(() => {
					console.info(CONSOLE_CATEGORY, `EXPLORER PAGE TIME-OUT .  Setting isStreaming to: FALSE`);

					setIsStreaming(false)

					// Open the page now.
					openExplorerPage(explorerPageUrl)
				},
				3000) // Set this to longer in production.

			// Tell the back-end server to update its image of the
			//  user's blockchain presence object.
			// Tell the back-end server to immediately update its
			//  image of the user's blockchain presence object.
			const bIsUpdateSuccessful =
				await requestStoreUserBlockchainPresenceObject(
					userBlockchainPresenceObj_after_mint)

			if (!bIsUpdateSuccessful)
				throw new Error(`The back-end server reported a failure while saving the user's blockchain presence object after NFT minting succeeded.`);

			console.info(CONSOLE_CATEGORY, `Successfully minted new NFT.`);
		} else {
			console.info(CONSOLE_CATEGORY, `Ignoring request to minting token on Story Protocol network because an image has not been generated yet.`);
		}
	}

	/**
	 * This function is called when the user clicks the mint
	 *  NFT on Story Protocol button.  It prepares the
	 *  pipeline for a new license assistant chat.
	 */
	const doLicenseAssistantBeforeMinting = () => {
		// Set the new session flag since this is a new NFT.
		bIsNewLicenseSession.current = true;

		// Change the chatbot name so the license assistant
		//  floating form appears.
		setChatbotName(EnumChatbotNames.LICENSE_ASSISTANT);

		// Having trouble with showing the license
		//  assistant form.
		setLicenseAssistantVisibility(true)
	}

	/**
	 * This function is called from the ReaderToolbar when the
	 *  user changes the active image in the image carousel.
	 */
	const doActiveImageChange = (
		imageUrlOfActiveImage: string,
		dimensions:
			{
				width: number,
				height: number
			}) => {
		if (imageUrlOfActiveImage.length > 0) {
			console.info(CONSOLE_CATEGORY, `The active image URL has changed to:\n${imageUrlOfActiveImage}, width: ${dimensions.width}px, height: ${dimensions.height}px`);

			activeImageUrl = imageUrlOfActiveImage
			activeImageDimensions = dimensions
		}
	}

	/**
	 * Build the full Twitter share intent URL from the Twitter
	 *  share payload received from the back-end server.
	 *
	 * @param twitterSharePayload - The Twitter share payload
	 *  received from the back-end server
	 */
	const buildImageShareForTwitterUrl = function(
		twitterSharePayload: TwitterCardDetails
	): string {

		const { tweet_text, twitter_card_url, hash_tags_array } = twitterSharePayload

		// Validate tweet_text
		if (!tweet_text || tweet_text.trim().length === 0) {
			throw new Error("tweet_text cannot be an empty string.");
		}

		// Validate url_to_twitter_card
		if (!twitter_card_url || twitter_card_url.trim().length === 0) {
			throw new Error("twitter_card_url cannot be an empty string.");
		}

		// Ensure url_to_twitter_card is a valid URL and uses HTTPS protocol
		let parsedUrl;

		try {
			parsedUrl = new window.URL(twitter_card_url);
		} catch (err) {
			throw new Error(`url_to_twitter_card is not a valid URL: ${twitter_card_url}`);
		}
		if (parsedUrl.protocol !== "https:") {
			throw new Error(`url_to_twitter_card must use the HTTPS protocol: ${twitter_card_url}`);
		}

		// Construct the full URL to open the Twitter share dialog
		//  with the embedded twitterCardUrl that sends the Twitter
		//  share intent server to our GET URL for Twitter card
		//  metadata.

		// Encode the tweet text (postText) separately from the URL
		const textParam = `text=${encodeURIComponent(tweet_text)}`;

		// Validate, trim, and encode hashtags (comma-separated)
		const hashtagsParam = hash_tags_array.length > 0
			? `&hashtags=${encodeURIComponent(
				hash_tags_array
					.map(tag => tag.trim())  // Trim each hashtag
					.filter(tag => tag.length > 0)  // Filter out empty strings
					.join(',')
			)}`
			: '';

		// Include the twitterCardUrl as the URL query parameter (Twitter will use this to fetch metadata)
		// const urlParam = `&url=${twitter_card_url}`;
		const urlParam = `&url=${encodeURIComponent(twitter_card_url)}`;

		// Construct and return the full Twitter intent URL
		// const fullShareUrl = `${twitterShareBaseUrl}?${textParam}${urlParam}${hashtagsParam}`;

		const tweetText = encodeURIComponent(tweet_text);
		// const url = encodeURIComponent("https://sidekickrpg.ngrok.app/twitter-card/7f3689e2");
		// const hashtags = encodeURIComponent("AIArt");
		const twitterShareBaseUrl = "https://twitter.com/intent/tweet";

		// Add a line break (%0A) before the URL
		// const fullShareUrl = `${twitterShareBaseUrl}?text=${tweetText}&hashtags=${hashtags}%0A%0A${urlParam}%0A`;
		const fullShareUrl = `${twitterShareBaseUrl}?text=${tweetText}%0A-- Powered by @SambaNovaAI and @Livepeer %0A${urlParam}%0A`;

		console.info(CONSOLE_CATEGORY, `Full Twitter share URL built:\n${fullShareUrl}`)

		return fullShareUrl
	}

	/**
	 * Opens a new window/tab for the user where they can
	 * see the preset Tweet we created for them based on
	 * their last generated image.
	 *
	 * @param twitterCardDetails - The Twitter share payload sent
	 *  to us by the back-end server in response to our
	 *  share image on Twitter request.
	 */
	const openTwitterShare = (twitterCardDetails: TwitterCardDetails) => {

		// Open Twitter's share dialog in a new tab
		const openInNewTab = (url: string) => {
			const a = document.createElement('a');
			a.href = url;
			a.target = '_blank';
			a.rel = 'noopener noreferrer';  // Apply rel attributes for security
			a.click();  // Programmatically trigger the click
		};

		if (typeof window !== "undefined") {
			// Open the constructed Twitter share URL in a new tab

			console.info(`Sharing image on Twitter. twitterSharePayload object:`);
			console.dir(twitterCardDetails, {depth: null, colors: true});

			const fullShareUrl =
				buildImageShareForTwitterUrl(twitterCardDetails)
			openInNewTab(fullShareUrl);
		}
	};

	/**
	 * Opens a new window/tab for the user where they can
	 * see the explore page for an NFT.
	 *
	 * @param explorerPageUrl - The URL to the correct
	 *  explorer page.
	 */
	const openExplorerPage = (explorerPageUrl: string) => {
		if (explorerPageUrl.length < 1)
			throw new Error(`The explorerPageUrl parameter is empty.`);

		// Open the explorer page in a new tab
		const openInNewTab = (url: string) => {
			const a = document.createElement('a');
			a.href = url;
			a.target = '_blank';
			a.rel = 'noopener noreferrer';  // Apply rel attributes for security
			a.click();  // Programmatically trigger the click
		};

		if (typeof window !== "undefined") {
			// Open the explorer page URL in a new tab

			console.info(`Opening NFT explorer page, URL:\n${explorerPageUrl}`);

			openInNewTab(explorerPageUrl);
		}
	};

	/**
	 * This is the main MESSAGE handler for the viewport.  It processes
	 *  messages received from the back-end server.
	 */
	useEffect(() => {
		if (lastMessage !== null) {
			if (typeof lastMessage.data !== "string")
				return;

			const data = JSON.parse(lastMessage.data) as ServerMessage;

			// We use the receipt of a new message
			//  as a convenient time to clear any error message
			//  displaying.
			setErrorMessage('');

			if (data.type === "json_response_object_stringified") {
				// -------------------- BEGIN: STRINGIFIED JSON RESPONSE OBJECTS FROM THE BACK-END SERVER ------------

				const jsonContainerObj =
					JSON.parse(data.payload as string) as JsonObjectAndTypeResponseObject;

				if (jsonContainerObj.json_type === "license_response")
				{
					// This is a response from the back-end server that contains
					//  the JSON object output by the LLM from the most recent
					//  chat volley.
					const licenseResponseObj: LicenseAssistantNuevoResponse =
						jsonContainerObj.json_object;

					// Save it.
					setLicenseResponseObj(licenseResponseObj);

					// Show the next question the LLM wants to ask the
					//  user.
					setLicenseAssistantText(licenseResponseObj.next_question);

					if (licenseResponseObj.license_terms_explained) {
						setLicenseAssistantExplainerText(licenseResponseObj.license_terms_explained)
					}

					/*
					// If we have updated license explanation text
					//  show it in the license terms explanation
					//  textarea.
					if (licenseResponseObj.license_terms_explained && licenseResponseObj.license_terms_explained.length > 0) {
						setLicenseAssistantExplainerText(licenseResponseObj.license_terms_explained)
					}

					// Show the response text in the license assistant floating
					//  chatbot.
					setLicenseAssistantText(licenseResponseObj.system_prompt);
					 */
				} else {
					throw new Error(`Unknown stringified json object type received from the back-end server: ${jsonContainerObj.json_type}`);
				}

				// -------------------- END  : STRINGIFIED JSON RESPONSE OBJECTS FROM THE BACK-END SERVER ------------
			}
			else if (data.type === "text") {
				const payload = data.payload as TextPayload;
				setStory((prev) => prev + payload.delta);
			}
			else if (data.type === "state") {
				const payload = data.payload as StatePayload;

				// console.info(CONSOLE_CATEGORY, `STATE CHANGE MESSAGE RECEIVED.  Setting isStreaming to: TRUE`);

				// setIsStreaming(payload.streaming_text)

				setStateText(payload.state_change_message);
			}
			else if (data.type === "image") {
				const payload = data.payload as ImagePayload;
				if (payload.urls.length > 0) {
					setShowCarousel(true);

					setImages(payload);

					console.info(CONSOLE_CATEGORY, `IMAGES RECEIVED.  Setting isStreaming to: FALSE`);

					setIsStreaming(false);
				}
			}
			else if (data.type === "share_image_on_twitter") {
				const payload = data.payload as ShareImageOnTwitterPayload;

				if (payload.url_to_twitter_card.length < 1) {
					throw new Error(`The Twitter card URL is empty.`);
				}

				// Open a new window/tab with the URL
			} else if (data.type === "twitter_card_details") {
				// -------------------- BEGIN: TWITTER CARD URL RESPONSE ------------

				// Open the constructed Twitter share URL in a new tab
				console.info(CONSOLE_CATEGORY, `Received twitter_card_details directive...`);

				const payload = data.payload as TwitterCardDetails;

				if (payload.client_user_message === EnumClientUserMessages.TWITTER_SHARE) {
					// -------------------- BEGIN: TWITTER SHARE ------------

					// Open a new tab/window with the Twitter card URL
					//  as the source URL.
					openTwitterShare(payload)

					// -------------------- END  : TWITTER SHARE ------------
				} else {
					throw new Error(`Unknown client user message: ${payload.client_user_message}`);
				}

				// -------------------- END  : TWITTER CARD URL RESPONSE ------------
			} else if (data.type === "mint_nft_image_details") {
				// -------------------- BEGIN: MINT NFT IMAGE DETAILS ------------

				// If "current" has a pending promise that is waiting for an image NFT
				//  details response from the server, then call the resolver stored in
				//  mintNftImageDetailsResolver.current to release it.
				if (mintNftImageDetailsResolver.current) {
					console.info(CONSOLE_CATEGORY, `Image details for NFT minting received.  Releasing pending promise that is waiting on it.`);

					mintNftImageDetailsResolver.current(data.payload as MintNftImageDetails);

					mintNftImageDetailsResolver.current = null; // Clear the resolver after use
				}

				// -------------------- END  : MINT NFT IMAGE DETAILS ------------
			} else if (data.type === "get_user_blockchain_presence_result") {
				// -------------------- BEGIN: RESPONSE GET USER BLOCKCHAIN PRESENCE ------------

				// If "current" has a pending promise that is waiting for an image NFT
				//  details response from the server, then call the resolver stored in
				//  mintNftImageDetailsResolver.current to release it.
				if (requestGetUserBlockchainPresenceObjectResolver.current) {
					console.info(CONSOLE_CATEGORY, `User blockchain presence object received.  Releasing pending promise that is waiting on it.`);

					// Reconstitute the user blockchain presence object.
					if (data.payload === null) {
						// New user.  No blockchain presence object yet.
						requestGetUserBlockchainPresenceObjectResolver.current(null);
					} else {
						const userBlockchainPresenceObj =
							UserBlockchainPresence.fromJsonString(data.payload as StringifiedJsonObject)

						requestGetUserBlockchainPresenceObjectResolver.current(userBlockchainPresenceObj);
					}

					mintNftImageDetailsResolver.current = null; // Clear the resolver after use
				}

				// -------------------- END  : RESPONSE GET USER BLOCKCHAIN PRESENCE ------------
			} else if (data.type === "store_user_blockchain_presence_result") {
				// -------------------- BEGIN: RESPONSE STORE USER BLOCKCHAIN PRESENCE ------------

				// If "current" has a pending promise that is waiting for an image NFT
				//  details response from the server, then call the resolver stored in
				//  mintNftImageDetailsResolver.current to release it.
				if (requestStoreUserBlockchainPresenceObjectResolver.current) {
					console.info(CONSOLE_CATEGORY, `User blockchain presence object store result received.  Releasing pending promise that is waiting on it.`);

					// This is the same as calling the original resolve function.
					const { result } = data.payload as OperationResultPayload;

					requestStoreUserBlockchainPresenceObjectResolver.current(result);

					mintNftImageDetailsResolver.current = null; // Clear the resolver after use
				}

				// -------------------- END  : RESPONSE STORE USER BLOCKCHAIN PRESENCE ------------
			} else if (data.type === "error") {
				const payload = data.payload as ErrorPayload;

				console.info(CONSOLE_CATEGORY, `ERROR RESPONSE FROM SERVER.  Setting isStreaming to: FALSE`);

				setIsStreaming(false);

				// Don't overwrite the user's input if an error
				//  occurs.
				// setPrompt(defaultPrompt);
				// setUserHasTyped(false);

				setErrorMessage(payload.error ?? "An unknown error occurred.");
				clearError();
			} else {
				throw new Error(`Invalid data type: ${data.type}`);
			}
		}
	}, [lastMessage, defaultPrompt]);

	useEffect(() => {
		if (images.urls.length > 0 && imageCarouselRef.current) {
			imageCarouselRef.current.scrollIntoView({
				behavior: "smooth",
				block: "end",
			});
		}
	}, [images]);

	// -------------------- BEGIN: HTML RENDERING ------------

	return (
		<div className="flex-container flex h-max flex-col items-center">
			<ReaderToolbar disabled={false} onGenreChange={onGenreChange} onGenreSelect={onGenreSelect} onProcessImage={doProcessImage} doShareImageOnTwitter={doShareImageOnTwitter} doMintTokenOnStoryProtocol={doLicenseAssistantBeforeMinting} />
			<div
				className="my-2 flex w-max grid-cols-[1fr_1fr] items-center justify-center gap-2 text-center sm:w-screen">
				<div className="flex w-48">
					<Badge color={badgeColor()}>SOCKET: {connectionStatus}</Badge>
				</div>
				{/*
				<div className="flex w-48">
					<Badge color="teal"
						   className="sm:opacity-0">GENRE: {genreList[genre as keyof typeof genreList]}</Badge>
				</div>
				*/}
			</div>
			<div className={errorMessage ? "opacity-90" : "opacity-0"}>
				<Callout.Root size="1" color="yellow">
					<Callout.Icon><Frown/></Callout.Icon>
					<Callout.Text>{errorMessage}</Callout.Text>
				</Callout.Root>
			</div>

			<div id="state-text"
				 className="w-[500px] mx-auto text-center px-12 text-justify font-medium text-red-400 animate-pulse-brightness"
				 style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#ffcccc"}}>
				{stateText}
			</div>
			<div className={`grid items-center justify-center ${isStreaming ? "opacity-90" : "opacity-0"}`}>
				<EnhancedSpinner ref={spinnerRef} isStreaming={isStreaming} updateIntervalSecs={SPINNER_INTERVAL_SECONDS} spinnerSize={"3"} spinnerClasses="mt-3"/>
			</div>

			<div className="w-max flex flex-col items-center justify-start">
				<ChatbotInteractionFloating ref={cbLicenseAssistantRef} titleText={'Story Protocol License Assistant'}  onTakeAction={onLicenseAssistantTakeAction} handleStoryProtocolClick={doMintTokenOnStoryProtocol} handleBackButtonClick={doHandleBackButtonClick}  stateText={stateText} isStreaming={isStreaming}  />
			</div>

			<div className="w-max flex flex-col items-center justify-start">
				<div id="prompt-input-container-image-assistant" className="mt-4 pb-4">
					<PromptInput onChange={onPromptUpdate} value={prompt} onTakeAction={doMakeImage}/>
				</div>

				{/* Image carousel */}
				<div
					id="image-carousel-container"
					ref={imageCarouselRef}
					className={`flex h-[320px] items-center justify-center pb-20 mt-4 ${
						showCarousel ? "block" : "hidden"
					}`}
				>
					<ImageViewer imageUrls={images.urls} onActiveImageChange={doActiveImageChange}/>
				</div>

				{/* Story text */}
				<div
					id="story-text"
					className="w-[500px] mx-auto whitespace-pre-wrap px-12 pb-4 pt-4 text-justify font-medium"
				>
					{story}
				</div>
			</div>

		</div>
	);
	// -------------------- END  : HTML RENDERING ------------

}
