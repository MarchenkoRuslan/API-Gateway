import {
    Account,
    Address,
    AccountMetadataTransaction,
    AggregateTransaction,
    Deadline,
    HashLockTransaction,
    KeyGenerator,
    Mosaic,
    MosaicId,
    MosaicMetadataTransaction,
    Metadata,
    MetadataType,
    MetadataTransactionService,
    MetadataHttp,
    NamespaceId,
    Page,
    PublicAccount,
    RepositoryFactoryHttp,
    SignedTransaction,
    TransactionService,
    UInt64,
} from 'symbol-sdk';

import {transactionMultisigService} from "./multisig/transactionMultisigService";
import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { BlockchainListener } from "../../helpers/transactionListener";
import { TransactionAnouncer } from "../../helpers/transactionAnouncer";
import { Writer } from "../../helpers/writer";
import { Constants } from '../../helpers/constants';

// Environment variables
const URL = process.env.URL as string;
const generationHash = process.env.nemesisGenerationHash as string;
const networkName = Constants.NETWORK_IDENTIFIER;

// HTTP
const repositoryFactory = new RepositoryFactoryHttp(URL);
const metadataHttp = repositoryFactory.createMetadataRepository();

const listener = repositoryFactory.createListener();
const receiptHttp = repositoryFactory.createReceiptRepository();
const transactionHttp = repositoryFactory.createTransactionRepository();
const namespaceHttp = repositoryFactory.createNamespaceRepository();
const transactionService = new TransactionService(transactionHttp, receiptHttp);

const metadataHttpService = new MetadataHttp(URL);
const metadataTransactionService = new MetadataTransactionService(metadataHttpService);

const encoder = new TextEncoder();

const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;

// symbol.xym id
const networkCurrencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);
// network currency divisibility
const networkCurrencyDivisibility = Constants.NETWORK_CURRENCY_DIVISIBILITY;

/**
 * Class to handle Metadata
 */
export class MetadataService {

