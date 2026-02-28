import { NetworkType } from 'symbol-sdk';


const networkTypeMap: { [key: string]: NetworkType } = {
    "MAIN_NET": NetworkType.MAIN_NET,
    "TEST_NET": NetworkType.TEST_NET
};

const networkIdentifier = process.env.NETWORK_IDENTIFIER as string;


/**
 * Class for all constants
 */
export class Constants {
    public static NETWORK_IDENTIFIER: NetworkType = networkTypeMap[networkIdentifier] ?? NetworkType.TEST_NET;
    public static EPOCH_ADJUSTMENT: number = Number(process.env.EPOCH_ADJUSTMENT) ?? 1620136092; // Network epoch adjustment
    public static MAX_FEE: number = Number(process.env.MAX_FEE) ?? 20_000 // Network max fee ammount

    // Mosaics
    public static NETWORK_CURRENCY_MOSAIC_ID_STRING = process.env.NETWORK_CURRENCY_MOSAIC_ID_STRING ?? '535170A400D0DDA9'; // symbol.xym id
    public static NETWORK_CURRENCY_DIVISIBILITY = Number(process.env.NETWORK_CURRENCY_DIVISIBILITY) ?? 6;

    public static NETWORK_NEMESIS_PRIVATE_KEY = process.env.NETWORK_NEMESIS_PRIVATE_KEY;
    public static NETWORK_MINIMUM_LOCK_AMOUNT = Number(process.env.NETWORK_MINIMUM_LOCK_AMOUNT) ?? 10_000_000;

    public static MINIMUM_MULTISIG_CURRENCY_AMOUNT = 12_000_000; // ??

    public static MOSAIC_RENTAL_FEE = 50_000_000; // 50 symbol.xym's
    public static MOSAIC_CREATION_FEE = 130_000_000; // NFT creation fee for the platform (130 XYM)


}