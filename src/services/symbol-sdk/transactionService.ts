import {
  Account,
  AggregateTransaction,
  Address,
  Deadline,
  PlainMessage,
  NamespaceId,
  Mosaic,
  MosaicId,
  MosaicSupplyChangeAction,
  MosaicSupplyChangeTransaction,
  RepositoryFactoryHttp,
  TransferTransaction,
  UInt64,
  UnresolvedAddress,
  TransactionGroup,
  HashLockTransaction,
  PublicAccount,
  CosignatureTransaction,
  CosignatureSignedTransaction,
  TransactionMapping,
} from 'symbol-sdk';

import { SafeTransaction } from "../../helpers/safeTransaction";
import { BlockchainListener } from "../../helpers/transactionListener";
import { TransactionAnouncer } from "../../helpers/transactionAnouncer";
import "../../../utils/env-config";
import { Constants } from "../../helpers/constants";
import { Writer } from "../../helpers/writer";
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { blockchainService } from "../../services/symbol-sdk/blockchainService";


// Environment variables
const networkGenerationHash = process.env.nemesisGenerationHash;
const URL = process.env.URL as string;
const networkName = Constants.NETWORK_IDENTIFIER;

// HTTP
const repositoryFactory = new RepositoryFactoryHttp(URL);
const chainHttp = repositoryFactory.createChainRepository();
const namespaceHttp = repositoryFactory.createNamespaceRepository();
const transactionStatusHttp = repositoryFactory.createTransactionStatusRepository();

const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;

interface TransactionStatusResponse {
  group: string,
  height: number,
  transactionSafety: string
  blockConfirmationsSinceAnnouncing: string
}

interface ServerResponse {
  data: TransactionStatusResponse
}


/**
 * Class to handle Transactions
 */
export class TransactionService {
  /**
   * Creates transfer transaction from the account linked to the provided senderPrivateKey to
   * the account linked to the specified recipientAddress. Sends chosen amount of mosaics
   * connected to the namespaceName. Adds a plain string messageto the transaction.
   * Signs transaction with the privateKey account and announces to the network.
   * @param senderPrivateKey Account, which is going to send transaction, Private Key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param namespaceString Namespace name which is linked to mosaic
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   */
  public async sendTransaction(
      senderPrivateKey: string,
      recipientAddressString: string,
      amount: number,
      namespaceString: string,
      message: string,
      writer: Writer
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {

        const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();

        const recipientAddress = Address.createFromRawAddress(recipientAddressString);
        const namespaceId = new NamespaceId(namespaceString);

        const mosaicId = await firstValueFrom(namespaceHttp.getLinkedMosaicId(namespaceId));
        const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amount));
        writer.addText(message);

