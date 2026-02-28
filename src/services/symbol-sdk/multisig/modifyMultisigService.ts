import {
    Account,
    AggregateTransaction,
    Deadline,
    PublicAccount,
    InnerTransaction,
    HashLockTransaction,
    MultisigAccountModificationTransaction,
    Mosaic,
    MosaicId,
    UnresolvedAddress,
    UInt64
} from 'symbol-sdk';

import { BlockchainListener } from "../../../helpers/transactionListener";
import { TransactionAnouncer } from "../../../helpers/transactionAnouncer";
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
 * Class to handle Multisig Modifying Transactions
 */
export class ModifyMultisigService {

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
     * Modify Multisig Account. Uses Aggregate Complete transaction
     * @param multisigAccountPublicKey Multisig Account, which is going to be modified, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param minApproval The min approval relative change
     * @param minRemoval The min removal relative change
     * @param newCosignatoryPublicKey Account, which is going to be added as Multisig cosignatory, Public Key
     * @param cosignatoryToRemovePublicKey Account, which is going to be removed from Multisig Cosignatories list, Public Key
     * @param writer Writer object with filepath
     * @param errorHandler errorHandler object
     */
    public modifyMultisigComplete(multisigAccountPublicKey: string, cosignatoryPrivateKey: string, minApproval: number,
                                  minRemoval: number, newCosignatoryPublicKey: string, cosignatoryToRemovePublicKey: string, writer: Writer,
                                  errorHandler?: ErrorHandler) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const signer = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);
                const additions: UnresolvedAddress[] = [];
                const deletions: UnresolvedAddress[] = [];

                if (!newCosignatoryPublicKey === undefined) {
                    const newCosignatoryAccount = PublicAccount.createFromPublicKey(newCosignatoryPublicKey, networkName);
                    additions.push(newCosignatoryAccount.address);
                }

                if (!cosignatoryToRemovePublicKey === undefined) {
                    const cosignatoryToRemove = PublicAccount.createFromPublicKey(cosignatoryToRemovePublicKey, networkName);
                    deletions.push(cosignatoryToRemove.address);
                }

                const multisigAccountModificationTransaction = MultisigAccountModificationTransaction.create(
                    Deadline.create(epochAdjustment),
                    minApproval,
                    minRemoval,
                    additions,
                    deletions,
                    networkName
                );

                const transactionsList: InnerTransaction[] = [multisigAccountModificationTransaction.toAggregate(multisigAccount)];

                const aggregateTransaction = AggregateTransaction.createComplete(
                    Deadline.create(epochAdjustment),
                    transactionsList,
                    networkName,
                    [],
                    UInt64.fromUint(maxFee)
                );

                const signedTransaction = signer.sign(aggregateTransaction, networkGenerationHash);

                const listener = new BlockchainListener(signedTransaction, signer.address);
                listener.createListener(writer, errorHandler)
                    .then((result) => resolve(result));

                const announcer = new TransactionAnouncer(signedTransaction);

                announcer.announceTransaction(writer);
            }, 0)
        })
    }

    /**
     * Modify Multisig Account. Uses Aggregate Bonded transaction
     * @param multisigAccountPublicKey Multisig Account, which is going to be modified, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param minApproval The min approval relative change
     * @param minRemoval The min removal relative change
     * @param newCosignatoryPublicKey Account, which is going to be added as Multisig cosignatory, Public Key
     * @param cosignatoryToRemovePublicKey Account, which is going to be removed from Multisig Cosignatories list, Public Key
     * @param errorHandler errorHandler object
     * @param writer Writer object with filepath
     *  @param script true if comes from script
     */
    public async modifyMultisigBonded(multisigAccountPublicKey: string, cosignatoryPrivateKey: string, minApproval: number,
                                      minRemoval: number, newCosignatoryPublicKey: string, cosignatoryToRemovePublicKey: string, writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {

                    const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                    const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);
                    const additions: UnresolvedAddress[] = [];
                    const deletions: UnresolvedAddress[] = [];

                    if (newCosignatoryPublicKey !== undefined) {
                        const newCosignatoryAccount = PublicAccount.createFromPublicKey(newCosignatoryPublicKey, networkName);
                        additions.push(newCosignatoryAccount.address);
                    }

                    if (cosignatoryToRemovePublicKey !== undefined) {
                        const cosignatoryToRemove = PublicAccount.createFromPublicKey(cosignatoryToRemovePublicKey, networkName);
                        deletions.push(cosignatoryToRemove.address);
                    }

                    const multisigAccountModificationTransaction = MultisigAccountModificationTransaction.create(
                        Deadline.create(epochAdjustment),
                        minApproval,
                        minRemoval,
                        additions,
                        deletions,
                        networkName
                    );

                    const transactionsList: InnerTransaction[] = [multisigAccountModificationTransaction.toAggregate(multisigAccount)];

                    const aggregateTransaction = AggregateTransaction.createBonded(
                        Deadline.create(epochAdjustment),
                        transactionsList,
                        networkName,
                        [],
                        UInt64.fromUint(maxFee)
                    );

                    const cosignTransaction = cosignatoryAccount.sign(
                        aggregateTransaction,
                        networkGenerationHash);

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
                        UInt64.fromUint(maxFee),
                    );


                    const signedHashLockTransaction = cosignatoryAccount.sign(
                        hashLockTransaction,
                        networkGenerationHash);

                    this.$signedHash = signedHashLockTransaction.hash;

                    const listener = new BlockchainListener(cosignTransaction, cosignatoryAccount.address, signedHashLockTransaction);
                    listener.createListenerBonded(writer)
                        .then((result) => {
                            if (result.group === "partial") {
                                resolve(result);
                            }
                            else if (result.group === "failed") {
                                reject(result.code);
                            }
                        });
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Modify Multisig Account. Uses Aggregate Bonded transaction
     * @param multisigAccountPublicKey Multisig Account, which is going to be modified, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param minApproval The min approval relative change
     * @param minRemoval The min removal relative change
     * @param newCosignatoryPublicKeysList Accounts, which are going to be added as Multisig cosignatory, Public Keys
     * @param cosignatoryToRemovePublicKeysList Accounts, which are going to be removed from Multisig Cosignatories list, Public Keys
     * @param errorHandler errorHandler object
     * @param writer Writer object with filepath
     *  @param script true if comes from script
     */
    public async modifyMultisigWithManyAccountsBonded(multisigAccountPublicKey: string, cosignatoryPrivateKey: string, minApproval: number,
                                                      minRemoval: number, newCosignatoryPublicKeysList: string, cosignatoryToRemovePublicKeysList: string, writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {

                    const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                    const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);
                    const additions: UnresolvedAddress[] = [];
                    const deletions: UnresolvedAddress[] = [];

                    if (newCosignatoryPublicKeysList !== undefined) {
                        for (const newCosignatoryPublicKey of newCosignatoryPublicKeysList) {
                            const newCosignatoryAccount = PublicAccount.createFromPublicKey(newCosignatoryPublicKey, networkName);
                            additions.push(newCosignatoryAccount.address);
                        }
                    }

                    if (cosignatoryToRemovePublicKeysList !== undefined) {
                        for (const cosignatoryToRemovePublicKey of cosignatoryToRemovePublicKeysList){
                            const cosignatoryToRemove = PublicAccount.createFromPublicKey(cosignatoryToRemovePublicKey, networkName);
                            deletions.push(cosignatoryToRemove.address);
                        }
                    }

                    const multisigAccountModificationTransaction = MultisigAccountModificationTransaction.create(
                        Deadline.create(epochAdjustment),
                        minApproval,
                        minRemoval,
                        additions,
                        deletions,
                        networkName
                    );

                    const transactionsList: InnerTransaction[] = [multisigAccountModificationTransaction.toAggregate(multisigAccount)];

                    const aggregateTransaction = AggregateTransaction.createBonded(
                        Deadline.create(epochAdjustment),
                        transactionsList,
                        networkName,
                        [],
                        UInt64.fromUint(maxFee)
                    );

                    const cosignTransaction = cosignatoryAccount.sign(
                        aggregateTransaction,
                        networkGenerationHash);

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
                        UInt64.fromUint(maxFee),
                    );

                    const signedHashLockTransaction = cosignatoryAccount.sign(
                        hashLockTransaction,
                        networkGenerationHash);

                    this.$signedHash = signedHashLockTransaction.hash;

                    const listener = new BlockchainListener(cosignTransaction, cosignatoryAccount.address, signedHashLockTransaction);
                    listener.createListenerBonded(writer)
                        .then((result) => {
                            if (result.group === "partial") {
                                resolve(result);
                            }
                            else if (result.group === "failed") {
                                reject(result.code);
                            }
                        });
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }
}

export const modifyMultisigService = new ModifyMultisigService();
