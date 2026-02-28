import {
    Account,
    AggregateTransaction,
    Deadline,
    MosaicId,
    UInt64,
    PublicAccount, KeyGenerator, MosaicMetadataTransaction, HashLockTransaction, 
    Mosaic, MetadataTransactionService, 
    RepositoryFactoryHttp,
    MetadataHttp
} from 'symbol-sdk';

import '../../../../utils/env-config';
import { Constants } from '../../../helpers/constants';
import { Writer } from '../../../helpers/writer';
import {TransactionAnouncer} from "../../../helpers/transactionAnouncer";
import {transactionService} from "../transactionService";
import { firstValueFrom } from 'rxjs';

const URL = process.env.URL as string;
// Environment variables
const networkGenerationHash = process.env.nemesisGenerationHash;
const networkName = Constants.NETWORK_IDENTIFIER;

const repositoryFactory = new RepositoryFactoryHttp(URL);
const metadataHttp = repositoryFactory.createMetadataRepository();
const metadataHttpService = new MetadataHttp(URL);
const metadataTransactionService = new MetadataTransactionService(metadataHttpService);
const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;

/**
 * Class to handle Mosaic Transactions with multisig account
 */
export class MetadataMultisigService {
    /**
     * Multisig Account ataches metadata to the mosaic with the provided id
     * @param multisigAccountPublicKey Multisig Account, which is going to create Mosaic, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * assign Metadata to an mosaic
     * @param cosignatoryPrivateKey Signer private key in blockchain
     * @param mosaicIdHex Account public key in blockchain
     * @param keyString Key to save
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @param feeMultiplier median fee multiplier to set maxFee dynamically
     * @returns Response from blockchain as JSON
     */
    public async assignMetadataToMosaic(
        multisigAccountPublicKey: string,
        cosignatoryPrivateKey: string,
        mosaicIdHex: string,
        keyString: string,
        value: string,
        writer: Writer, 
        feeMultiplier: number
    )
    {
        return new Promise(async (resolve, reject) => {
            try {
                const key = KeyGenerator.generateUInt64Key(keyString);
                const publicAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);
                const signerAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                const mosaicId = new MosaicId(mosaicIdHex);
                const currencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);

                const encoder = new TextEncoder();

                const mosaicMetadataTransaction = MosaicMetadataTransaction.create(
                    Deadline.create(epochAdjustment),
                    publicAccount.address,
                    key,
                    mosaicId,
                    value.length,
                    encoder.encode(value),
                    networkName,
                );

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [mosaicMetadataTransaction.toAggregate(signerAccount.publicAccount).setMaxFee(feeMultiplier)],
                    networkName,
                    [],
                ).setMaxFeeForAggregate(feeMultiplier, 2);

                const signedTransaction = signerAccount.sign(
                    aggregateTransaction,
                    networkGenerationHash,
                );

                const hashLockTransaction = HashLockTransaction.create(
                    Deadline.create(epochAdjustment),
                    new Mosaic(
                        currencyMosaicId,
                        UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
                    ),
                    UInt64.fromUint(480),
                    signedTransaction,
                    networkName,
                ).setMaxFee(feeMultiplier);

                const signedHashLockTransaction = signerAccount.sign(
                    hashLockTransaction,
                    networkGenerationHash);

                const announcer1 = new TransactionAnouncer(signedHashLockTransaction);
                await announcer1.announceTransaction(writer);

                await transactionService.waitForConfirmedTransaction(
                    signedHashLockTransaction.hash,
                    signerAccount.address, // the change
                    true,
                    writer
                )

                const announcer2 = new TransactionAnouncer(signedTransaction);
                await announcer2.announceAggregateBondedTransaction(writer);

                const bondedTransaction = await transactionService.waitForConfirmedTransaction(
                    signedTransaction.hash,
                    signerAccount.address,
                    false,
                    writer
                )

                resolve(bondedTransaction);
            } catch (error) {
                writer.addERROR(error.message);
                reject(error);
            }
        })
    }

    /**
     * Multisig Account update metadata to the mosaic with the provided id
     * @param multisigAccountPublicKey Multisig Account, which is going to update Mosaic, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param mosaicIdHex Account public key in blockchain
     * @param keyString Key to update
     * @param value Value of the key
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async updateMetadataToMosaic(
        multisigAccountPublicKey: string,
        cosignatoryPrivateKey: string,
        mosaicIdHex: string,
        keyString: string,
        value: string,
        writer: Writer)
    {
        return new Promise(async (resolve, reject) => {
            try {
                const key = KeyGenerator.generateUInt64Key(keyString);
                const publicAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, networkName);
                const signerAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, networkName);
                const mosaicId = new MosaicId(mosaicIdHex);
                const currencyMosaicId = new MosaicId(Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING);

                const mosaicMetadataTransaction = await firstValueFrom(metadataTransactionService.createMosaicMetadataTransaction(
                    Deadline.create(epochAdjustment),
                    networkName,
                    publicAccount.address,
                    mosaicId,
                    key,
                    value,
                    signerAccount.publicAccount.address,
                    UInt64.fromUint(maxFee)
                ));

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [mosaicMetadataTransaction.toAggregate(signerAccount.publicAccount)],
                    networkName,
                    [],
                    UInt64.fromUint(maxFee)
                );

                const signedTransaction = signerAccount.sign(
                    aggregateTransaction,
                    networkGenerationHash,
                );

                const hashLockTransaction = HashLockTransaction.create(
                    Deadline.create(epochAdjustment),
                    new Mosaic(
                        currencyMosaicId,
                        UInt64.fromUint(Constants.NETWORK_MINIMUM_LOCK_AMOUNT),
                    ),
                    UInt64.fromUint(480),
                    signedTransaction,
                    networkName,
                    UInt64.fromUint(maxFee),
                );

                const signedHashLockTransaction = signerAccount.sign(
                    hashLockTransaction,
                    networkGenerationHash);

                const announcer1 = new TransactionAnouncer(signedHashLockTransaction);
                await announcer1.announceTransaction(writer);

                await transactionService.waitForConfirmedTransaction(
                    signedHashLockTransaction.hash,
                    signerAccount.address, // the change
                    true,
                    writer
                )

                const announcer2 = new TransactionAnouncer(signedTransaction);
                await announcer2.announceAggregateBondedTransaction(writer);

                const bondedTransaction = await transactionService.waitForConfirmedTransaction(
                    signedTransaction.hash,
                    signerAccount.address,
                    false,
                    writer
                )
                resolve(
                    {
                        cosignHash: signedTransaction.hash,
                    }
                );
            } catch (error) {
                writer.addERROR(error.message);
                reject(error);
            }
        })
    }
}
export const metadataMultisigService = new MetadataMultisigService();