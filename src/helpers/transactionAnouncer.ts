import { SignedTransaction, RepositoryFactoryHttp, TransactionService, TransactionHttp, IListener, AggregateTransaction } from "symbol-sdk";

import '../../utils/env-config';
import { Writer } from "./writer";

const URL = process.env.URL as string;

const repositoryFactory = new RepositoryFactoryHttp(URL);
const transactionHttp = repositoryFactory.createTransactionRepository();
const receiptHttp = repositoryFactory.createReceiptRepository();
const transactionService = new TransactionService(transactionHttp, receiptHttp);

/**
 * Class to announce transactions to the network
 */
export class TransactionAnouncer {

    /**
     * 
     * @param signedTransaction signed transaction to announce
     */
    constructor(public readonly signedTransaction: SignedTransaction) { }

    /**
     * Announce transction and write response to file
     * @param writer Writer object with filepath
     * @returns Announced transaction as promise
     */
    public announceTransaction(writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            const hash = this.signedTransaction.hash;
            var message: string;
            transactionHttp.announce(this.signedTransaction)
            .subscribe({
                next(x) {
                    message = x.message;
                },
                error(err) {
                    writer.addERROR(err);
                    reject(err.message);
                },
                complete() {
                    writer.addText(hash + " " + message);
                    resolve({
                        hash: hash,
                        message: message
                    });
                }
            });
        })
    }

    /**
     * Announce transction and write response to file
     * @param writer Writer object with filepath
     * @returns Announced transaction as promise
     */
     public announceAggregateBondedTransaction(writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            const hash = this.signedTransaction.hash;
            var message: string;
            transactionHttp.announceAggregateBonded(this.signedTransaction)
            .subscribe({
                next(x) {
                    message = x.message;
                },
                error(err) {
                    writer.addERROR(err);
                    reject(err.message);
                },
                complete() {
                    writer.addText(hash + " " + message);
                    resolve({
                        hash: hash,
                        message: message
                    });
                }
            });
        })
    }
}