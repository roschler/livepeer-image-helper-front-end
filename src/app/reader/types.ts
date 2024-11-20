import {EnumClientUserMessages} from "@/client-constants/client-user-messages";
import {Hex} from "viem";

// -------------------- BEGIN: IMAGE PROCESSING MODES ------------

// This enum holds the known image processing modes.
export enum EnumImageProcessingModes {
	// User wants a new image.
	"NEW" = "new",
	// Fix problems with an images content.
	"REFINE" = "refine",
	// Enhance an image to make it more interesting.
	"ENHANCE" = "enhance"
}

// -------------------- END  : IMAGE PROCESSING MODES ------------

// We use this type to cover all the plain JSON objects
//  we receive from the back-end object.
export type PlainJsonObject = Record<string, unknown>;

// Stringified JSON objects.
export type StringifiedJsonObject = string;

// This interface describes the JSON object we tell the license assistant
//  LLM to produce.
//
// NOTE: Remember to update this object if the back-end serve changes
//  the interface!
export interface LicenseTermsLlmJsonResponse
{
	system_prompt: string; // <This is the answer you have crafted for the user>,
	pil_terms: unknown; // <This is the PilTerms JSON object.  Any values you were able to determine during the chat volley should be assigned to the related field or fields.>
	is_user_satisfied_with_license_terms: boolean; // <This should be TRUE if the user indicated they are satisfied with the current terms of the license, FALSE if not.>
	license_terms_explained: string; // The current friendly explanation of the license terms the user has specified so far.
}

// This is the new interface the LLM returns.  We are using a more
//  powerful LLM model than before.
//
// NOTE: Remember to update this object if we change the license assistant
//  LLM system prompt and to update it on the client front-end as well!
export interface LicenseAssistantNuevoResponse
{
	// This is the license type the LLM has determined
	//  is the best match for the user.
	best_license_guess: string,
	// This is the LLM's confidence in it's license guess.
	confidence: string,
	// This is the next question to ask the user.
	next_question: string
	// The current friendly explanation of the license terms the user has specified so far.
	license_terms_explained: string;
	// TRUE if the LLM has received an answer at least one
	//  YES/TRUE answer to a license choice confirmation
	//  question, FALSE if not.
	is_license_choice_confirmed: boolean;
	// For commercial licenses, the minting fee for the license.
	defaultMintingFee: number;
	// TRUE if commercial use is allowed, FALSE if not.
	commercialUse: boolean;
	// TRUE if derivative works are allowed, FALSE if not.
	derivativesAllowed: boolean;
	// The percentage or revenue required from a derivative works
	//  earnings, or 0 if none.
	commercialRevShare: number;
}

// This is the container object sent from the back-end server
//  that contains different kinds of stringified JSON
//  objects.
export interface StringifiedJsonResponseObject {
	json_type: string, // The type of stringified payload object this object is carrying.
	json_response_object_stringified: string // The stringified payload object.
}

export interface JsonObjectAndTypeResponseObject {
	json_type: string
	// json_object: LicenseTermsLlmJsonResponse
	json_object: LicenseAssistantNuevoResponse
}

/**
 * This interface declares the acceptable values for the
 *  ServerMessage "type" and "payload" fields.
 */
export interface ServerMessage {
	type: "state" | "text" | "audio" | "image" | "share_image_on_twitter" | "twitter_card_details" | "mint_nft_image_details" | "get_user_blockchain_presence_result" | "store_user_blockchain_presence_result" | "error" | "stringified_json_object" | "json_response_object_stringified" | "license_response"
	payload:
		| StatePayload
		| TextPayload
		| AudioPayload
		| ImagePayload
		| ShareImageOnTwitterPayload
		| TwitterCardDetails
		| OperationResultPayload
		| MintNftImageDetails
		| ErrorPayload
		| PlainJsonObject
		| StringifiedJsonObject
		| LicenseTermsLlmJsonResponse
		| StringifiedJsonResponseObject
}

/**
 * This is the generic response the back-end server sends us
 *  to report the TRUE/FALSE result of a requested operation.
 */
export interface OperationResultPayload {
	result: boolean
}

export interface StatePayload {
	streaming_audio: boolean
	streaming_text: boolean
	waiting_for_images: boolean
	state_change_message: string
}
export interface TextPayload {
	delta: string
}
export interface AudioPayload {
	chunk: string
}
export interface ImagePayload {
	urls: Array<string>
}
export interface ErrorPayload {
	error: string
}

/**
 * This is the payload for making a request to process
 *  a license assistant chat volley.
 */
export interface LicenseAssistantRequest {
	// The ID of the current user.
	user_id: string,
	// The latest user input.
	prompt: string,
	// If TRUE, then we should treat the next license
	//  assistant chat volley as the start of a new
	//  license terms session.  If FALSE, then we
	//  should treat it as an ongoing session.
	is_new_license_session: boolean
}

