// This section contains the client user messages
//  we pass to the back-end server when we make
//  a request, that are  returned to us in the
//  response payload.

// -------------------- BEGIN: EnumClientUserMessages ------------

/**
 *
 * An enumerator that has the different client side user message values

 *
 * @type {Readonly<{string}>}
 */
export enum EnumClientUserMessages
{
    "TWITTER_SHARE" = "twitter_share",
    "MINT_NFT" = "mint_nft",
}

// -------------------- END  : EnumClientUserMessages ------------
