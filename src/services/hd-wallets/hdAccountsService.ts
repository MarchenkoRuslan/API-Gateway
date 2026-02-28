import {
    Account
} from 'symbol-sdk';
import { ExtendedKey, Network, Wallet } from 'symbol-hd-wallets';
import { keyGeneratorService } from "./keyGeneratorService"

import { Constants } from "../../helpers/constants";

const networkName = Constants.NETWORK_IDENTIFIER;

export class HdAccountsService {

    /**
     * Getting a hyper-deterministic wallets child account
     * @param accountNumber account number
     * @param keychain external - 0 or internal - 1
     * @param addressNumber address number
     * @param passPhrase (Optional) passPhrase for mnemonic
     */
    public getWalletChildAccount(accountNumber: number, keychain: number, addressNumber: number, passPhrase?: string) {
        try {

            const bip32Seed = keyGeneratorService.generateExtendedKey(passPhrase).extened_key;

            const xkey = ExtendedKey.createFromSeed(bip32Seed.toString("hex"), Network.SYMBOL);

            const wallet = new Wallet(xkey);

            // derive specific child path
            const childAccountPrivateKey = wallet.getChildAccountPrivateKey(`m/44\'/4343\'/${accountNumber}\'/${keychain}\'/${addressNumber}\'`);

            const account = Account.createFromPrivateKey(
                childAccountPrivateKey,
                networkName,
            );

            return {
                child_account: {
                    account_number: accountNumber,
                    keyChain: keychain,
                    address_number: addressNumber,
                    address: account.address.plain(),
                    public_key: account.publicKey,
                    private_key: account.privateKey,
                }
            }
        }
        catch (e) {
            console.log(e);
            return e;
        }
    }
}

export const hdAccountsService = new HdAccountsService();