/**
 * This is the expected request payload for a image share
 *  on Twitter operation.
 *
 * WARNING: This interface must match the declaration
 *  used by the back-end server.
 */
export interface ShareImageOnTwitterPayload {
	// We received the URL to our back-end
	//  server that will build the Twitter card for
	//  previewing the image on the Tweet.
	url_to_twitter_card: string,

	// This field contains the custom
	//  value, if any, that the client passed
	//  to the back-end server during
	//  a request to it, in the
	//  TwitterCardDetails object.
	client_user_message: string
}

/**
 * This is the expected request payload for a request from
 *  the client front-end to mint a generated image on
 *  as an NFT.
 *
 * WARNING: This interface must match the declaration
 *  used by the client front-end.
 */
export interface MintNftRequest {
	// The ID of the user making the request.
	user_id: string,
	// The UserBlockchainPresence object for the requesting
	//  user in plain JSON format.  We will reconstitute it
	//  to a UserBlockchainPresence object.
	user_blockchain_presence_json_stringified: string,
	// The Livepeer image URL for the generated image.
	image_url: string,
	// The image dimensions.
	dimensions: ImageDimensions,

	// This field contains the custom
	//  value, if any, that the client passed
	//  to the back-end server during
	//  a request to it, in the
	//  TwitterCardDetails object.
	client_user_message: string
}

/**
 * This is the response payload we get back from the
 *  back-end server in response to our request to
 *  share an image on Twitter.  It contains the
 *  needed Twitter card URL we use to open a new
 *  window/tab for the user, with the prepared
 *  tweet, ready to share.
 *
 * WARNING: This interface must match the declaration
 *  used by the back-end server.
 *
export interface TwitterImageCardUrlResponse {
	tweet_text: string,
	url_to_twitter_card: string,
	hash_tags_array: string[]
}
*/

/**
 * This is the response payload we get back from the
 *  back-end server in response to our request to
 *  share an image on Twitter.  It contains the
 *  needed Twitter card URL we use to open a new
 *  window/tab for the user, with the prepared
 *  tweet, ready to share.
 *
 * WARNING: This interface must match the declaration
 *  used by the back-end server.
 */

export interface ImageDimensions{
	width: number,
	height: number
}

/**
 * This is the expected request payload for a request from
 *  the client front-end to share a generated image on
 *  Twitter.
 *
 * WARNING: This interface must match the declaration
 *  used by the client front-end.
 */
export interface StoreUserBlockchainPresenceRequest {
	// The user blockchain presence object to store for the
	//  given public address in stringified format.
	user_blockchain_presence_stringified: StringifiedJsonObject
}

/**
 * This is the response payload we get back from the
 *  back-end server in response to our request to
 *  share an image on Twitter.  It contains the
 *  needed Twitter card URL we use to open a new
 *  window/tab for the user, with the prepared
 *  tweet, ready to share.
 *
 * WARNING: This interface must match the declaration
 *  used by the back-end server.
 */

export interface TwitterCardDetails {
	card: string,
	tweet_text: string,
	hash_tags_array: string[],
	twitter_card_title: string,
	twitter_card_description: string,
	url_to_image: string,
	dimensions: ImageDimensions,

	// This is a copy of the full Twitter card URL
	//  that is here for convenience purposes to
	//  help the caller.
	twitter_card_url: string,

	// This field can be used by the front-end
	//  client to pass custom information back
	//  to itself.
	client_user_message: EnumClientUserMessages
}

/**
 * These are the fields required for registering and minting
 *  an NFT.
 *
 *  These interface declaration must be the same between
 *   server and client.
 */
export interface IpMetadataUrisAndHashes {
	ipMetadataURI: string;
	ipMetadataHash: Hex;
	nftMetadataURI: string;
	nftMetadataHash: Hex;
}

/**
 * This interface extends the Twitter card details object
 *  to include the fields we need for minting an NFT.
 *
 * WARNING: This interface must match the declaration
 *  used by the client front-end.
 */
export interface MintNftImageDetails extends TwitterCardDetails {
	// We add the blockchain related elements to the
	//  Twitter card details.
	user_blockchain_presence_stringified: string,

	// We return the metadata the client needs to mint and
	//  register the asset.
	ipMetadata:  IpMetadataUrisAndHashes
}

export const storyGenres = {
	magic: "Magical Wizardry",
	scifi: "Science Fiction",
	swords: "Sword & Sorcery",
	romance: "Romance Novel",
	drama: "Classic Drama",
	apocalypse: "Apocalypse Now",
	hollywood: "Hollywood Action",
	singularity: "The Singularity",
}
