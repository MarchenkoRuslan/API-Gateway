import {
  Account,
  AggregateTransaction,
  AliasAction,
  AliasTransaction,
  Deadline,
  HashLockTransaction,
  MosaicDefinitionTransaction,
  MosaicFlags,
  MosaicId,
  Mosaic,
  MosaicNonce,
  MosaicSupplyChangeAction,
  MosaicSupplyChangeTransaction,
  NamespaceId,
  RepositoryFactoryHttp,
  UInt64,
  TransactionGroup,
  Transaction,
  Page,
} from 'symbol-sdk';

import { BlockchainListener } from "../../helpers/transactionListener";
import { TransactionAnouncer } from "../../helpers/transactionAnouncer";
import "../../../utils/env-config";
import { Constants } from "../../helpers/constants";
import { Writer } from "../../helpers/writer";

// Environment variables
const networkGenerationHash = process.env.nemesisGenerationHash;
const URL = process.env.URL as string;
const networkName = Constants.NETWORK_IDENTIFIER;

const repositoryFactory = new RepositoryFactoryHttp(URL);
const mosaicHttp = repositoryFactory.createMosaicRepository();
const transactionHttp = repositoryFactory.createTransactionRepository();

const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;


// symbol.xym id
const networkCurrencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);
// network currency divisibility
const networkCurrencyDivisibility = Constants.NETWORK_CURRENCY_DIVISIBILITY;

/**
 * Class to handle Mosaic transactions
 */
export class MosaicService {
  private hash: string;
  private mosaicId: string;

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

  public get Hash(): string {
    return this.hash;
  }

  public set Hash(value: string) {
    this.hash = value;
  }

  // Create mosaic
  /**
   * 1. Creates mosaic with unique id and provided divisibility.
   * 2. Changes the supply of mosaics with given amount.
   * 3. Creates a mosaic id alias to given namespace name, which is linked to a namespace id.
   * @param privateKey
   * @param namespaceName
   * @param amount
   * @param divisibility
   * @param duration The duration of the mosaic. How long will the namespace exist (blocks)
   * @param writer
   */
  public async createMosaic(
    privateKey: string,
    namespaceName: string,
    amount: number,
    divisibility: number,
    duration: number,
    writer: Writer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const account = Account.createFromPrivateKey(privateKey, networkName);

          // replace with custom mosaic flags
          const isSupplyMutable = true;
          const isTransferable = true;
          const isRestrictable = true;

          const nonce = MosaicNonce.createRandom();

          const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(epochAdjustment),
            nonce,
            MosaicId.createFromNonce(nonce, account.address),
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

          const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(epochAdjustment),
            [
              mosaicDefinitionTransaction.toAggregate(account.publicAccount),
              mosaicSupplyChangeTransaction.toAggregate(account.publicAccount),
              mosaicAliasTransaction.toAggregate(account.publicAccount),
            ],
            networkName,
            [],
            UInt64.fromUint(maxFee)
          );

          const signedTransaction = account.sign(
            aggregateTransaction,
            networkGenerationHash,
          );

          writer.addText("NamespaceName: " + namespaceName);
          writer.addText("MosaicId: " + mosaicDefinitionTransaction.mosaicId.toHex());

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

  // Create mosaic bonded
  /**
   * 1. Creates mosaic with unique id and provided divisibility.
   * 2. Changes the supply of mosaics with given amount.
   * 3. Creates a mosaic id alias to given namespace name, which is linked to a namespace id.
   * @param privateKey
   * @param namespaceName
   * @param amount
   * @param divisibility
   * @param duration The duration of the mosaic. How long will the namespace exist (blocks)
   * @param writer
   */
  public async createMosaicBonded(
    privateKey: string,
    namespaceName: string,
    amount: number,
    divisibility: number,
    duration: number,
    writer: Writer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const account = Account.createFromPrivateKey(privateKey, networkName);

          // replace with custom mosaic flags
          const isSupplyMutable = true;
          const isTransferable = true;
          const isRestrictable = true;

          const nonce = MosaicNonce.createRandom();

          const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(epochAdjustment),
            nonce,
            MosaicId.createFromNonce(nonce, account.address),
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
            [
              mosaicDefinitionTransaction.toAggregate(account.publicAccount),
              mosaicSupplyChangeTransaction.toAggregate(account.publicAccount),
              mosaicAliasTransaction.toAggregate(account.publicAccount),
            ],
            networkName,
            [],
            UInt64.fromUint(maxFee)
          );

          writer.addText("NamespaceName: " + namespaceName);
          writer.addText("MosaicId: " + mosaicDefinitionTransaction.mosaicId.toHex());

