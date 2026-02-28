import {
    Account,
    AggregateTransaction,
    Deadline,
    MosaicId,
    Mosaic,
    MosaicDefinitionTransaction,
    MosaicSupplyChangeTransaction,
    MosaicSupplyChangeAction,
    MosaicNonce,
    MosaicFlags,
    UInt64,
    NamespaceId,
    HashLockTransaction,
    AliasTransaction,
    AliasAction,
    PublicAccount,
    PlainMessage,
    TransferTransaction,
    CosignatureSignedTransaction,
    CosignatureTransaction,
    TransactionMapping,
    RepositoryFactoryHttp
} from 'symbol-sdk';

import { BlockchainListener } from "../../../helpers/transactionListener";
import '../../../../utils/env-config';
import { Constants } from '../../../helpers/constants';
import { Writer } from '../../../helpers/writer';
import { ErrorHandler } from '../../../helpers/errorHandler';
import { transactionMultisigService } from './transactionMultisigService';
import { TransactionAnouncer } from '../../..//helpers/transactionAnouncer';
import { transactionService } from '../transactionService';

// Environment variables
const networkGenerationHash = process.env.nemesisGenerationHash;
const networkName = Constants.NETWORK_IDENTIFIER;

const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;

// symbol.xym id
const networkCurrencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);
// network currency divisibility
const networkCurrencyDivisibility = Constants.NETWORK_CURRENCY_DIVISIBILITY;

/**
 * Class to handle Mosaic Transactions with multisig account
 */
export class MosaicMultisigService {

    private mosaicId: string;
    private cosignHash: string;
    private signedHash: string;

    /**
     * Getter $mosaicId
     * @return {string}
     */
    public get $mosaicId(): string {
        return this.mosaicId;
    }

    /**
     * Setter $mosaicId
     * @param {string} value
     */
    public set $mosaicId(value: string) {
        this.mosaicId = value;
    }
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
     * Multisig Account:
     * 1. Creates mosaic with unique id.
     * 2. Changes the supply of mosaics with given amount.
     * 3. Creates a mosaic id alias to given namespace name, which is linked to a namespace id
     * @param multisigAccountPublicKey Multisig Account, which is going to create Mosaic, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param namespaceName Namespace name which is going to be linked to mosaic
     * @param amount Amount of mosaics to create
     * @param divisibility
     * @param duration The duration of the mosaic. How long will the namespace exist (blocks)
     * @param writer Writer object with filepath
     */
    public async createMosaic(
        multisigAccountPublicKey: string,
        cosignatoryPrivateKey: string,
        namespaceName: string,
        amount: number,
        divisibility: number,
        duration: number,
        writer: Writer,
        errorHandler?: ErrorHandler,
        script?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);

                // replace with custom mosaic flags
                const isSupplyMutable = true;
                const isTransferable = true;
                const isRestrictable = true;

                const nonce = MosaicNonce.createRandom();

