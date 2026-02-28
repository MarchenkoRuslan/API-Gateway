import {
    SignedTransaction,
    Address,
    RepositoryFactoryHttp
} from "symbol-sdk";

import { filter, mergeMap, timeout } from "rxjs/operators";
import '../../utils/env-config';
import { Writer } from "./writer";
import { TransactionAnouncer } from "./transactionAnouncer";
import { ErrorHandler } from "./errorHandler";

const URL = process.env.URL as string;

const repositoryFactory = new RepositoryFactoryHttp(URL);
const transactionHttp = repositoryFactory.createTransactionRepository();

/**
 * Class to listen to blockchain with listners using websockets
 */
export class BlockchainListener {

    /**
     * 
     * @param signedTransaction Announced transaction to listen to
     * @param accountAddress Account address to listen to
     * @param hashLockTransactionSigned Optional: Announced HashLock transaction
     */
    constructor(public readonly signedTransaction: SignedTransaction, public readonly accountAddress: Address, public readonly hashLockTransactionSigned?: SignedTransaction) {
    }

    /**
     * Create Listener to monitor status/confirmed/unconfirmed of given transaction and write responses to file
     * @param writer Writer object with filepath
     * @param errorHandler Error Handler object
     * @returns Promise as a result - confirmed or error
     */
    public async createListener(writer: Writer, errorHandler?: ErrorHandler): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (errorHandler === undefined) {
                    errorHandler = new ErrorHandler();
                }
                const listener = repositoryFactory.createListener();

                listener.open().then(() => {

                    // Listen to status
                    listener.status(this.accountAddress)
                        .pipe(filter(error => error.hash === this.signedTransaction.hash))
                        .subscribe(error => {
                            resolve({
                                "hash": this.signedTransaction.hash,
                                "code": error.code,
                                "group": "failed"
                            });
                            writer.addERROR(this.signedTransaction.hash + " ❌" + error.code);
                            errorHandler.$error = error.code;
                            listener.close();
                        }, error => {
                            writer.addERROR(error.message);
                        });

                    // Listen to unconfirmed transactions
                    listener
                        .unconfirmedAdded(this.accountAddress)
                        .pipe(filter(transaction => (transaction.transactionInfo !== undefined
                            && transaction.transactionInfo.hash === this.signedTransaction.hash)))
                        .subscribe(transaction => {
                            writer.addText(transaction.transactionInfo.hash + " ⏳ Transaction status changed to unconfirmed.");
                        },
                            error => {
                                writer.addERROR(error.message);
                            });

                    // Listen to confirmed transactions
                    listener
                        .confirmed(this.accountAddress)
                        .pipe(
                            filter(transaction => (transaction.transactionInfo !== undefined
                                && transaction.transactionInfo.hash === this.signedTransaction.hash)))
                        .subscribe(transaction => {
                            resolve({
                                "group": "confirmed",
                                "status": "Success",
                                "hash": transaction.transactionInfo.hash,
                                "height": transaction.deadline.toLocalDateTime,
                            });
                            writer.addText(transaction.transactionInfo.hash + " ✅ Transaction confirmed.");
                            listener.close();
                        }, error => {
                            writer.addERROR(error.message);
                        });

                }).catch(error => {
                    writer.addERROR(error.message);
                });
            }, 0)
        })
    }

    /**
     * Create Listener to announce HashLock transaction and monitor status/confirmed/unconfirmed of hashlock and partial transaction and write responses to file
     * @param writer Writer object with filepath
     * @param errorHandler Error Handler object
     * @param multisigAddress Multisig account address
     * @returns Promise as a result - confirmed or error
     */
    public async createListenerBonded(writer: Writer, errorHandler?: ErrorHandler, multisigAddress?: Address): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (errorHandler === undefined) {
                    errorHandler = new ErrorHandler();
                }
                if (multisigAddress === undefined) {
                    multisigAddress = this.accountAddress;
                }
                const listener = repositoryFactory.createListener();
                listener.open().then(() => {

                    const announcer = new TransactionAnouncer(this.hashLockTransactionSigned);

                    announcer.announceTransaction(writer)
                    // .then(result => {
                    //     const cosignHash = 'cosignHash';
                    //     const group = 'group';
                    //     result[cosignHash] = this.signedTransaction.hash
                    //     result[group] = 'announced'
                    //     resolve(result);
                    // });

                    // Listen to status
                    listener.status(this.accountAddress)
                        .pipe(filter(error => error.hash === this.hashLockTransactionSigned.hash))
                        .subscribe(error => {
                            resolve({
                                "hash": this.signedTransaction.hash,
                                "code": error.code,
                                "group": "failed"
                            });
                            writer.addERROR(this.hashLockTransactionSigned.hash + " ❌" + error.code);
                            errorHandler.$error = error.code;
                            listener.close();
                        }, error => {
                            writer.addERROR(error.message);
                        });

                    // Listen to unconfirmed transactions
                    listener
                        .unconfirmedAdded(this.accountAddress)
                        .pipe(filter(transaction => (transaction.transactionInfo !== undefined
                            && transaction.transactionInfo.hash === this.hashLockTransactionSigned.hash)))
                        .subscribe(transaction => {

                            writer.addText('-------------------------------START---------------------------------------- \n' +
                                '⏳ Transaction status changed to unconfirmed.\n' +
                                'Hash Locked transaction hash: ' + transaction.transactionInfo.hash + '\n' +
                                'Transaction Hash For Cosignatures to sign: ' + this.signedTransaction.hash + '\n' +
                                '-------------------------------END------------------------------------------\n');
                        },
                            error => {
                                writer.addERROR(error.message);
                            });

                    // Listen to confirmed transactions
                    listener
                        .confirmed(this.accountAddress)
                        .pipe(
                            filter((transaction) => transaction.transactionInfo !== undefined
                                && transaction.transactionInfo.hash === this.hashLockTransactionSigned.hash),
                            mergeMap(ignored => transactionHttp.announceAggregateBonded(this.signedTransaction))
                        )
                        .subscribe(announcedAggregateBonded => {
                            writer.addText(this.signedTransaction.hash + " " + announcedAggregateBonded.message);
                            const secondListener = new BlockchainListener(this.signedTransaction, multisigAddress);
                            secondListener.createListener(writer)
                            resolve({
                                "hash": this.signedTransaction.hash,
                                "group": "partial",
                                "status": "Success",
                                "cosignHash": this.signedTransaction.hash
                            });
                        },
                            err => {
                                writer.addERROR(err.message);
                            });

                }).catch(error => {
                    writer.addERROR(error.message);
                });
            }, 0)
        })
    }
}