          const cosignTransaction = account.sign(
            aggregateTransaction,
            networkGenerationHash
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

          const signedHashLockTransaction = account.sign(
            hashLockTransaction,
            networkGenerationHash,
          );
          // this.signedHash = signedHashLockTransaction.hash;

          const listener1 = new BlockchainListener(cosignTransaction, account.address, signedHashLockTransaction);

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
          writer.addERROR(error.message);
          reject(error);
        }
      }, 0);
    });
  }

  // Create mosaic bonded WithoutNamespace
  /**
   * 1. Creates mosaic with unique id and provided divisibility.
   * 2. Changes the supply of mosaics with given amount.
   * @param privateKey
   * @param amount
   * @param divisibility
   * @param duration The duration of the mosaic. How long will the namespace exist (blocks)
   * @param writer
   */
  public async createMosaicBondedWithoutNamespace(
    privateKey: string,
    amount: number,
    divisibility: number,
    duration: number,
    writer: Writer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const account = Account.createFromPrivateKey(privateKey, networkName);

          // replace with custom mosaic flags
          const isSupplyMutable = true;
          const isTransferable = true;
          const isRestrictable = true;

          const nonce = MosaicNonce.createRandom();

          const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(epochAdjustment),
            nonce,
            MosaicId.createFromNonce(nonce, account.address),
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
            [
              mosaicDefinitionTransaction.toAggregate(account.publicAccount),
              mosaicSupplyChangeTransaction.toAggregate(account.publicAccount)
            ],
            networkName,
            [],
            UInt64.fromUint(maxFee)
          );

          writer.addText("MosaicId: " + mosaicDefinitionTransaction.mosaicId.toHex());

          const cosignTransaction = account.sign(
            aggregateTransaction,
            networkGenerationHash
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

          const signedHashLockTransaction = account.sign(
            hashLockTransaction,
            networkGenerationHash,
          );
          // this.signedHash = signedHashLockTransaction.hash;

          const listener1 = new BlockchainListener(cosignTransaction, account.address, signedHashLockTransaction);

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
          writer.addERROR(error.message);
          reject(error);
        }
      }, 0);
    });
  }

  // Create mosaic without namespace
  /**
   * 1. Creates mosaic with unique id and provided divisibility.
   * 2. Changes the supply of mosaics with given amount.
   * @param privateKey
   * @param amount
   * @param divisibility
   * @param duration The duration of the mosaic. How long will the namespace exist (blocks)
   * @param writer
   */
  public async createMosaicWithoutNamespace(
    privateKey: string,
    amount: number,
    divisibility: number,
    duration: number,
    writer: Writer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const account = Account.createFromPrivateKey(privateKey, networkName);

          // replace with custom mosaic flags
          const isSupplyMutable = true;
          const isTransferable = true;
          const isRestrictable = true;

          const nonce = MosaicNonce.createRandom();

          const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(epochAdjustment),
            nonce,
            MosaicId.createFromNonce(nonce, account.address),
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

          const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(epochAdjustment),
            [
              mosaicDefinitionTransaction.toAggregate(account.publicAccount),
              mosaicSupplyChangeTransaction.toAggregate(account.publicAccount)
            ],
            networkName,
            [],
            UInt64.fromUint(maxFee)
          );

          const signedTransaction = account.sign(
            aggregateTransaction,
            networkGenerationHash,
          );

          writer.addText("MosaicId: " + mosaicDefinitionTransaction.mosaicId.toHex());

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
   * Gets mosaic information for given mosaic id.
   * @param mosaicId Mosaic id to check
   * @returns Response from blockchain as JSON
   */
  public getMosaicInfo(mosaicIdHex: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const mosaicId = new MosaicId(mosaicIdHex);
          mosaicHttp.getMosaic(mosaicId).subscribe(
            (mosaicInfo) => resolve(mosaicInfo),
            (err) => reject(err),
          );
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  /**
   * Increases supply of mosaic by given amount.
   * Account connected to specified private key must be the creator of mosaic.
   * @param privateKey Account private key
   * @param mosaicIdString Mosaic unique id
   * @param amount Amount of mosaics to increase
   * @param mosaicDivisibility Divisibility of mosaic
   * @param writer Writer object with filepath
   */
  public increaseSupply(
    privateKey: string,
    mosaicIdString: string,
    amount: number,
    mosaicDivisibility: number,
    writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const account = Account.createFromPrivateKey(privateKey, networkName);
          const mosaicId = new MosaicId(mosaicIdString);

          const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
            Deadline.create(epochAdjustment),
            mosaicId,
            MosaicSupplyChangeAction.Increase,
            UInt64.fromUint(amount * Math.pow(10, mosaicDivisibility)),
            networkName,
            UInt64.fromUint(maxFee)
          );

          const signedTransaction = account.sign(
            mosaicSupplyChangeTransaction,
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
   * Decreases supply of mosaic by given amount.
   * Account connected to specified private key must be the creator of mosaic.
   * @param privateKey Account private key
   * @param mosaicIdString Mosaic unique id
   * @param amount Amount of mosaics to increase
   * @param mosaicDivisibility Divisibility of mosaic
   * @param writer Writer object with filepath
   */
  public decreaseSupply(
    privateKey: string,
    mosaicIdString: string,
    amount: number,
    mosaicDivisibility: number,
    writer: Writer
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const account = Account.createFromPrivateKey(privateKey, networkName);
          const mosaicId = new MosaicId(mosaicIdString);

          const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
            Deadline.create(epochAdjustment),
            mosaicId,
            MosaicSupplyChangeAction.Decrease,
            UInt64.fromUint(amount * Math.pow(10, mosaicDivisibility)),
            networkName,
            UInt64.fromUint(maxFee)
          );

          const signedTransaction = account.sign(
            mosaicSupplyChangeTransaction,
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
     * Gets past transactions for a given mosaic ID.
     * Currently request returns last 100 transactions of the given mosaic.
     * @param mosaicId Mosaic id in the blockchain
     * @returns Response from blockchain as JSON
     */
   public getTransactionsByMosaicId(mosaicIdString: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
              const mosaicId = new MosaicId(mosaicIdString);
              const searchCriteria = {
                group: TransactionGroup.Confirmed,
                transferMosaicId: mosaicId,
                embedded: true,
                pageNumber: 1,
                pageSize: 100,
            
              };
              transactionHttp.search(searchCriteria)
              .subscribe({
                  next(page: Page<Transaction>) {
                      resolve(page.data);
                  },
                  error(error) {
                      reject(error.message);
                  }
              });
              
            } catch (error) {
                reject(error.message);
            }
        }, 0)
    })
}

}

export const mosaicService = new MosaicService();
