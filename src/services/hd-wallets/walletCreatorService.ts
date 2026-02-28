import {
    Account
} from 'symbol-sdk';
import { ExtendedKey, Network, Wallet } from 'symbol-hd-wallets';
import { KeyGeneratorService } from "./keyGeneratorService"
import { Constants } from "../../helpers/constants";

const networkName = Constants.NETWORK_IDENTIFIER;

export class WalletCreatorService {

    /**
     * Creating a hyper-deterministic wallet with provided passPhrase or if not provided - generates
     * random pass phrase
     * @param passPhrase (Optional) passPhrase for mnemonic
     * @param language (Optional) The language used for the wordlist
     * @param strength (Optional) Strength of mnemonic pass phrase (% 32 == 0)
     * @returns pass_phrase, master_account, default_account, child_account
     */
    public createDeterministicWallet(passPhrase?: string, language?: string, strength?: number) {
        try {
            const keyGeneratorService = new KeyGeneratorService();
            const response = keyGeneratorService.generateExtendedKey(passPhrase, language, strength);
            const bip32Seed = response.extened_key;

            const xkey = ExtendedKey.createFromSeed(bip32Seed.toString("hex"), Network.SYMBOL);

            const wallet = new Wallet(xkey);
            const account = Account.createFromPrivateKey(
                wallet.getAccountPrivateKey().toLocaleUpperCase(),
                networkName,
            );

            return {
                pass_phrase: response.pass_phrase,
                master_account: {
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


export const walletCreatorService = new WalletCreatorService();