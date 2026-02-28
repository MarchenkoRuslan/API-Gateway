
import { MnemonicPassPhrase } from 'symbol-hd-wallets';

export class KeyGeneratorService {

    /**
     * Generate Mnemonic Pass phrase with given language and strength
     * @param language (Optional) The language used for the wordlist
     * @param strength (Optional) Strength of mnemonic pass phrase (% 32 == 0)
     * @returns mnemonic: MnemonicPassPhrase
     */
    public generatePassPhrase(language?: string, strength?: number): MnemonicPassPhrase {
        try {
            let mnemonic: MnemonicPassPhrase;
            // Check
            if (language !== undefined && strength !== undefined) {
                mnemonic = MnemonicPassPhrase.createRandom(language, strength);
            }
            else if (language === undefined && strength === undefined) {
                mnemonic = MnemonicPassPhrase.createRandom();
            }
            else if (language !== undefined && strength === undefined) {
                mnemonic = MnemonicPassPhrase.createRandom(language);
            }
            else if (language === undefined && strength !== undefined) {
                mnemonic = MnemonicPassPhrase.createRandom(undefined, strength);
            }

            return mnemonic;
        }

        catch (e) {
            console.log(e);
            return e;
        }
    }

    /**
     * Generate a password-protected mnemonic pass phrase secureSeedHex
     * @param password (Optional) Password for seed
     * @param passPhrase (Optional) passPhrase for mnemonic
     * @param language (Optional) The language used for the wordlist
     * @param strength (Optional) Strength of mnemonic pass phrase (% 32 == 0)
     * @returns pass_phrase: mnemonic.plain,
     * @returns used_password: password,
     * @returns secure_seed_hex: secureSeedHex
     */
    public generateSeedHex(password?: string, passPhrase?: string, language?: string, strength?: number) {
        try {
            // Check if passPhrase was given
            let mnemonic: MnemonicPassPhrase;
            if (passPhrase === undefined) {
                mnemonic = new MnemonicPassPhrase(this.generatePassPhrase(language, strength).plain);
            }
            else {
                mnemonic = new MnemonicPassPhrase(passPhrase);
            }

            // Check if password was given
            let secureSeedHex: Buffer;
            if (password === undefined) {
                secureSeedHex = mnemonic.toSeed();
                password = "mnemonic"
            }
            else {
                secureSeedHex = mnemonic.toSeed(password);
            }

            return {
                pass_phrase: mnemonic.plain,
                used_password: password,
                secure_seed_hex: secureSeedHex.toString("hex")
            }
        }
        catch (e) {
            console.log(e);
            return e;
        }
    }

    /**
     * Generate a root (master) extended key
     * @param passPhrase (Optional) passPhrase for mnemonic
     * @param language (Optional) The language used for the wordlist
     * @param strength (Optional) Strength of mnemonic pass phrase (% 32 == 0)
     * @returns pass_phrase: mnemonic.plain,
     * @return extened_key: bip32Seed
     */
    public generateExtendedKey(passPhrase?: string, language?: string, strength?: number) {
        try {
            // Check if passPhrase was given
            let mnemonic: MnemonicPassPhrase;
            if (passPhrase === undefined) {
                mnemonic = new MnemonicPassPhrase(this.generatePassPhrase(language, strength).plain);
            }
            else {
                mnemonic = new MnemonicPassPhrase(passPhrase);
            }

            const bip32Seed = mnemonic.toSeed();

            return {
                pass_phrase: mnemonic.plain,
                extened_key: bip32Seed.toString("hex")
            }
        }
        catch (e) {
            console.log(e);
            return e;
        }
    }
}


export const keyGeneratorService = new KeyGeneratorService();