        const transferTransaction = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            recipientAddress,
            [mosaic],
            PlainMessage.create(message),
            networkName
        ).setMaxFee(medianFeeMultiplier);
        const account = Account.createFromPrivateKey(senderPrivateKey, networkName);
        const signedTransaction = account.sign(transferTransaction, networkGenerationHash);
        const listener = new BlockchainListener(signedTransaction, account.address);
        listener.createListener(writer);

        new TransactionAnouncer(signedTransaction).announceTransaction(writer)
            .then(result => resolve(result));

      } catch (error) {
        writer.addERROR(error.message);
        reject(error);
      }
    });
  }

  /**
   * Creates transfer transaction from the account linked to the provided senderPrivateKey to
   * the account linked to the specified recipientAddress. Sends chosen amount of mosaics
   * connected to the mosaic id. Adds a plain string messageto the transaction.
   * Signs transaction with the privateKey account and announces to the network.
   * @param senderPrivateKey Account, which is going to send transaction, Private Key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param mosaicIdString Mosaic id which is going to be transfered
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   */
  public async sendTransactionWithMosaicId(
      senderPrivateKey: string,
      recipientAddressString: string,
      amount: number,
      mosaicIdString: string,
      message: string,
      writer: Writer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const recipientAddress = Address.createFromRawAddress(
              recipientAddressString
          );

          const mosaicId = new MosaicId(mosaicIdString);
          try {
            const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amount));
            writer.addText(message);
            const transferTransaction = TransferTransaction.create(
                Deadline.create(epochAdjustment),
                recipientAddress,
                [mosaic],
                PlainMessage.create(message),
                networkName,
                UInt64.fromUint(maxFee)
            );

            const account = Account.createFromPrivateKey(senderPrivateKey, networkName);
            const signedTransaction = account.sign(
                transferTransaction,
                networkGenerationHash,
            );

            const listener = new BlockchainListener(
                signedTransaction,
                account.address
            );
            listener.createListener(writer);

            const announcer = new TransactionAnouncer(signedTransaction);

            announcer.announceTransaction(writer)
                .then(result => resolve(result));
          } catch (error) {
            writer.addERROR(error.message);
            reject(error);
          }

        } catch (error) {
          writer.addERROR(error.message);
          reject(error);
        }
      }, 0);
    });
  }

  /**
   * Creates transfer transaction from the account linked to the provided senderPrivateKey to
   * the account linked to the specified recipientAddress. Sends chosen amount of mosaics
   * connected to the mosaicId. Adds a plain string message to the transaction.
   * Signs transaction with the privateKey account and announces to the network.
   * @param senderPrivateKey Account, which is going to send transaction, Private Key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param mosaicIdString Mosaic Id string
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   */
  public async sendTransactionMosaic(
      senderPrivateKey: string,
      recipientAddressString: string,
      amount: number,
      mosaicIdString: string,
      message: string,
      writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const recipientAddress = Address.createFromRawAddress(
              recipientAddressString
          )
          const mosaicId = new MosaicId(mosaicIdString);
          const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amount));

          const transferTransaction = TransferTransaction.create(
              Deadline.create(epochAdjustment),
              recipientAddress,
              [mosaic],
              PlainMessage.create(message),
              networkName,
              UInt64.fromUint(maxFee)
          );

          const account = Account.createFromPrivateKey(senderPrivateKey, networkName);
          const signedTransaction = account.sign(
              transferTransaction,
              networkGenerationHash,
          );

          const listener = new BlockchainListener(
              signedTransaction,
              account.address
          );
          listener.createListener(writer);

          const announcer = new TransactionAnouncer(signedTransaction);

          announcer.announceTransaction(writer)
              .then(result => resolve(result));
        } catch (error) {
          writer.addERROR(error.message);
          reject(error);
        }
      }, 0);
    });
  }

  /**
   * Creates transfer transaction from the account linked to the provided senderPrivateKey to
   * the account linked to the specified recipientAddress. Sends chosen amount of mosaics
   * connected to the namespaceName. Adds a plain string messageto the transaction.
   * Signs transaction with the privateKey account and announces to the network.
   * @param senderPrivateKey Account, which is going to send transaction, Private Key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param namespaceString Namespace name which is linked to mosaic
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   */
  public async sendTransactionJSON(
      senderPrivateKey: string,
      recipientAddressString: string,
      amount: number,
      namespaceString: string,
      message: string,
      writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const recipientAddress = Address.createFromRawAddress(
              recipientAddressString
          );

          const namespaceId = new NamespaceId(namespaceString);

          namespaceHttp.getLinkedMosaicId(namespaceId).subscribe(
              (mosaicId: any) => {
                try {
                  const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amount));
                  writer.addText(message);
                  const transferTransaction = TransferTransaction.create(
                      Deadline.create(epochAdjustment),
                      recipientAddress,
                      [mosaic],
                      PlainMessage.create(message),
                      networkName,
                      UInt64.fromUint(maxFee)
                  );

                  const account = Account.createFromPrivateKey(senderPrivateKey, networkName);
                  const signedTransaction = account.sign(
                      transferTransaction,
                      networkGenerationHash,
                  );

                  const listener = new BlockchainListener(
                      signedTransaction,
                      account.address
                  );
                  listener.createListener(writer);

                  const announcer = new TransactionAnouncer(signedTransaction);

                  announcer.announceTransaction(writer)
                      .then(result => resolve(result));
                } catch (error) {
                  writer.addERROR(error.message);
                  reject(error);
                }
              },
              (err: any) => {
                writer.addERROR(err.message);
                reject(err);
              },
          );
        } catch (error) {
          writer.addERROR(error.message);
          reject(error);
        }
      }, 0);
    });
  }

  /**
   * Gets transaction status for given transaction hash
   * @param hash Transaction hash to check
   * @returns Response from blockchain as JSON
   */
  public async getTransactionStatus(hash: string) {
    return new Promise((resolve, reject) => {
      axios.get<TransactionStatusResponse>(URL + "/transactionStatus/" + hash).then(response => {
        const {data} = response;
        if (data.group === "confirmed") {
          chainHttp.getChainInfo().subscribe((blockHeight: any) => {
            const safety = blockHeight.height.compact() - data.height;
            const safeTransaction = new SafeTransaction(safety);
            data["transactionSafety"] = safeTransaction.transactionSafety();
            data["blockConfirmationsSinceAnnouncing"] = safety.toString();
            resolve(data);
          }, (error: any) => {
            reject(error);
          })
        } else resolve(data);
      })
      .catch((error: any) => {
        reject(error);
      });
    })

  }

  /**
   * Get transaction information for given transaction hash
   * @param hash Transaction hash to get information for
   * @returns Response from blockchain as JSON
   */
  public async getConfirmedTransactionInfo(hash: string) {
    return new Promise((resolve, reject) => {
      axios.get(URL + "/transactions/confirmed/" + hash).then(response => {
        resolve(response.data);
      }).catch((err: any) => reject(err))
    })
  }

  /**
   * Pings the status of the transaction until its group is confirmed
   * @param hash Transaction hash which is to be waited for
   * @param writer Writer object with filepath
   */
  public async waitForTransactionStatus(hash: string, statusString: string, writer: Writer) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        writer.addTASK("Wait for transaction to be " + statusString + ".");
        let group: string = "";

        while (group !== statusString) {
          await transactionService.getTransactionStatus(hash).then((status: any) => {
            group = status.group
          }).catch(err => {
            reject(err);
          });
          if (group === statusString) {
            resolve(group);
          }
        }
      }, 1000);
    });
  }

  /**
   * Waits for the specified transaction to be confirmed and added to the block (finilised).
   * @param hash Transaction hash which is to be waited for
   * @param address Account address to listen to
   * @param isMultisig Is the transaction multisig
   * @param writer Writer object with filepath
   * @param hashLock? (optional) hash lock transaction hash for error listening
   */
  public async waitForFinalizedTransaction(hash: string, address: UnresolvedAddress, isMultisig: boolean, writer: Writer, hashLock?: string) {
    return new Promise(async (resolve, reject) => {
      if (!hashLock) hashLock = hash;

      try {
        writer.addTASK("Wait for transaction to be confirmed.");
        const confirmationListener = repositoryFactory.createListener();
        const errorListener = repositoryFactory.createListener();
        await confirmationListener.open();
        await errorListener.open();

        firstValueFrom(confirmationListener.confirmed(address, hash, isMultisig)).then(confirmedTransaction => {
          confirmationListener.close();
          errorListener.close();

          resolve({
            hash: confirmedTransaction.transactionInfo.hash,
            height: confirmedTransaction.deadline.toLocalDateTime,
            group: "confirmed",
          })
        });

        firstValueFrom(errorListener.status(address, hashLock)).then(errorTransaction => {
          confirmationListener.close();
          errorListener.close();

          reject({message: errorTransaction.code});
        })

        firstValueFrom(transactionStatusHttp.getTransactionStatus(hashLock)).then(status => {
          if (status.code != "Success" && status.code != "Neutral") reject({message: status.code});
          if (status.code == "Success" && status.group != "unconfirmed")
            resolve({
              hash: status.hash,
              height: status.deadline.toLocalDateTime,
              group: "confirmed"
            })
        }).catch((e) => { /* status check was too early */
        })
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Waits for the specified transaction to be confirmed.
   * @param hash Transaction hash which is to be waited for
   * @param address Account address to listen to
   * @param isMultisig Is the transaction multisig
   * @param writer Writer object with filepath
   * @param hashLock? (optional) hash lock transaction hash for error listening
   */
  public async waitForConfirmedTransaction(hash: string, address: UnresolvedAddress, isMultisig: boolean, writer: Writer, hashLock?: string) {
    return new Promise(async (resolve, reject) => {
      if (!hashLock) hashLock = hash;

      try {
        writer.addTASK("Wait for transaction to be confirmed.");
        const confirmationListener = repositoryFactory.createListener();
        const errorListener = repositoryFactory.createListener();
        await confirmationListener.open();
        await errorListener.open();

        firstValueFrom(confirmationListener.confirmed(address, hash, isMultisig)).then(confirmedTransaction => {
          confirmationListener.close();
          errorListener.close();

          resolve({
            hash: confirmedTransaction.transactionInfo.hash,
            height: confirmedTransaction.deadline.toLocalDateTime,
            group: "confirmed",
          })
        });

        firstValueFrom(errorListener.status(address, hashLock)).then(errorTransaction => {
          confirmationListener.close();
          errorListener.close();

          reject({message: errorTransaction.code});
        })

        firstValueFrom(transactionStatusHttp.getTransactionStatus(hashLock)).then(status => {
          if (status.code != "Success" && status.code != "Neutral") reject({message: status.code});
          if (status.code == "Success" && status.group == "confirmed"){
            resolve({
              hash: status.hash,
              height: status.deadline.toLocalDateTime,
              group: "confirmed"
            })
          }
        }).catch((e) => { /* status check was too early */ })
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Waits for the specified transaction to be confirmed.
   * @param hash Transaction hash which is to be waited for
   * @param address Account address to listen to
   * @param isMultisig Is the transaction multisig
   * @param writer Writer object with filepath
   */
  public async waitForBondedTransaction(hash: string, address: UnresolvedAddress, isMultisig: boolean, writer: Writer, hashLock?: string) {
    return new Promise(async (resolve, reject) => {
      if (!hashLock) hashLock = hash;
      try {
        writer.addTASK("Wait for transaction to be partial.");
        const bondedListener = repositoryFactory.createListener();
        const errorListener = repositoryFactory.createListener();
        await bondedListener.open();
        await errorListener.open();

        firstValueFrom(bondedListener.aggregateBondedAdded(address, hash, isMultisig)).then(bondedTransaction => {
          bondedListener.close();
          errorListener.close();

          resolve({
            hash: bondedTransaction.transactionInfo.hash,
            height: bondedTransaction.deadline.toLocalDateTime,
            group: "partial",
          })
        });

        firstValueFrom(errorListener.status(address, hashLock)).then(errorTransaction => {
          bondedListener.close();
          errorListener.close();

          reject({message: errorTransaction.code});
        })

        firstValueFrom(transactionStatusHttp.getTransactionStatus(hashLock)).then(status => {
          if (status.code != "Success" && status.code != "Neutral") reject({message: status.code});
          if (status.code == "Success")
            resolve({
              hash: status.hash,
              height: status.deadline.toLocalDateTime,
              group: "partial"
            })
        }).catch((e) => { /* status check was too early */
        })

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sends transaction to multiple recipients
   * @param senderPrivateKey Account, which is going to send transaction, Private Key
   * @param recipientsList Multiple recipients addresses list
   * @param amount Amount of mosaics to send
   * @param namespaceName Namespace name which is linked to mosaic
   * @param message is a message which is attached to each transaction
   * @param writer Writer object with filepath
   */
  public async sendToMultipleTransaction(recipientsList: string[], senderPrivateKey: string, amount: number, namespaceName: string, message: string, writer: Writer): Promise<string[]> {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const transactions: string[] = [];
        await recipientsList.forEach((recipient: string) => {
          transactionService.sendTransaction(
              senderPrivateKey,
              recipient,
              amount,
              namespaceName.toLowerCase(),
              message,
              writer
          ).then(result => {
            transactions.push(result.hash);
          }).catch(err =>
              reject(new Error(err))
          );
        });
        // NESULAUKIA CIKLO PABAIGOOOOOS!!!
        resolve(transactions);
      }, 0);
    });

  }

  /**
   * Creates transfer transaction from the account linked to the provided buyerPrivateKey to
   * the account linked to the specified sellerPublicKey. Sends chosen amount of mosaics
   * from the account linked to the provided sellerPublicKey to
   * the account linked to the specified buyerPrivateKey. Adds a plain string message to the transaction.
   * Signs transaction with the privateKey account and announces to the network.
   * @param buyerPrivateKey Account, which is going to buy, Private Key
   * @param sellerPublicKey Public Key of the seller
   * @param mosaicAmount Amount of mosaics to send
   * @param costCurrency cost of the asset
   * @param mosaicId Id of the mosaic to be sold
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   * @param feeMultiplier median fee multiplier to set maxFee dynamically
   */
  public async sellMosaicTransactionBonded(
      buyerPrivateKey: string,
      sellerPublicKey: string,
      mosaicAmount: number,
      costCurrency: number,
      mosaicId: string,
      message: string,
      writer: Writer,
      feeMultiplier: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const buyerAccount = Account.createFromPrivateKey(buyerPrivateKey, networkName);
        const buyerAddress = Address.createFromRawAddress(buyerAccount.address.plain());

        const sellerPublicAccount = PublicAccount.createFromPublicKey(sellerPublicKey, networkName);
        const sellerAddress = Address.createFromRawAddress(sellerPublicAccount.address.plain());

        const toSellMosaicId = new MosaicId(mosaicId);
        const toSellMosaic = new Mosaic(toSellMosaicId, UInt64.fromUint(mosaicAmount));

        const currencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);
        const currencyMosaic = new Mosaic(currencyMosaicId, UInt64.fromUint(costCurrency));

        writer.addText(message);

        const mosaicTransferTransaction = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            buyerAddress,
            [toSellMosaic],
            PlainMessage.create(message),
            networkName,
        );

        const currencyTransferTransaction = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            sellerAddress,
            [currencyMosaic],
            PlainMessage.create(message),
            networkName,
        );

        const aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(Constants.EPOCH_ADJUSTMENT),
            [
              currencyTransferTransaction.toAggregate(buyerAccount.publicAccount).setMaxFee(feeMultiplier),
              mosaicTransferTransaction.toAggregate(sellerPublicAccount).setMaxFee(feeMultiplier)
            ],
            networkName,
            [],
        ).setMaxFeeForAggregate(feeMultiplier, 2);

        const cosignTransaction = buyerAccount.sign(
            aggregateTransaction,
            networkGenerationHash);

        const hashLockTransaction = HashLockTransaction.create(
            Deadline.create(epochAdjustment),
            new Mosaic(
                currencyMosaicId,
                UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
            ),
            UInt64.fromUint(480),
            cosignTransaction,
            networkName,
            UInt64.fromUint(maxFee),
        );

        const signedHashLockTransaction = buyerAccount.sign(
            hashLockTransaction,
            networkGenerationHash);

        const listener = new BlockchainListener(cosignTransaction, buyerAccount.address, signedHashLockTransaction);
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
        writer.addERROR(error.message);
        reject(error);
      }
    });
  }

  /**
   * Creates transfer transaction from the account linked to the provided buyerPrivateKey to
   * the account linked to the specified sellerPublicKey. Sends chosen amount of mosaics
   * from the account linked to the provided sellerPublicKey to
   * the account linked to the specified buyerPrivateKey. Adds a plain string message to the transaction.
   * Both transactions are signed by participants and aggregate complete transaction.
   * Is announced to the blockchain.
   * @param buyerPrivateKey Account, which is going to buy, Private Key
   * @param sellerPrivateKey Private Key of the seller
   * @param mosaicAmount Amount of mosaics to send
   * @param costCurrency cost of the asset
   * @param mosaicId Id of the mosaic to be sold
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   * @param feeMultiplier median fee multiplier to set maxFee dynamically
   */
  public async sellMosaicTransactionComplete(
      buyerPrivateKey: string,
      sellerPrivateKey: string,
      mosaicAmount: number,
      costCurrency: number,
      mosaicId: string,
      message: string,
      writer: Writer,
      feeMultiplier: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const buyerAccount = Account.createFromPrivateKey(buyerPrivateKey, networkName);
        const buyerAddress = Address.createFromRawAddress(buyerAccount.address.plain());

        const sellerAccount = Account.createFromPrivateKey(sellerPrivateKey, networkName);
        const sellerPublicAccount = sellerAccount.publicAccount;
        const sellerAddress = Address.createFromRawAddress(sellerAccount.address.plain());

        const toSellMosaicId = new MosaicId(mosaicId);
        const toSellMosaic = new Mosaic(toSellMosaicId, UInt64.fromUint(mosaicAmount));

        const currencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);
        const currencyMosaic = new Mosaic(currencyMosaicId, UInt64.fromUint(costCurrency));

        writer.addText(message);

        const mosaicTransferTransaction = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            buyerAddress,
            [toSellMosaic],
            PlainMessage.create(message),
            networkName,
        );

        const currencyTransferTransaction = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            sellerAddress,
            [currencyMosaic],
            PlainMessage.create(message),
            networkName,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(Constants.EPOCH_ADJUSTMENT),
            [
              currencyTransferTransaction.toAggregate(buyerAccount.publicAccount).setMaxFee(feeMultiplier),
              mosaicTransferTransaction.toAggregate(sellerPublicAccount).setMaxFee(feeMultiplier)
            ],
            networkName,
            [],
        ).setMaxFeeForAggregate(feeMultiplier, 2);

        const cosignTransaction = buyerAccount.sign(
            aggregateTransaction,
            networkGenerationHash
        );

        const cosignedTransactioneller = CosignatureTransaction.signTransactionPayload(
            sellerAccount,
            cosignTransaction.payload,
            networkGenerationHash,
        );

        const cosignatureSignedTransactions = [
          new CosignatureSignedTransaction(
              cosignedTransactioneller.parentHash,
              cosignedTransactioneller.signature,
              cosignedTransactioneller.signerPublicKey,
          ),
        ];

        const rectreatedAggregateTransactionFromPayload = TransactionMapping.createFromPayload(
            cosignTransaction.payload,
        ) as AggregateTransaction;

        const signedTransactionComplete = buyerAccount.signTransactionGivenSignatures(
            rectreatedAggregateTransactionFromPayload,
            cosignatureSignedTransactions,
            networkGenerationHash,
        );


        const nodeUrl = process.env.URL as string;
        const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
        const transactionHttp = repositoryFactory.createTransactionRepository();

        transactionHttp.announce(signedTransactionComplete).subscribe({
          next: (x) => {
            const listener = new BlockchainListener(signedTransactionComplete, buyerAccount.address);
            listener.createListener(writer)
                .then((result) => {
                  if (result.group === "confirmed") {
                    resolve(result);
                  }
                  else if (result.group === "failed") {
                    reject(result.code);
                  }
                });
            //resolve(x)
          },
          error: (err) => {
            writer.addERROR(err.message);
            reject(err);
          },
        });
      } catch (error) {
        writer.addERROR(error.message);
        reject(error);
      }
    });
  }

}

export const transactionService = new TransactionService();

