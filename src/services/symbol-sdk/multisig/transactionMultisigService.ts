import {
  Account,
  Address,
  AggregateTransaction,
  CosignatureSignedTransaction,
  CosignatureTransaction,
  Deadline,
  HashLockTransaction,
  Mosaic,
  MosaicId,
  NamespaceId,
  PlainMessage,
  PublicAccount,
  RepositoryFactoryHttp,
  TransactionGroup,
  TransferTransaction,
  UInt64,
} from 'symbol-sdk';

import { BlockchainListener } from "../../../helpers/transactionListener";
import "../../../../utils/env-config";
import { Constants } from "../../../helpers/constants";
import { mergeMap, map } from "rxjs/operators";
import { Writer } from "../../../helpers/writer";
import { ErrorHandler } from "../../../helpers/errorHandler";
import * as net from "net";
import { TransactionAnouncer } from '../../../helpers/transactionAnouncer';
import { transactionService } from '../transactionService';
import { blockchainService } from "../blockchainService";


// Environment variables
const networkGenerationHash = process.env.nemesisGenerationHash;
const networkName = Constants.NETWORK_IDENTIFIER;
const URL = process.env.URL as string;

// Creators

const repositoryFactory = new RepositoryFactoryHttp(URL);
const transactionHttp = repositoryFactory.createTransactionRepository();
const namespaceHttp = repositoryFactory.createNamespaceRepository();

const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;

// symbol.xym id
const networkCurrencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);
// network currency divisibility
const networkCurrencyDivisibility = Constants.NETWORK_CURRENCY_DIVISIBILITY;

interface Royalty {
  address: string,
  percentage: number
}

/**
 * Class to handle Transactions with multisig account
 */
