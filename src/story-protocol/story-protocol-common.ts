// -------------------- BEGIN: STORY PROTOCOL ------------

// We assign this value to Hex fields when we don't have
//  an actual value yet.  This is a "sentinel" value.
import {Hex} from "viem";

export type EthereumProvider = { request(...args: unknown[]): Promise<unknown> }

export const HEX_UNINITIALIZED_VALUE = '0x';

/**
 * This function returns TRUE if the given hex value is
 *  uninitialized, FALSE if it has an actual value.
 *
 * @param hexValue - The hex value to inspect.
 */
export function isHexUninitializedValue(hexValue: Hex) {
    return hexValue === HEX_UNINITIALIZED_VALUE
}

/**
 * These are the fields we need to know about when interacting
 *  with an SPG NFT collection
 */
export interface SpgNftCollectionDetails {
    // The name given to the SPG NFT collection
    name: string,
    // They symbol assigned to the SPG NFT collection
    symbol: string,
    // The contract hash for the SPG NFT collection
    //  smart contract
    contract_address: Hex
    // The transaction hash of the transaction that
    //  submitted the SPG NFT collection to the
    //  blockchain.
    tx_hash: string
}

// -------------------- END  : STORY PROTOCOL ------------
