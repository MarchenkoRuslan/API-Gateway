import {
    Account,
    AggregateTransaction,
    Deadline,
    HashLockTransaction,
    Mosaic,
    MosaicId,
    MultisigAccountModificationTransaction,
    PublicAccount,
    UnresolvedAddress,
    UInt64,
} from 'symbol-sdk';

import { BlockchainListener } from "../../../helpers/transactionListener";
import '../../../../utils/env-config';
import { Constants } from '../../../helpers/constants';
import { Writer } from '../../../helpers/writer';
import { ErrorHandler } from '../../../helpers/errorHandler';

// Environment variables
const networkGenerationHash = process.env.nemesisGenerationHash;
const networkName = Constants.NETWORK_IDENTIFIER;

const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;

// symbol.xym id
const networkCurrencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);

/**
 * Class to handle Create Multisig transactions
 */
export class CreateMultisigService {

    private cosignHash: string;
    private signedHash: string;

    /**
     * Getter $cosignHash
     * @return {string}
     */
    public get $cosignHash(): string {
        return this.cosignHash;
    }

    /**
     * Setter $cosignHash
     * @param {string} value
     */
    public set $cosignHash(value: string) {
        this.cosignHash = value;
    }

    /**
     * Getter $signedHash
     * @return {string}
     */
    public get $signedHash(): string {
        return this.signedHash;
    }

    /**
     * Setter $signedHash
     * @param {string} value
     */
    public set $signedHash(value: string) {
        this.signedHash = value;
    }

    /**
     * Convert account to multisig account.
     * @param multisigAccount Account, which will be converted to multisig
     * @param cosignatoriesList Accounts which will be included as multisig's cosignatories
     * @param $minApproval The min approval relative change
     * @param $minRemoval The min approval relative change
     * @param writer Writer object with filepath
     * @param median fee multiplier to set maxFee dynamically
     * @param errorHandler errorHandler object
     * @param script true if comes from script
     */
    public async convertToMultisig(multisigAccount: Account, cosignatoriesList: Account[], $minApproval: number, $minRemoval: number,
        writer: Writer, feeMultiplier: number, errorHandler?: ErrorHandler, script?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const additions: UnresolvedAddress[] = [];
                    for (let i = 0; i < Object.keys(cosignatoriesList).length; i++) {
                        additions.push(PublicAccount.createFromPublicKey(cosignatoriesList[i].publicKey, networkName).address);
                    }

                    const multisigAccountModificationTransaction = MultisigAccountModificationTransaction.create(
                        Deadline.create(epochAdjustment),
                        $minApproval,
                        $minRemoval,
                        additions,
                        [],
                        networkName,
                    );

                    const aggregateTransaction = AggregateTransaction.createBonded(
                        Deadline.create(epochAdjustment),
                        [multisigAccountModificationTransaction.toAggregate(multisigAccount.publicAccount).setMaxFee(feeMultiplier)],
                        networkName,
                        [],
                        UInt64.fromUint(maxFee)
                    ).setMaxFeeForAggregate(feeMultiplier, cosignatoriesList.length);

                    const cosignTransaction = multisigAccount.sign(
                        aggregateTransaction,
                        networkGenerationHash
                    );
                    this.$cosignHash = cosignTransaction.hash;
                    
                    const hashLockTransaction = HashLockTransaction.create(
                        Deadline.create(epochAdjustment),
                        new Mosaic(
                            networkCurrencyMosaicId,
                            UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
                        ),
                        UInt64.fromUint(480),
                        cosignTransaction,
                        networkName,
                    ).setMaxFee(feeMultiplier);

                    const signedHashLockTransaction = multisigAccount.sign(
                        hashLockTransaction,
                        networkGenerationHash,
                    );
                    this.signedHash = signedHashLockTransaction.hash;

                    const listener1 = new BlockchainListener(cosignTransaction, multisigAccount.address, signedHashLockTransaction);

                    if (script) {
                        listener1.createListenerBonded(writer, errorHandler)
                            .then((result) => {
                                const hash = 'cosignHash';
                                result[hash] = cosignTransaction
                                resolve(result)
                            });
                    }
                    else {
                        listener1.createListenerBonded(writer)
                            .then((result) => {
                                if (result.group === "partial") {
                                    resolve(result);
                                }
                                else if (result.group === "failed") {
                                    reject(result.code);
                                }
                            });
                    }
                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }
            }, 0)
        })
    }
}

export const createMultisigService = new CreateMultisigService();