export class TransactionMultisigService {
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
   * Sends transaction with multisig account.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param namespaceString Namespace name which is linked to mosaic
   * @param $message Message to send with transaction
   * @param writer Writer object with filepath
   * @param errorHandler errorHandler object
   * @param script true if comes from script
   * @param divisibility optional
   */
  public async sendMultisigTransaction(
      multisigAccountPublicKey: string,
      cosignatoryPrivateKey: string,
      recipientAddressString: string,
      amount: number,
      namespaceString: string,
      writer: Writer,
      message?: string,
      errorHandler?: ErrorHandler,
      script?: boolean,
      divisibility?: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const cosignatoryAccount = Account.createFromPrivateKey(
              cosignatoryPrivateKey,
              networkName,
          );

          const multisigAccount = PublicAccount.createFromPublicKey(
              multisigAccountPublicKey,
              networkName,
          );

          const recipientAddress = Address.createFromRawAddress(recipientAddressString);

          const namespaceId = new NamespaceId(namespaceString);

          namespaceHttp.getLinkedMosaicId(namespaceId).subscribe(
              (mosaicId) => {
                try {
                  const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amount));

                  const transferTransaction = TransferTransaction.create(
                      Deadline.create(epochAdjustment),
                      recipientAddress,
                      [mosaic],
                      PlainMessage.create(message),
                      networkName,
                      UInt64.fromUint(maxFee)
                  );

                  const aggregateTransaction = AggregateTransaction.createBonded(
                      Deadline.create(epochAdjustment),
                      [transferTransaction.toAggregate(multisigAccount)],
                      networkName,
                      [],
                      UInt64.fromUint(maxFee)
                  );

                  const cosignTransaction = cosignatoryAccount.sign(
                      aggregateTransaction,
                      networkGenerationHash,
                  );
                  this.$cosignHash = cosignTransaction.hash;

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

                  this.$signedHash = signedHashLockTransaction.hash;

                  const listener = new BlockchainListener(
                      cosignTransaction,
                      cosignatoryAccount.address,
                      signedHashLockTransaction
                  );

                  if (script) {
                    listener.createListenerBonded(writer, errorHandler).then(result => {
                      const hash = "cosignHash";
                      result[hash] = cosignTransaction;
                      resolve(result);
                    });
                  } else {
                    listener
                        .createListenerBonded(writer, errorHandler, multisigAccount.address)
                        .then(result => {
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
              },
              (err) => {
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
   * Sends transaction with multisig account.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param mosaicIdString Mosaic Id string
   * @param writer Writer object with filepath
   * @param feeMultiplier median fee multiplier to set maxFee dynamically
   * @param $message Message to send with transaction
   * @param errorHandler errorHandler object
   * @param script true if comes from script
   * @param divisibility optional
   */
  public async sendMultisigTransactionMosaic(
      multisigAccountPublicKey: string,
      cosignatoryPrivateKey: string,
      recipientAddressString: string,
      amount: number,
      mosaicIdString: string,
      writer: Writer,
      feeMultiplier: number,
      message?: string,
      errorHandler?: ErrorHandler,
      script?: boolean,
      divisibility?: number
  ): Promise<any> {
    return new Promise( (resolve, reject) => {
      setTimeout(async () => {
        try {
          const cosignatoryAccount = Account.createFromPrivateKey(
              cosignatoryPrivateKey,
              networkName,
          );

          const multisigAccount = PublicAccount.createFromPublicKey(
              multisigAccountPublicKey,
              networkName,
          );

          const recipientAddress = Address.createFromRawAddress(recipientAddressString);

          const mosaicId = new MosaicId(mosaicIdString);
          const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amount));

          const transferTransaction = TransferTransaction.create(
              Deadline.create(epochAdjustment),
              recipientAddress,
              [mosaic],
              PlainMessage.create(message),
              networkName,
          );

          const aggregateTransaction = AggregateTransaction.createBonded(
              Deadline.create(epochAdjustment),
              [transferTransaction.toAggregate(multisigAccount).setMaxFee(feeMultiplier)],
              networkName,
              [],
          ).setMaxFeeForAggregate(feeMultiplier, 2);

          const cosignTransaction = cosignatoryAccount.sign(
              aggregateTransaction,
              networkGenerationHash,
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

          const signedHashLockTransaction = cosignatoryAccount.sign(
              hashLockTransaction,
              networkGenerationHash,
          );

          this.$signedHash = signedHashLockTransaction.hash;

          const announcer1 = new TransactionAnouncer(signedHashLockTransaction);
          await announcer1.announceTransaction(writer);

          await transactionService.waitForConfirmedTransaction(
              signedHashLockTransaction.hash,
              cosignatoryAccount.address, // the change
              true,
              writer
          )

          const announcer2 = new TransactionAnouncer(cosignTransaction);
          await announcer2.announceAggregateBondedTransaction(writer);

          const bondedTransaction = await transactionService.waitForConfirmedTransaction(
              cosignTransaction.hash,
              cosignatoryAccount.address,
              false,
              writer
          )

          resolve(bondedTransaction);
        } catch (error) {
          writer.addERROR(error.message);
          reject(error);
        }
      }, 0);
    });
  }

  /**
   * Sends transaction with multisig account as transaction complete form.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param mosaicIdString Mosaic Id string
   * @param $message Message to send with transaction
   * @param feeMultiplier median fee multiplier to set maxFee dynamically
   * @param writer Writer object with filepath
   * @param errorHandler errorHandler object
   * @param script true if comes from script
   * @param divisibility optional
   */
  public async sendMultisigTransactionMosaicComplete(
    multisigAccountPublicKey: string,
    cosignatoryPrivateKey: string,
    recipientAddressString: string,
    amount: number,
    mosaicIdString: string,
    writer: Writer,
    feeMultiplier: number,
    message?: string,
    errorHandler?: ErrorHandler,
    script?: boolean,
    divisibility?: number
): Promise<any> {
  return new Promise( (resolve, reject) => {
    setTimeout(async () => {
      try {
        const cosignatoryAccount = Account.createFromPrivateKey(
            cosignatoryPrivateKey,
            networkName,
        );

        const multisigAccount = PublicAccount.createFromPublicKey(
            multisigAccountPublicKey,
            networkName,
        );

        const recipientAddress = Address.createFromRawAddress(recipientAddressString);

        const mosaicId = new MosaicId(mosaicIdString);
        const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amount));

        const transferTransaction = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            recipientAddress,
            [mosaic],
            PlainMessage.create(message),
            networkName,
        ).setMaxFee(feeMultiplier);

        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(epochAdjustment),
            [transferTransaction.toAggregate(multisigAccount)],
            networkName,
            [],
        ).setMaxFeeForAggregate(feeMultiplier, 2);

        const cosignTransaction = cosignatoryAccount.sign(
            aggregateTransaction,
            networkGenerationHash,
        );
        this.$cosignHash = cosignTransaction.hash;

        const announcer1 = new TransactionAnouncer(cosignTransaction);
        await announcer1.announceTransaction(writer);

        await transactionService.waitForConfirmedTransaction(
            cosignTransaction.hash,
            cosignatoryAccount.address, // the change
            true,
            writer
        )


        resolve(cosignTransaction);
      } catch (error) {
        writer.addERROR(error.message);
        reject(error);
      }
    }, 0);
  });
}