                const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
                    Deadline.create(epochAdjustment),
                    nonce,
                    MosaicId.createFromNonce(nonce, multisigAccount.address),
                    MosaicFlags.create(isSupplyMutable, isTransferable, isRestrictable),
                    divisibility,
                    UInt64.fromUint(duration),
                    networkName,
                    UInt64.fromUint(maxFee)
                );
                const delta = amount;

                const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
                    Deadline.create(epochAdjustment),
                    mosaicDefinitionTransaction.mosaicId,
                    MosaicSupplyChangeAction.Increase,
                    UInt64.fromUint(delta * Math.pow(10, divisibility)),
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const namespaceId = new NamespaceId(namespaceName);

                const mosaicAliasTransaction = AliasTransaction.createForMosaic(
                    Deadline.create(epochAdjustment),
                    AliasAction.Link,
                    namespaceId,
                    mosaicDefinitionTransaction.mosaicId,
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [mosaicDefinitionTransaction.toAggregate(multisigAccount),
                    mosaicSupplyChangeTransaction.toAggregate(multisigAccount),
                    mosaicAliasTransaction.toAggregate(multisigAccount)],
                    networkName,
                    [],
                    UInt64.fromUint(maxFee)
                );

                const cosignTransaction = cosignatoryAccount.sign(
                    aggregateTransaction,
                    networkGenerationHash,
                );

                const hashLockTransaction = HashLockTransaction.create(
                    Deadline.create(epochAdjustment),
                    new Mosaic(
                        networkCurrencyMosaicId,
                        UInt64.fromUint(10 * Math.pow(10, networkCurrencyDivisibility)),
                    ),
                    UInt64.fromUint(480),
                    cosignTransaction,
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const signedHashLockTransaction = cosignatoryAccount.sign(
                    hashLockTransaction,
                    networkGenerationHash,
                );

                writer.addText("NamespaceName: " + namespaceName);
                writer.addText("MosaicId: " + mosaicDefinitionTransaction.mosaicId.toHex());

                const listener = new BlockchainListener(
                    cosignTransaction,
                    cosignatoryAccount.address,
                    signedHashLockTransaction
                );

                listener
                    .createListenerBonded(writer, undefined, multisigAccount.address)
                    .then(result => {
                        if (result.group === "partial") {
                            resolve(result);
                        }
                        else if (result.group === "failed") {
                            reject(result.code);
                        }
                    });

            }, 0)
        })
    }

    /**
     * Multisig Account:
     * 1. Creates mosaic with unique id.
     * 2. Changes the supply of mosaics with given amount.
     * @param multisigAccountPublicKey Multisig Account, which is going to create Mosaic, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param amount Amount of mosaics to create
     * @param divisibility
     * @param duration The duration of the mosaic. How long will the namespace exist (blocks)
     * @param writer Writer object with filepath
     */
    public async createMosaicWithoutNamespace(
        multisigAccountPublicKey: string,
        cosignatoryPrivateKey: string,
        amount: number,
        divisibility: number,
        duration: number,
        writer: Writer,
        errorHandler?: ErrorHandler,
        script?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);

                // replace with custom mosaic flags
                const isSupplyMutable = true;
                const isTransferable = true;
                const isRestrictable = true;

                const nonce = MosaicNonce.createRandom();

                const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
                    Deadline.create(epochAdjustment),
                    nonce,
                    MosaicId.createFromNonce(nonce, multisigAccount.address),
                    MosaicFlags.create(isSupplyMutable, isTransferable, isRestrictable),
                    divisibility,
                    UInt64.fromUint(duration),
                    networkName,
                    UInt64.fromUint(maxFee)
                );
                const delta = amount;

                const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
                    Deadline.create(epochAdjustment),
                    mosaicDefinitionTransaction.mosaicId,
                    MosaicSupplyChangeAction.Increase,
                    UInt64.fromUint(delta * Math.pow(10, divisibility)),
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [mosaicDefinitionTransaction.toAggregate(multisigAccount),
                    mosaicSupplyChangeTransaction.toAggregate(multisigAccount)],
                    networkName,
                    [],
                    UInt64.fromUint(maxFee)
                );

                writer.addText("MosaicId: " + mosaicDefinitionTransaction.mosaicId.toHex());

                const cosignTransaction = cosignatoryAccount.sign(
                    aggregateTransaction,
                    networkGenerationHash,
                );

                const hashLockTransaction = HashLockTransaction.create(
                    Deadline.create(epochAdjustment),
                    new Mosaic(
                        networkCurrencyMosaicId,
                        UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
                    ),
                    UInt64.fromUint(480),
                    cosignTransaction,
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const signedHashLockTransaction = cosignatoryAccount.sign(
                    hashLockTransaction,
                    networkGenerationHash,
                );

                const listener = new BlockchainListener(
                    cosignTransaction,
                    cosignatoryAccount.address,
                    signedHashLockTransaction
                );

                listener
                    .createListenerBonded(writer, undefined, multisigAccount.address)
                    .then(result => {
                        if (result.group === "partial") {
                            resolve(result);
                        }
                        else if (result.group === "failed") {
                            reject(result.code);
                        }
                    });

            }, 0)
        })
    }

    /**
     * Multisig Account:
     * 1. Creates mosaic with unique id.
     * 2. Changes the supply of mosaics with given amount.
     * @param multisigAccountPublicKey Multisig Account, which is going to create Mosaic, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param recipientPrivateKey Recipient private key, which is going to pay mosaic rental fee and will obtain Mosaic
     * @param amount Amount of mosaics to create
     * @param divisibility
     * @param duration The duration of the mosaic. How long will the namespace exist (blocks)
     * @param writer Writer object with filepath
     * @param feeMultiplier median fee multiplier to set maxFee dynamically
     */
    public async createMosaicWithoutNamespaceEscrow(
        multisigAccountPublicKey: string,
        cosignatoryPrivateKey: string,
        ownerCosignatoryPrivateKeyMultisig: string,
        ownerPublickeyMultisig: string,
        amount: number,
        divisibility: number,
        duration: number,
        writer: Writer,
        feeMultiplier: number,
        errorHandler?: ErrorHandler,
        script?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                    const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);

                    const ownerCosignatoryMultisig = Account.createFromPrivateKey(ownerCosignatoryPrivateKeyMultisig, networkName);
                    const ownerPublicAccountMultisig = PublicAccount.createFromPublicKey(ownerPublickeyMultisig, networkName);

                    // replace with custom mosaic flags
                    const isSupplyMutable = true;
                    const isTransferable = true;
                    const isRestrictable = true;

                    const nonce = MosaicNonce.createRandom();

                    const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
                        Deadline.create(epochAdjustment),
                        nonce,
                        MosaicId.createFromNonce(nonce, multisigAccount.address),
                        MosaicFlags.create(isSupplyMutable, isTransferable, isRestrictable),
                        divisibility,
                        UInt64.fromUint(duration),
                        networkName,
                    );
                    const delta = amount;
                    const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
                        Deadline.create(epochAdjustment),
                        mosaicDefinitionTransaction.mosaicId,
                        MosaicSupplyChangeAction.Increase,
                        UInt64.fromUint(delta * Math.pow(10, divisibility)),
                        networkName,
                    );

                    const networkMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);
                    const networkMosaic = new Mosaic(networkMosaicId, UInt64.fromUint(Constants.MOSAIC_RENTAL_FEE));
                    const platformFeeMosaic = TransferTransaction.create(
                        Deadline.create(epochAdjustment),
                        multisigAccount.address,
                        [networkMosaic],
                        PlainMessage.create("send 50 symbol.xym as fee to NFT creator"),
                        networkName,
                    );

                    //Add new transaction for NFT creation to the platform
                    const networkMosaicForPlatform = new Mosaic(networkMosaicId, UInt64.fromUint(Constants.MOSAIC_CREATION_FEE));
                    const platformFeeTransaction = TransferTransaction.create(
                        Deadline.create(epochAdjustment),
                        multisigAccount.address,
                        [networkMosaicForPlatform],
                        PlainMessage.create("NFT creation transaction for the platform with 130 symbol.xym"),
                        networkName,
                    )

                    const aggregateTransaction = AggregateTransaction.createComplete(
                        Deadline.create(epochAdjustment),
                        [
                            mosaicDefinitionTransaction.toAggregate(multisigAccount).setMaxFee(feeMultiplier),
                            mosaicSupplyChangeTransaction.toAggregate(multisigAccount).setMaxFee(feeMultiplier),
                            platformFeeMosaic.toAggregate(ownerPublicAccountMultisig).setMaxFee(feeMultiplier),
                            platformFeeTransaction.toAggregate(ownerPublicAccountMultisig).setMaxFee(feeMultiplier)
                        ],
                        networkName,
                        [],
                    ).setMaxFeeForAggregate(feeMultiplier, 2);

                    writer.addText("MosaicId: " + mosaicDefinitionTransaction.mosaicId.toHex());

                    const cosignTransaction = cosignatoryAccount.sign(
                        aggregateTransaction,
                        networkGenerationHash,
                    );

                    
                    
                    const cosignedTransactioRecipient = CosignatureTransaction.signTransactionPayload(
                        ownerCosignatoryMultisig,
                        cosignTransaction.payload,
                        networkGenerationHash,
                    );
            
                    const cosignatureSignedTransactions = [
                        new CosignatureSignedTransaction(
                            cosignedTransactioRecipient.parentHash,
                            cosignedTransactioRecipient.signature,
                            cosignedTransactioRecipient.signerPublicKey,
                        ),
                    ];
            
                    const rectreatedAggregateTransactionFromPayload = TransactionMapping.createFromPayload(
                        cosignTransaction.payload,
                    ) as AggregateTransaction;
            
                    const signedTransactionComplete = cosignatoryAccount.signTransactionGivenSignatures(
                        rectreatedAggregateTransactionFromPayload,
                        cosignatureSignedTransactions,
                        networkGenerationHash,
                    );
            
                    
                    const nodeUrl = process.env.URL as string;
                    const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
                    const transactionHttp = repositoryFactory.createTransactionRepository();
            
                    transactionHttp.announce(signedTransactionComplete).subscribe({
                        next: (x) => {
                            writer.addText("mosaicCreationHash:  "+ signedTransactionComplete.hash);
                            writer.addText(x.message);
                            resolve({ 'hash': signedTransactionComplete.hash });
                        
                        },
                        error: (err) => {
                            writer.addERROR(err.message);
                            reject(err.message);
                        },
                    });
            
                } catch (error) {
                    reject(error.message);
                }

                


                

            }, 0)
        })
    }

    /**
     * Increases supply of mosaic with multisg account. Account must be the creator of mosaic
     * @param multisigAccountPublicKey Multisig Account, which is going to increase Mosaic supply, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param mosaicIdString Mosaic unique id
     * @param amount Amount of mosaics to increase
     * @param mosaicDivisibility Divisibility of mosaic
     * @param writer Writer object with filepath
     */
    public increaseSupply(
        multisigAccountPublicKey: string,
        cosignatoryPrivateKey: string,
        mosaicIdString: string,
        amount: number,
        mosaicDivisibility: number,
        writer: Writer
    ) {

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);

                const mosaicId = new MosaicId(mosaicIdString);
                const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
                    Deadline.create(epochAdjustment),
                    mosaicId,
                    MosaicSupplyChangeAction.Increase,
                    UInt64.fromUint(amount * Math.pow(10, mosaicDivisibility)),
                    networkName);

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [mosaicSupplyChangeTransaction.toAggregate(multisigAccount)],
                    networkName,
                    [],
                    UInt64.fromUint(maxFee)
                );

                const cosignTransaction = cosignatoryAccount.sign(
                    aggregateTransaction,
                    networkGenerationHash,
                );

                const hashLockTransaction = HashLockTransaction.create(
                    Deadline.create(epochAdjustment),
                    new Mosaic(
                        networkCurrencyMosaicId,
                        UInt64.fromUint(10 * Math.pow(10, networkCurrencyDivisibility)),
                    ),
                    UInt64.fromUint(480),
                    cosignTransaction,
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const signedHashLockTransaction = cosignatoryAccount.sign(
                    hashLockTransaction,
                    networkGenerationHash,
                );

                const listener = new BlockchainListener(
                    cosignTransaction,
                    cosignatoryAccount.address,
                    signedHashLockTransaction
                );

                listener
                    .createListenerBonded(writer, undefined, multisigAccount.address)
                    .then(result => {
                        if (result.group === "partial") {
                            resolve(result);
                        }
                        else if (result.group === "failed") {
                            reject(result.code);
                        }
                    });

            }, 0)
        })
    }

    /**
     * Decreases supply of mosaic with multisg account. Account must be the creator of mosaic
     * @param multisigAccountPublicKey Multisig Account, which is going to increase Mosaic supply, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param mosaicIdString Mosaic unique id
     * @param amount Amount of mosaics to increase
     * @param mosaicDivisibility Divisibility of mosaic
     * @param writer Writer object with filepath
     */
    public decreaseSupply(
        multisigAccountPublicKey: string,
        cosignatoryPrivateKey: string,
        mosaicIdString: string,
        amount: number,
        mosaicDivisibility: number,
        writer: Writer) {

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);

                const mosaicId = new MosaicId(mosaicIdString);
                const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
                    Deadline.create(epochAdjustment),
                    mosaicId,
                    MosaicSupplyChangeAction.Decrease,
                    UInt64.fromUint(amount * Math.pow(10, mosaicDivisibility)),
                    networkName);

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [mosaicSupplyChangeTransaction.toAggregate(multisigAccount)],
                    networkName,
                    [],
                    UInt64.fromUint(maxFee)
                );

                const cosignTransaction = cosignatoryAccount.sign(
                    aggregateTransaction,
                    networkGenerationHash,
                );

                const hashLockTransaction = HashLockTransaction.create(
                    Deadline.create(epochAdjustment),
                    new Mosaic(
                        networkCurrencyMosaicId,
                        UInt64.fromUint(10 * Math.pow(10, networkCurrencyDivisibility)),
                    ),
                    UInt64.fromUint(480),
                    cosignTransaction,
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const signedHashLockTransaction = cosignatoryAccount.sign(
                    hashLockTransaction,
                    networkGenerationHash,
                );

                const listener = new BlockchainListener(
                    cosignTransaction,
                    cosignatoryAccount.address,
                    signedHashLockTransaction
                );

                listener
                    .createListenerBonded(writer, undefined, multisigAccount.address)
                    .then(result => {
                        if (result.group === "partial") {
                            resolve(result);
                        }
                        else if (result.group === "failed") {
                            reject(result.code);
                        }
                    });

            }, 0)
        })
    }
}

export const mosaicMultisigService = new MosaicMultisigService();