    /**
     * assign Metadata to an account
     * @param signerPrivateKeyString Signer private key in blockchain
     * @param accountPublicKeyString Account public key in blockchain
     * @param keyString Key to save
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async assignMetadataToAccount(
        signerPrivateKeyString: string,
        accountPublicKeyString: string,
        keyString: string,
        value: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            try {
                const key = KeyGenerator.generateUInt64Key(keyString);
                const publicAccount = PublicAccount.createFromPublicKey(
                    accountPublicKeyString,
                    networkName
                );

                const accountMetadataTransaction = AccountMetadataTransaction.create(
                    Deadline.create(epochAdjustment),
                    publicAccount.address,
                    key,
                    value.length,
                    encoder.encode(value),
                    networkName,
                    UInt64.fromUint(maxFee)
                );

                const signerAccount = Account.createFromPrivateKey(signerPrivateKeyString, networkName);

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [accountMetadataTransaction.toAggregate(signerAccount.publicAccount)],
                    networkName,
                    [],
                    UInt64.fromUint(maxFee)
                );

                const cosignTransaction = signerAccount.sign(
                    aggregateTransaction,
                    generationHash,
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
                    UInt64.fromUint(maxFee),
                );

                const signedHashLockTransaction = signerAccount.sign(
                    hashLockTransaction,
                    generationHash,
                );

                const listener1 = new BlockchainListener(cosignTransaction, signerAccount.address, signedHashLockTransaction);

                listener1.createListenerBonded(writer)
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
        })
    }
    
    
    /**
     * update Metadata to in account
     * @param signerPrivateKeyString Signer private key in blockchain
     * @param accountPublicKeyString Account public key in blockchain
     * @param keyString Key to save
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async updateMetadataInAccount(
        signerPrivateKeyString: string,
        accountPublicKeyString: string,
        keyString: string,
        newValue: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const key = KeyGenerator.generateUInt64Key(keyString);
                    const publicAccount = PublicAccount.createFromPublicKey(
                        accountPublicKeyString,
                        networkName
                    );
                    const signerAccount = Account.createFromPrivateKey(signerPrivateKeyString, networkName);

                    const accountMetadataTransaction = metadataTransactionService.createAccountMetadataTransaction(
                        Deadline.create(epochAdjustment),
                        networkName,
                        publicAccount.address,
                        key,
                        newValue,
                        signerAccount.publicAccount.address,
                        UInt64.fromUint(maxFee),
                    );

                    const signedCosignAggregateTransaction = accountMetadataTransaction.pipe(
                        mergeMap((transaction) => {
                            const aggregateTransaction = AggregateTransaction.createBonded(
                                Deadline.create(epochAdjustment),
                                [transaction.toAggregate(signerAccount.publicAccount)],
                                networkName,
                                [],
                                UInt64.fromUint(maxFee),
                            );
                            const cosignTransaction = signerAccount.sign(
                                aggregateTransaction,
                                generationHash,
                            );

                            return of(cosignTransaction);
                        }),
                    );

                    interface SignedAggregateHashLock {
                        readonly coSignAggregate: SignedTransaction;
                        readonly hashLock: SignedTransaction;
                    }

                    const signedAggregateHashLock = signedCosignAggregateTransaction.pipe(
                        mergeMap((signedCosignAggregateTransactionInner) => {
                            const hashLockTransaction = HashLockTransaction.create(
                                Deadline.create(epochAdjustment),
                                new Mosaic(
                                    networkCurrencyMosaicId,
                                    UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
                                ),
                                UInt64.fromUint(480),
                                signedCosignAggregateTransactionInner,
                                networkName,
                                UInt64.fromUint(maxFee),
                            );
                            const signedHashLockTransaction = signerAccount.sign(
                                hashLockTransaction,
                                generationHash,
                            );
                            const signedAggregateHashLockInner: SignedAggregateHashLock = {
                                coSignAggregate: signedCosignAggregateTransactionInner,
                                hashLock: signedHashLockTransaction,
                            };

                            const listener2 = new BlockchainListener(
                                signedHashLockTransaction,
                                signerAccount.address
                            );
                            listener2.createListener(writer)
                                .then((result) => {
                                    if (result.group === "confirmed") {
                                        writer.addText('-------------------------------START---------------------------------------- \n' +
                                            '⏳ Transaction status changed to confirmed.\n' +
                                            'Hash Locked transaction hash: ' + signedHashLockTransaction.hash + '\n' +
                                            'Transaction Hash For Cosignatures to sign: ' + signedCosignAggregateTransactionInner.hash + '\n' +
                                            '-------------------------------END------------------------------------------\n');

                                        writer.addText(signedCosignAggregateTransactionInner.hash);

                                        const listener1 = new BlockchainListener(
                                            signedCosignAggregateTransactionInner,
                                            signerAccount.address
                                        );
                                        listener1.createListener(writer);
                                        resolve({
                                            "hash": signedHashLockTransaction.hash,
                                            "group": "confirmed",
                                            "status": "Success",
                                            "cosignHash": signedCosignAggregateTransactionInner.hash
                                        });
                                    }
                                    else if (result.group === "failed") {
                                        reject(result.code);
                                    }
                                });

                            return of(signedAggregateHashLockInner);
                        }),
                    );

                    listener.open().then(() => {

                        signedAggregateHashLock
                            .pipe(
                                mergeMap((signedAggregateHashLockInner) =>
                                    transactionService.announceHashLockAggregateBonded(
                                        signedAggregateHashLockInner.hashLock,
                                        signedAggregateHashLockInner.coSignAggregate,
                                        listener,
                                    ),
                                ),
                            )
                            .subscribe(
                                () => writer.addText('Transaction confirmed'),
                                (err) => {
                                    writer.addERROR(err);
                                    resolve({
                                        "hash": "this.signedTransaction.hash",
                                        "code": err.code,
                                        "group": "failed"
                                    });
                                },
                                () => listener.close(),
                            );
                    });
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * assign Metadata to an account
     * @param accountAddressString Account address in blockchain
     * @returns Response from blockchain as JSON
     */
    public async getMetadataAccount(
        accountAddressString: string,
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const address = Address.createFromRawAddress(accountAddressString);
                    const searchCriteria = {
                        targetAddress: address,
                        metadataType: MetadataType.Account,
                    };
                    metadataHttp.search(searchCriteria).subscribe(
                        (metadataEntries: Page<Metadata>) => {

                            if (metadataEntries.pageSize > 0) {
                                const metadataList = []
                                const metadataEntriesList = metadataEntries.data;
                                for (let i = 0; i < metadataEntriesList.length; i++) {

                                    metadataList.push({
                                        "key": metadataEntries.data[i].metadataEntry.scopedMetadataKey.toHex(),
                                        "value": metadataEntries.data[i].metadataEntry.value
                                    })
                                }
                                resolve(metadataList);
                            } else {
                                reject({
                                    message: "The_Address_Does_Not_Have_Metadata_Entries_Assigned"
                                })
                            }

                        },
                        (err) => reject(err),
                    );

                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * get assigned Metadata to an account by namepsace
     * @param namespaceName Account address namespace in blockchain
     * @returns Response from blockchain as JSON
     */
    public async getMetadataAccountByNamespace(
        namespaceName: string,
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceId = new NamespaceId(namespaceName);
                    namespaceHttp.getLinkedAddress(namespaceId).subscribe(
                        (addressToSearch) => {
                            const address = Address.createFromRawAddress(addressToSearch.plain());
                            const searchCriteria = {
                                targetAddress: address,
                                metadataType: MetadataType.Account,
                            };
                            metadataHttp.search(searchCriteria).subscribe(
                                (metadataEntries: Page<Metadata>) => {
                                    if (metadataEntries.pageSize > 0) {
                                        const metadataList = []
                                        const metadataEntriesList = metadataEntries.data;
                                        for (let i = 0; i < metadataEntriesList.length; i++) {

                                            metadataList.push({
                                                "key": metadataEntries.data[i].metadataEntry.scopedMetadataKey.toHex(),
                                                "value": metadataEntries.data[i].metadataEntry.value
                                            })
                                        }
                                        resolve(metadataList);
                                    } else {
                                        reject({
                                            message: "The_Address_Does_Not_Have_Metadata_Entries_Assigned"
                                        })
                                    }

                                },
                                (err) => console.log(err),
                            );
                        },
                        (err) => {
                            reject(err);
                        },
                    );
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }


    /**
     * assign Metadata to an mosaic
     * @param signerPrivateKeyString Signer private key in blockchain
     * @param mosaicIdHex Account public key in blockchain
     * @param keyString Key to save
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async assignMetadataToMosaic(
        signerPrivateKeyString: string,
        mosaicIdHex: string,
        keyString: string,
        value: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const key = KeyGenerator.generateUInt64Key(keyString);
                    const signerAccount = Account.createFromPrivateKey(signerPrivateKeyString, networkName);
                    const mosaicId = new MosaicId(mosaicIdHex);
                    // const mosaicId = new NamespaceId('cc.shares');

                    const mosaicMetadataTransaction = MosaicMetadataTransaction.create(
                        Deadline.create(epochAdjustment),
                        signerAccount.address,
                        key,
                        mosaicId,
                        value.length,
                        encoder.encode(value),
                        networkName,
                        UInt64.fromUint(maxFee)
                    );


                    const aggregateTransaction = AggregateTransaction.createComplete(
                        Deadline.create(epochAdjustment),
                        [mosaicMetadataTransaction.toAggregate(signerAccount.publicAccount)],
                        networkName,
                        [],
                        UInt64.fromUint(maxFee)
                    );

                    const signedTransaction = signerAccount.sign(
                        aggregateTransaction,
                        generationHash,
                    );
                    const blockchainListener = new BlockchainListener(
                        signedTransaction,
                        signerAccount.address
                    );
                    blockchainListener.createListener(writer);

                    const announcer = new TransactionAnouncer(signedTransaction);

                    announcer.announceTransaction(writer)
                        .then(result => resolve(result));

                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * update Metadata to in account
     * @param signerPrivateKeyString Signer private key in blockchain
     * @param accountPublicKeyString Account public key in blockchain
     * @param keyString Key to save
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async updateMetadataInMosaic(
        signerPrivateKeyString: string,
        mosaicId: string,
        keyString: string,
        newValue: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const key = KeyGenerator.generateUInt64Key(keyString);
                    const signerAccount = Account.createFromPrivateKey(signerPrivateKeyString, networkName);

                    const publicAccount = PublicAccount.createFromPublicKey(
                        signerAccount.publicKey,
                        networkName
                    );

                    const mosaicIdObject = new MosaicId(mosaicId);
                    const mosaicMetadataTransaction = metadataTransactionService.createMosaicMetadataTransaction(
                        Deadline.create(epochAdjustment),
                        networkName,
                        publicAccount.address,
                        mosaicIdObject,
                        key,
                        newValue,
                        signerAccount.publicAccount.address,
                        UInt64.fromUint(maxFee)
                    );

                    const signedCosignAggregateTransaction = mosaicMetadataTransaction.pipe(
                        mergeMap((transaction) => {
                            const aggregateTransaction = AggregateTransaction.createBonded(
                                Deadline.create(epochAdjustment),
                                [transaction.toAggregate(signerAccount.publicAccount)],
                                networkName,
                                [],
                                UInt64.fromUint(maxFee),
                            );
                            const cosignTransaction = signerAccount.sign(
                                aggregateTransaction,
                                generationHash,
                            );

                            return of(cosignTransaction);
                        }),
                    );

                    interface SignedAggregateHashLock {
                        readonly coSignAggregate: SignedTransaction;
                        readonly hashLock: SignedTransaction;
                    }

                    const signedAggregateHashLock = signedCosignAggregateTransaction.pipe(
                        mergeMap((signedCosignAggregateTransactionInner) => {
                            const hashLockTransaction = HashLockTransaction.create(
                                Deadline.create(epochAdjustment),
                                new Mosaic(
                                    networkCurrencyMosaicId,
                                    UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
                                ),
                                UInt64.fromUint(480),
                                signedCosignAggregateTransactionInner,
                                networkName,
                                UInt64.fromUint(maxFee),
                            );
                            const signedHashLockTransaction = signerAccount.sign(
                                hashLockTransaction,
                                generationHash,
                            );
                            const signedAggregateHashLockInner: SignedAggregateHashLock = {
                                coSignAggregate: signedCosignAggregateTransactionInner,
                                hashLock: signedHashLockTransaction,
                            };

                            const listener2 = new BlockchainListener(
                                signedHashLockTransaction,
                                signerAccount.address
                            );
                            listener2.createListener(writer)
                                .then((result) => {
                                    if (result.group === "confirmed") {
                                        writer.addText('-------------------------------START---------------------------------------- \n' +
                                            '⏳ Transaction status changed to confirmed.\n' +
                                            'Hash Locked transaction hash: ' + signedHashLockTransaction.hash + '\n' +
                                            'Transaction Hash For Cosignatures to sign: ' + signedCosignAggregateTransactionInner.hash + '\n' +
                                            '-------------------------------END------------------------------------------\n');

                                        writer.addText(signedCosignAggregateTransactionInner.hash);

                                        const listener1 = new BlockchainListener(
                                            signedCosignAggregateTransactionInner,
                                            signerAccount.address
                                        );
                                        listener1.createListener(writer);
                                        resolve({
                                            "hash": signedHashLockTransaction.hash,
                                            "group": "confirmed",
                                            "status": "Success",
                                            "cosignHash": signedCosignAggregateTransactionInner.hash
                                        });
                                    }
                                    else if (result.group === "failed") {
                                        reject(result.code);
                                    }
                                });

                            return of(signedAggregateHashLockInner);
                        }),
                    );

                    listener.open().then(() => {

                        signedAggregateHashLock
                            .pipe(
                                mergeMap((signedAggregateHashLockInner) =>
                                    transactionService.announceHashLockAggregateBonded(
                                        signedAggregateHashLockInner.hashLock,
                                        signedAggregateHashLockInner.coSignAggregate,
                                        listener,
                                    ),
                                ),
                            )
                            .subscribe(
                                () => writer.addText('Transaction confirmed'),
                                (err) => {
                                    writer.addERROR(err);
                                    resolve({
                                        "hash": "this.signedTransaction.hash",
                                        "code": err.code,
                                        "group": "failed"
                                    });
                                },
                                () => listener.close(),
                            );
                    });
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * assign Metadata to an mosaic
     * @param signerPrivateKeyString Signer private key in blockchain
     * @param mosaicIdHex Account public key in blockchain
     * @param keyString Key to save
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async assignMetadataToMosaicBonded(
        signerPrivateKeyString: string,
        mosaicIdHex: string,
        keyString: string,
        value: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const key = KeyGenerator.generateUInt64Key(keyString);
                    const signerAccount = Account.createFromPrivateKey(signerPrivateKeyString, networkName);
                    const mosaicId = new MosaicId(mosaicIdHex);
                    // const mosaicId = new NamespaceId('cc.shares');

                    const mosaicMetadataTransaction = MosaicMetadataTransaction.create(
                        Deadline.create(epochAdjustment),
                        signerAccount.address,
                        key,
                        mosaicId,
                        value.length,
                        encoder.encode(value),
                        networkName,
                        UInt64.fromUint(maxFee)
                    );


                    const aggregateTransaction = AggregateTransaction.createBonded(
                        Deadline.create(epochAdjustment),
                        [mosaicMetadataTransaction.toAggregate(signerAccount.publicAccount)],
                        networkName,
                        [],
                        UInt64.fromUint(maxFee)
                    );

                    const cosignTransaction = signerAccount.sign(
                        aggregateTransaction,
                        generationHash
                    );
                    // this.$cosignHash = cosignTransaction.hash;

                    // const hashLockTransaction = transactionCreator.createHashLockTransaction(cosignTransaction);

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

                    const signedHashLockTransaction = signerAccount.sign(
                        hashLockTransaction,
                        generationHash,
                    );
                    // this.signedHash = signedHashLockTransaction.hash;

                    const listener1 = new BlockchainListener(cosignTransaction, signerAccount.address, signedHashLockTransaction);

                    listener1.createListenerBonded(writer)
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
     * assign Metadata to an mosaic
     * @param multisigPublicKey Public key of the multisig account owning the mosaic
     * @param signerPrivateKeyString Signer private key in blockchain
     * @param mosaicIdHex Account public key in blockchain
     * @param keyString Key to save
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async assignMetadataToMosaicBondedMultisig(
        multisigPublicKey: string,
        signerPrivateKeyString: string,
        mosaicIdHex: string,
        keyString: string,
        value: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const key = KeyGenerator.generateUInt64Key(keyString);

                    const multisigAccount = PublicAccount.createFromPublicKey(multisigPublicKey, networkName);

                    const signerAccount = Account.createFromPrivateKey(signerPrivateKeyString, networkName);
                    const mosaicId = new MosaicId(mosaicIdHex);
                    // const mosaicId = new NamespaceId('cc.shares');

                    const mosaicMetadataTransaction = MosaicMetadataTransaction.create(
                        Deadline.create(epochAdjustment),
                        multisigAccount.address,
                        key,
                        mosaicId,
                        value.length,
                        encoder.encode(value),
                        networkName,
                        UInt64.fromUint(maxFee)
                    );


                    const aggregateTransaction = AggregateTransaction.createBonded(
                        Deadline.create(epochAdjustment),
                        [mosaicMetadataTransaction.toAggregate(signerAccount.publicAccount)],
                        networkName,
                        [],
                        UInt64.fromUint(maxFee)
                    );

                    const cosignTransaction = signerAccount.sign(
                        aggregateTransaction,
                        generationHash
                    );
                    // this.$cosignHash = cosignTransaction.hash;

                    // const hashLockTransaction = transactionCreator.createHashLockTransaction(cosignTransaction);

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

                    const signedHashLockTransaction = signerAccount.sign(
                        hashLockTransaction,
                        generationHash,
                    );
                    // this.signedHash = signedHashLockTransaction.hash;

                    const listener1 = new BlockchainListener(cosignTransaction, signerAccount.address, signedHashLockTransaction);

                    listener1.createListenerBonded(writer)
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
     * get assigned Metadata to mosaic
     * @param mosaicIdHex Mosaic id
     * @returns Response from blockchain as JSON
     */
    public async getMetadataMosaic(
        mosaicIdHex: string,
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const mosaicId = new MosaicId(mosaicIdHex);

                    const searchCriteria = {
                        targetId: mosaicId,
                        metadataType: MetadataType.Mosaic,
                    };

                    metadataHttp.search(searchCriteria).subscribe(
                        (metadataEntries: Page<Metadata>) => {
                            if (metadataEntries.pageSize > 0) {
                                const metadataList = []
                                const metadataEntriesList = metadataEntries.data;
                                for (let i = 0; i < metadataEntriesList.length; i++) {

                                    metadataList.push({
                                        "key": metadataEntries.data[i].metadataEntry.scopedMetadataKey.toHex(),
                                        "value": metadataEntries.data[i].metadataEntry.value
                                    })
                                }
                                resolve(metadataList);
                            } else {
                                reject({
                                    message: "The_Mosaic_Does_Not_Have_Metadata_Entries_Assigned"
                                })
                            }
                        },
                        (err) => {
                            reject(err);
                        },
                    );
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Check whether given text is ascii valid 
     * @param text Text to verify 
     * @returns boolean
     */
    public checkMetadataAscii(text: string){
        let hasMoreThanAscii = [...text].some(char => char.charCodeAt(0) > 127);
        return !hasMoreThanAscii;

    }
}

export const metadataService = new MetadataService();