    /**
   * Sends 2 transactions with multisig account to future multisig and to cosignatory.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientAddressStrings Addresses of the recipients
   * @param amounts Amounts of mosaics to send
   * @param mosaicIdString Mosaic Id string
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   * @param errorHandler errorHandler object
   * @param script true if comes from script
   * @param divisibility optional
   */
  public async sendMultisigTransactionMosaicWithCosignatory(
    multisigAccountPublicKey: string,
    cosignatoryPrivateKey: string,
    recipientAddressStrings: string[],
    amounts: number[],
    mosaicIdString: string,
    writer: Writer,
    feeMultiplier: number,
    message?: string,
    errorHandler?: ErrorHandler,
    script?: boolean,
    divisibility?: number
): Promise<any> {
  return new Promise( (resolve, reject) => {
    setTimeout(async () => {
      try {
        const cosignatoryAccount = Account.createFromPrivateKey(
            cosignatoryPrivateKey,
            networkName,
        );

        const multisigAccount = PublicAccount.createFromPublicKey(
            multisigAccountPublicKey,
            networkName,
        );

        //First transfer transaction to prepare multisig account
        const recipientAddressMultisig = Address.createFromRawAddress(recipientAddressStrings[0]);

        const mosaicId = new MosaicId(mosaicIdString);
        const mosaic = new Mosaic(mosaicId, UInt64.fromUint(amounts[0]));

        const transferTransactionMultisig = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            recipientAddressMultisig,
            [mosaic],
            PlainMessage.create(message),
            networkName,
        );
        //End of first transfer transaction

        //Second transfer transaction to prepare cosignatory account
        const recipientAddressCosignatory = Address.createFromRawAddress(recipientAddressStrings[1]);
        const mosaicCosignatory = new Mosaic(mosaicId, UInt64.fromUint(amounts[1]));
        const transferTransactionCosignatory = TransferTransaction.create(
          Deadline.create(epochAdjustment),
          recipientAddressCosignatory,
          [mosaicCosignatory],
          PlainMessage.create("Second transfer transaction to prepare cosignatory account"),
          networkName,
        )
        //End of second transfer transaction



        const aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(epochAdjustment),
            [
              transferTransactionMultisig.toAggregate(multisigAccount).setMaxFee(feeMultiplier),
              transferTransactionCosignatory.toAggregate(multisigAccount).setMaxFee(feeMultiplier)
            ],
            networkName,
            [],
        ).setMaxFeeForAggregate(feeMultiplier, 2);

        const cosignTransaction = cosignatoryAccount.sign(
            aggregateTransaction,
            networkGenerationHash,
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

        const signedHashLockTransaction = cosignatoryAccount.sign(
            hashLockTransaction,
            networkGenerationHash,
        );

        this.$signedHash = signedHashLockTransaction.hash;

        const announcer1 = new TransactionAnouncer(signedHashLockTransaction);
        await announcer1.announceTransaction(writer);

        await transactionService.waitForConfirmedTransaction(
            signedHashLockTransaction.hash,
            cosignatoryAccount.address, // the change
            true,
            writer
        )

        const announcer2 = new TransactionAnouncer(cosignTransaction);
        await announcer2.announceAggregateBondedTransaction(writer);

        const bondedTransaction = await transactionService.waitForConfirmedTransaction(
            cosignTransaction.hash,
            cosignatoryAccount.address,
            false,
            writer
        )

        resolve(bondedTransaction);
      } catch (error) {
        writer.addERROR(error.message);
        reject(error);
      }
    }, 0);
  });
}





  /**
   * Sends transaction with multisig account using recipient namespace alias.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientAddressNamespace Address namespace alias of the recipient
   * @param amount Amount of mosaics to send
   * @param mosaicIdString Mosaic Id string
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   * @param errorHandler errorHandler object
   * @param script true if comes from script
   * @param divisibility optional
   */
  public async sendMultisigTransactionMosaicAlias(
      multisigAccountPublicKey: string,
      cosignatoryPrivateKey: string,
      recipientAddressNamespace: string,
      amount: number,
      mosaicIdString: string,
      message: string,
      writer: Writer,
      errorHandler?: ErrorHandler,
      script?: boolean,
      divisibility?: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const cosignatoryAccount = Account.createFromPrivateKey(
              cosignatoryPrivateKey,
              networkName,
          );

          const multisigAccount = PublicAccount.createFromPublicKey(
              multisigAccountPublicKey,
              networkName,
          );

          const recipientAddress = new NamespaceId(recipientAddressNamespace);

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

          const aggregateTransaction = AggregateTransaction.createBonded(
              Deadline.create(epochAdjustment),
              [transferTransaction.toAggregate(multisigAccount)],
              networkName,
              [],
              UInt64.fromUint(maxFee)
          );

          const cosignTransaction = cosignatoryAccount.sign(
              aggregateTransaction,
              networkGenerationHash,
          );
          this.$cosignHash = cosignTransaction.hash;

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

          this.$signedHash = signedHashLockTransaction.hash;

          const listener = new BlockchainListener(
              cosignTransaction,
              cosignatoryAccount.address,
              signedHashLockTransaction
          );

          if (script) {
            listener.createListenerBonded(writer, errorHandler).then(result => {
              const hash = "cosignHash";
              result[hash] = cosignTransaction;
              resolve(result);
            });
          } else {
            listener
                .createListenerBonded(writer, errorHandler, multisigAccount.address)
                .then(result => {
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
      }, 0);
    });
  }

  /**
   * Sends cosign transaction
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param transactionHash Transaction hash which is announced as partial
   * @param writer Writer object with filepath
   */
  public coSignTransaction(
      cosignatoryPrivateKey: string,
      transactionHash: string,
      writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const cosignAggregateBondedTransaction = (
              transaction: AggregateTransaction,
              account1: Account,
          ): CosignatureSignedTransaction => {
            const cosignatureTransaction = CosignatureTransaction.create(transaction);
            return account1.signCosignatureTransaction(cosignatureTransaction);
          };

          const account = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);

          transactionHttp
              .getTransaction(transactionHash, TransactionGroup.Partial)
              .pipe(
                  map((transaction) =>
                      cosignAggregateBondedTransaction(
                          transaction as AggregateTransaction,
                          account,
                      ),
                  ),
                  mergeMap((cosignatureSignedTransaction) =>
                      transactionHttp.announceAggregateBondedCosignature(
                          cosignatureSignedTransaction,
                      ),
                  ),
              )
              .subscribe(
                  (announcedTransaction) => {
                    writer.addText(announcedTransaction.message);
                    resolve(announcedTransaction);
                  },
                  (err) => {
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
   * Creates transfer transaction from the multisig account linked to the provided buyerPrivateKey to
   * the multisig account linked to the specified sellerPublicKey. Sends chosen amount of mosaics
   * from the account linked to the provided sellerPublicKey to
   * the account linked to the specified buyerPrivateKey. Adds a plain string message to the transaction.
   * Signs transaction with the privateKey account and announces to the network.
   * @param buyerMultisigPublicKey Multisig Account, which is going to buy, Public Key
   * @param cosignatoryPrivateKey Cosignatory of the multisig account initiating the transaction Private key
   * @param sellerPublicKey Public Key of the seller
   * @param mosaicAmount Amount of mosaics to send
   * @param costCurrency cost of the asset
   * @param mosaicId Id of the mosaic to be sold
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   */
  public async sellMosaicTransactionBonded(
      buyerMultisigPublicKey: string,
      cosignatoryPrivateKey: string,
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
        const buyerAccount = PublicAccount.createFromPublicKey(buyerMultisigPublicKey, networkName);
        const buyerAddress = Address.createFromRawAddress(buyerAccount.address.plain());

        const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);

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
        )

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
              currencyTransferTransaction.toAggregate(buyerAccount).setMaxFee(feeMultiplier),
              mosaicTransferTransaction.toAggregate(sellerPublicAccount).setMaxFee(feeMultiplier)
            ],
            networkName,
            [],
        ).setMaxFeeForAggregate(feeMultiplier, 2);

        const cosignTransaction = cosignatoryAccount.sign(
            aggregateTransaction,
            networkGenerationHash
        );

        const hashLockTransaction = HashLockTransaction.create(
            Deadline.create(epochAdjustment),
            new Mosaic(
                currencyMosaicId,
                UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
            ),
            UInt64.fromUint(480),
            cosignTransaction,
            networkName,
        ).setMaxFee(feeMultiplier);

        const signedHashLockTransaction = cosignatoryAccount.sign(
            hashLockTransaction,
            networkGenerationHash
        );

        const announcer1 = new TransactionAnouncer(signedHashLockTransaction);
        await announcer1.announceTransaction(writer);

        await transactionService.waitForConfirmedTransaction(
            signedHashLockTransaction.hash,
            cosignatoryAccount.address,
            true,
            writer
        )

        const announcer2 = new TransactionAnouncer(cosignTransaction);
        await announcer2.announceAggregateBondedTransaction(writer);

        const bondedTransaction = await transactionService.waitForBondedTransaction(
            cosignTransaction.hash,
            buyerAccount.address,
            false,
            writer
        )

        resolve(bondedTransaction);


      } catch (error) {
        writer.addERROR(error.message);
        reject(error);
      }
    });
  }

  /**
   * Creates transfer transaction from the multisig account linked to the provided buyerPrivateKey to
   * the multisig account linked to the specified sellerPublicKey. Sends chosen amount of mosaics
   * from the account linked to the provided sellerPublicKey to
   * the account linked to the specified buyerPrivateKey. Sends percentages of royalties to specified addresses.
   * Adds a plain string message to the transaction.
   * Signs transaction with the privateKey account and announces to the network.
   * @param buyerMultisigPublicKey Multisig Account, which is going to buy, Public Key
   * @param cosignatoryPrivateKey Cosignatory of the multisig account initiating the transaction Private key
   * @param sellerPublicKey Public Key of the seller
   * @param mosaicAmount Amount of mosaics to send
   * @param costCurrency cost of the asset
   * @param royalties royalties
   * @param mosaicId Id of the mosaic to be sold
   * @param message Message to send with transaction
   * @param writer Writer object with filepath
   */
   public async sellMosaicTransactionRoyalties(
    buyerMultisigPublicKey: string,
    cosignatoryPrivateKey: string,
    sellerPublicKey: string,
    mosaicAmount: number,
    costCurrency: number,
    royalties: Array<Royalty>,
    mosaicId: string,
    message: string,
    writer: Writer
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();

      const buyerAccount = PublicAccount.createFromPublicKey(buyerMultisigPublicKey, networkName);
      const buyerAddress = Address.createFromRawAddress(buyerAccount.address.plain());

      const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);

      const sellerPublicAccount = PublicAccount.createFromPublicKey(sellerPublicKey, networkName);
      const sellerAddress = Address.createFromRawAddress(sellerPublicAccount.address.plain());

      const toSellMosaicId = new MosaicId(mosaicId);
      const toSellMosaic = new Mosaic(toSellMosaicId, UInt64.fromUint(mosaicAmount));

      const currencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);

      let royaltyTransactions = [];
      let remaining = costCurrency;
      let amount, trx, royaltyMosaic, royaltyAddress;
      let totalRoyalties = 0;

      royalties.forEach(entry => {
        amount = costCurrency * entry.percentage / 100;
        remaining -= amount;
        totalRoyalties += entry.percentage;

        if (totalRoyalties > 99) {
          return reject(new Error("Royalties can't make up more than 100% of sum"));
        }

        royaltyMosaic = new Mosaic(currencyMosaicId, UInt64.fromUint(amount));
        royaltyAddress = Address.createFromRawAddress(entry.address);

        trx = TransferTransaction.create(
          Deadline.create(epochAdjustment),
          royaltyAddress,
          [royaltyMosaic],
          PlainMessage.create(message),
          networkName,
        );

        royaltyTransactions.push(trx.toAggregate(buyerAccount).setMaxFee(medianFeeMultiplier));
      });

      const currencyMosaic = new Mosaic(currencyMosaicId, UInt64.fromUint(remaining));

      writer.addText(message);

      const mosaicTransferTransaction = TransferTransaction.create(
          Deadline.create(epochAdjustment),
          buyerAddress,
          [toSellMosaic],
          PlainMessage.create(message),
          networkName
      );
      royaltyTransactions.push(mosaicTransferTransaction.toAggregate(sellerPublicAccount).setMaxFee(medianFeeMultiplier));
      const currencyTransferTransaction = TransferTransaction.create(
          Deadline.create(epochAdjustment),
          sellerAddress,
          [currencyMosaic],
          PlainMessage.create(message),
          networkName
      );
      royaltyTransactions.push(currencyTransferTransaction.toAggregate(buyerAccount).setMaxFee(medianFeeMultiplier));

      const aggregateTransaction = AggregateTransaction.createBonded(
          Deadline.create(Constants.EPOCH_ADJUSTMENT),
          royaltyTransactions,
          networkName,
          [],
      ).setMaxFeeForAggregate(medianFeeMultiplier, 2);

      const cosignTransaction = cosignatoryAccount.sign(
          aggregateTransaction,
          networkGenerationHash
      );

      const hashLockTransaction = HashLockTransaction.create(
          Deadline.create(epochAdjustment),
          new Mosaic(
              currencyMosaicId,
              UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
          ),
          UInt64.fromUint(480),
          cosignTransaction,
          networkName
        ).setMaxFee(medianFeeMultiplier);

      const signedHashLockTransaction = cosignatoryAccount.sign(
          hashLockTransaction,
          networkGenerationHash
      );

      const announcer1 = new TransactionAnouncer(signedHashLockTransaction);
      await announcer1.announceTransaction(writer);

      await transactionService.waitForConfirmedTransaction(
          signedHashLockTransaction.hash,
          cosignatoryAccount.address,
          true,
          writer
      )

      const announcer2 = new TransactionAnouncer(cosignTransaction);
      await announcer2.announceAggregateBondedTransaction(writer);

      const bondedTransaction = await transactionService.waitForBondedTransaction(
          cosignTransaction.hash,
          buyerAccount.address,
          false,
          writer
      )

      resolve(bondedTransaction);


    } catch (error) {
      writer.addERROR(error.message);
      reject(error);
    }
  });
}

  /**
   * Receive transactions from multiple Multisig accounts with the same cosignatory.
   * @param multisigPublicKeysList Multisig accounts public keys list
   * @param cosignatoryPrivateKey Cosignatory account private key
   * @param recipientAddressString Address of the recipient
   * @param amount Amount of mosaics to send
   * @param namespaceString Namespace name which is linked to mosaic
   * @param writer Writer object with filepath
   */
  public receiveTransactionsFromMultiple(
      multisigPublicKeysList: string[],
      cosignatoryPrivateKey: string,
      recipientAddressString: string,
      amount: number,
      namespaceString: string,
      writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // const cosignatoryAccount = Account.createFromPrivateKey(
        //   cosignatoryPrivateKey,
        //   networkName
        // );
        // const recipientAddress = Address.createFromRawAddress(
        //   recipientAddressString
        // );
        // const namespaceId = new NamespaceId(namespaceString);
        // const transferTransaction = transactionCreator.createTransferTransaction(
        //   recipientAddress,
        //   namespaceId,
        //   amount,
        //   "Sending"
        // );

        // // Create Transaction List with different Multisig Accounts
        // const transactionsList: InnerTransaction[] = [];
        // for (
        //   let id = 0;
        //   id < Object.keys(multisigPublicKeysList).length;
        //   id++
        // ) {
        //   const multisigAccount = PublicAccount.createFromPublicKey(
        //     multisigPublicKeysList[id],
        //     networkName
        //   );
        //   transactionsList.push(
        //     transferTransaction.toAggregate(multisigAccount)
        //   );
        // }

        // const aggregateTransaction = transactionCreator.createAggregateTransactionBonded(
        //   transactionsList
        // );

        // const signedTransaction = cosignatoryAccount.sign(
        //   aggregateTransaction,
        //   networkGenerationHash
        // );
        // this.$cosignHash = signedTransaction.hash;

        // const hashLockTransaction = transactionCreator.createHashLockTransaction(
        //   signedTransaction
        // );

        // const hashLockTransactionSigned = cosignatoryAccount.sign(
        //   hashLockTransaction,
        //   networkGenerationHash
        // );
        // this.$signedHash = hashLockTransactionSigned.hash;

        // const listener = new BlockchainListener(
        //   signedTransaction,
        //   cosignatoryAccount.address,
        //   hashLockTransactionSigned
        // );

        // listener.createListenerBonded(writer).then(result => {
        //   if (result.group === "partial") {
        //     const secondListener = new BlockchainListener(
        //       result.cosignHash,
        //       cosignatoryAccount.address
        //     );
        //     secondListener.createListener(writer).then(response => {
        //       if (response.group === "confirmed") {
        //         resolve(response);
        //       } else if (response.group === "failed") {
        //         reject(response);
        //       }
        //     });
        //   } else if (result.group === "failed") {
        //     reject(result);
        //   }
        // });
      }, 0);
    });
  }

  /**
   * Sends transaction to multiple recipients with multisig account.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientsList Multiple recipients addresses list
   * @param amount Amount of mosaics to send
   * @param namespaceString Namespace name which is linked to mosaic
   * @param writer Writer object with filepath
   */
  public sendTransactionToMultiple(
      multisigAccountPublicKey: string,
      cosignatoryPrivateKey: string,
      recipientsList: string[],
      amount: number,
      namespaceString: string,
      writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // const cosignatoryAccount = Account.createFromPrivateKey(
        //   cosignatoryPrivateKey,
        //   networkName
        // );
        // const multisigAccount = PublicAccount.createFromPublicKey(
        //   multisigAccountPublicKey,
        //   networkName
        // );

        // const namespaceId = new NamespaceId(namespaceString);

        // // Create transaction list with multiple recipients
        // const transactionsList: InnerTransaction[] = [];
        // for (let id = 0; id < Object.keys(recipientsList).length; id++) {
        //   const recipientAddress = Address.createFromRawAddress(
        //     recipientsList[id]
        //   );
        //   const transferTransaction = transactionCreator.createTransferTransaction(
        //     recipientAddress,
        //     namespaceId,
        //     amount,
        //     "Sending"
        //   );
        //   transactionsList.push(
        //     transferTransaction.toAggregate(multisigAccount)
        //   );
        // }

        // // group different transactions as one aggregate transaction
        // const aggregateTransaction = transactionCreator.createAggregateTransactionBonded(
        //   transactionsList
        // );

        // const signedTransaction = cosignatoryAccount.sign(
        //   aggregateTransaction,
        //   networkGenerationHash
        // );
        // this.$cosignHash = signedTransaction.hash;

        // const hashLockTransaction = transactionCreator.createHashLockTransaction(
        //   signedTransaction
        // );

        // const hashLockTransactionSigned = cosignatoryAccount.sign(
        //   hashLockTransaction,
        //   networkGenerationHash
        // );
        // this.$signedHash = hashLockTransactionSigned.hash;

        // const listener = new BlockchainListener(
        //   signedTransaction,
        //   cosignatoryAccount.address,
        //   hashLockTransactionSigned
        // );

        // listener.createListenerBonded(writer).then(result => {
        //   if (result.group === "partial") {
        //     const secondListener = new BlockchainListener(
        //       result.cosignHash,
        //       cosignatoryAccount.address
        //     );
        //     secondListener.createListener(writer).then(response => {
        //       if (response.group === "confirmed") {
        //         resolve(response);
        //       } else if (response.group === "failed") {
        //         reject(response);
        //       }
        //     });
        //   } else if (result.group === "failed") {
        //     reject(result);
        //   }
        // });
      }, 0);
    });
  }

  /**
   *
   * Sends multiple transactions (different mosaics) with multisig account.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientAddressString Address of the recipient
   * @param namespaceList Namespace names (which are linked to mosaic) and amount to send list. (namespaceList[i].namespaceName and namespaceList[i].amount)
   * @param writer Writer object with filepath
   */
  public sendMultipleTransaction(
      multisigAccountPublicKey: string,
      cosignatoryPrivateKey: string,
      recipientAddressString: string,
      namespaceList: any,
      writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // const cosignatoryAccount = Account.createFromPrivateKey(
        //   cosignatoryPrivateKey,
        //   networkName
        // );
        // const multisigAccount = PublicAccount.createFromPublicKey(
        //   multisigAccountPublicKey,
        //   networkName
        // );
        // const recipientAddress = Address.createFromRawAddress(
        //   recipientAddressString
        // );

        // // create namespaceId list for further usage
        // const namespaceIDList: NamespaceId[] = [];
        // for (let id = 0; id < Object.keys(namespaceList).length; id++) {
        //   namespaceIDList.push(
        //     new NamespaceId(namespaceList[id].namespaceName)
        //   );
        // }
        // // create transfer transaction with different amount of mosaics
        // const transferTransaction = transactionCreator.createTransferTransactionMultiple(
        //   recipientAddress,
        //   namespaceList,
        //   namespaceIDList
        // );

        // const transactionsList: InnerTransaction[] = [
        //   transferTransaction.toAggregate(multisigAccount)
        // ];

        // const aggregateTransaction = transactionCreator.createAggregateTransactionBonded(
        //   transactionsList
        // );

        // const signedTransaction = cosignatoryAccount.sign(
        //   aggregateTransaction,
        //   networkGenerationHash
        // );
        // this.$cosignHash = signedTransaction.hash;

        // const hashLockTransaction = transactionCreator.createHashLockTransaction(
        //   signedTransaction
        // );

        // const hashLockTransactionSigned = cosignatoryAccount.sign(
        //   hashLockTransaction,
        //   networkGenerationHash
        // );
        // this.$signedHash = hashLockTransactionSigned.hash;

        // const listener = new BlockchainListener(
        //   signedTransaction,
        //   cosignatoryAccount.address,
        //   hashLockTransactionSigned
        // );

        // listener.createListenerBonded(writer).then(result => {
        //   if (result.group === "partial") {
        //     const secondListener = new BlockchainListener(
        //       result.cosignHash,
        //       cosignatoryAccount.address
        //     );
        //     secondListener.createListener(writer).then(response => {
        //       if (response.group === "confirmed") {
        //         resolve(response);
        //       } else if (response.group === "failed") {
        //         reject(response);
        //       }
        //     });
        //   } else if (result.group === "failed") {
        //     reject(result);
        //   }
        // });
      }, 0);
    });
  }

  /**
   * Sends multiple transactions (different mosaics) to multiple recipients with multisig account.
   * @param multisigAccountPublicKey Multisig Account, which is going to send transaction, Public Key
   * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
   * @param recipientsList Multiple recipients addresses list
   * @param namespaceList Namespace names (which are linked to mosaic) and amount to send list. (namespaceList[i].namespaceName and namespaceList[i].amount)
   * @param writer Writer object with filepath
   */
  public sendMultipleTransactionToMultiple(
      multisigAccountPublicKey: string,
      cosignatoryPrivateKey: string,
      recipientsList: string[],
      namespaceList: any,
      writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // const cosignatoryAccount = Account.createFromPrivateKey(
        //   cosignatoryPrivateKey,
        //   networkName
        // );
        // const multisigAccount = PublicAccount.createFromPublicKey(
        //   multisigAccountPublicKey,
        //   networkName
        // );

        // // create namespaceId list for further usage
        // const namespaceIDList: NamespaceId[] = [];
        // for (let id = 0; id < Object.keys(namespaceList).length; id++) {
        //   namespaceIDList.push(
        //     new NamespaceId(namespaceList[id].namespaceName)
        //   );
        // }

        // // Create transactions list with different amount of mosaics to multiple recipients
        // const transactionsList: InnerTransaction[] = [];

        // // Go through all recipients
        // for (let id = 0; id < Object.keys(recipientsList).length; id++) {
        //   const recipientAddress = Address.createFromRawAddress(
        //     recipientsList[id]
        //   );

        //   // create transfer transaction with different amount of mosaics
        //   const transferTransaction = transactionCreator.createTransferTransactionMultiple(
        //     recipientAddress,
        //     namespaceList,
        //     namespaceIDList
        //   );
        //   transactionsList.push(
        //     transferTransaction.toAggregate(multisigAccount)
        //   );
        // }

        // // group different transactions as one aggregate transaction
        // const aggregateTransaction = transactionCreator.createAggregateTransactionBonded(
        //   transactionsList
        // );

        // const signedTransaction = cosignatoryAccount.sign(
        //   aggregateTransaction,
        //   networkGenerationHash
        // );
        // this.$cosignHash = signedTransaction.hash;

        // const hashLockTransaction = transactionCreator.createHashLockTransaction(
        //   signedTransaction
        // );

        // const hashLockTransactionSigned = cosignatoryAccount.sign(
        //   hashLockTransaction,
        //   networkGenerationHash
        // );
        // this.$signedHash = hashLockTransactionSigned.hash;

        // const listener = new BlockchainListener(
        //   signedTransaction,
        //   cosignatoryAccount.address,
        //   hashLockTransactionSigned
        // );

        // listener.createListenerBonded(writer).then(result => {
        //   if (result.group === "partial") {
        //     const secondListener = new BlockchainListener(
        //       result.cosignHash,
        //       cosignatoryAccount.address
        //     );
        //     secondListener.createListener(writer).then(response => {
        //       if (response.group === "confirmed") {
        //         resolve(result);
        //       } else if (response.group === "failed") {
        //         reject(response);
        //       }
        //     });
        //   } else if (result.group === "failed") {
        //     reject(result);
        //   }
        // });
      }, 0);
    });
  }
}

export const transactionMultisigService = new TransactionMultisigService();
