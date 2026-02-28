import {
    Account,
    Address,
    Deadline,
    KeyGenerator,
    RepositoryFactoryHttp,
    MosaicAddressRestrictionTransaction,
    MosaicGlobalRestrictionTransaction,
    AggregateTransaction,
    MosaicId,
    MosaicRestrictionType,
    UInt64
} from 'symbol-sdk';

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
const restrictionAccountHttp = repositoryFactory.createRestrictionAccountRepository();
const restrictionMosaicHttp = repositoryFactory.createRestrictionMosaicRepository();
const epochAdjustment = Constants.EPOCH_ADJUSTMENT;

/**
 * Class to handle Account restrictions
 */
export class RestrictionService {

    /**
     * GetAccountRestrictions
     * @param accountAddressString Account address in blockchain
     * @returns Response from blockchain as JSON
     */
    public async getAccountRestrictions(
        accountAddressString: string
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const address = Address.createFromRawAddress(accountAddressString);
                    restrictionAccountHttp.getAccountRestrictions(address).subscribe(
                        (accountRestrictions: any) => {
                            if (accountRestrictions.length > 0) {
                                accountRestrictions
                                    .filter(
                                        (accountRestriction: any) => accountRestriction.values.length > 0,
                                    )
                                    .map((accountRestriction: any) => {
                                        console.log(
                                            '\n',
                                            accountRestriction.restrictionFlags,
                                            accountRestriction.values.toString(),
                                        );
                                    });
                            } else {
                                resolve('The address does not have account restriction assigned.');
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
     * GetMosaicRestrictions
     * @param mosaicIdString Mosaic id string to restrict
     * @returns Response from blockchain as JSON
     */
    public async getMosaicRestrictions(
        mosaicIdString: string
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // const address = Address.createFromRawAddress(accountAddressString);
                    // const mosaicId = new MosaicId(mosaicIdString);
                    restrictionMosaicHttp.getMosaicRestrictions(mosaicIdString).subscribe(
                        (result) => {
                            resolve(result);
                        }
                    )
                    // restrictionMosaicHttp.getMosaicAddressRestriction(mosaicId, address).subscribe(
                    //     (mosaicAddressRestrictions) => {
                    //         if (mosaicAddressRestrictions.restrictions.size > 0) {
                    //             mosaicAddressRestrictions.restrictions.forEach(
                    //                 (value: string, key: string) => {
                    //                     console.log('\n', key, value);
                    //                 },
                    //             );
                    //         } else {
                    //             resolve(
                    //                 '\n The address does not have mosaic address restrictions assigned.',
                    //             );
                    //         }
                    //     },
                    //     (err) => reject(err),
                    // );
                } catch (error) {
                    reject(error);
                }

            }, 0)
        })
    }

    /**
     * restrict Account Transfers
     * @param mosaicCreatorPrivateKeyString Mosaic creator account private key in blockchain
     * @param accountAddressString Account to restrict address in blockchain
     * @param mosaicIdString Mosaic id string to restrict
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async restrictAccountTransfers(
        mosaicCreatorPrivateKeyString: string,
        accountAddressString: string,
        mosaicIdString: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const mosaicCreatorAccount = Account.createFromPrivateKey(mosaicCreatorPrivateKeyString, networkName);
                    const accountToRestrictAddress = Address.createFromRawAddress(
                        accountAddressString
                    )
                    const mosaicId = new MosaicId(mosaicIdString);

                    const key = KeyGenerator.generateUInt64Key('KYC'.toLowerCase());
                    const aliceMosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
                        Deadline.create(epochAdjustment),
                        mosaicId, // mosaicId
                        key, // restrictionKey
                        accountToRestrictAddress, // address
                        UInt64.fromUint(0), // newRestrictionValue
                        networkName,
                        // UInt64.fromUint(1), // newRestrictionValue
                    );

                    const aggregateTransaction = AggregateTransaction.createComplete(
                        Deadline.create(epochAdjustment),
                        [
                            aliceMosaicAddressRestrictionTransaction.toAggregate(mosaicCreatorAccount.publicAccount),
                        ],
                        networkName,
                        [],
                        UInt64.fromUint(0),
                    );

                    const signedTransaction = mosaicCreatorAccount.sign(
                        aggregateTransaction,
                        generationHash,
                    );
                    console.log(signedTransaction.hash);

                    const listener = new BlockchainListener(
                        signedTransaction,
                        mosaicCreatorAccount.address
                    );
                    listener.createListener(writer);

                    const announcer = new TransactionAnouncer(signedTransaction);

                    announcer.announceTransaction(writer)
                        .then(result => resolve(result));
                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }

            }, 0)
        })
    }

    /**
     * Mosaic Global Restriction
     * @param mosaicCreatorPrivateKeyString Mosaic creator account private key in blockchain
     * @param mosaicIdString Mosaic id string to restrict
     * @param writer Writer object with filepath
     * @returns Response from blockchain as JSON
     */
    public async mosaicGlobalRestriction(
        mosaicCreatorPrivateKeyString: string,
        mosaicIdString: string,
        writer: Writer
    ) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const mosaicCreatorAccount = Account.createFromPrivateKey(mosaicCreatorPrivateKeyString, networkName);
                    const mosaicId = new MosaicId(mosaicIdString);
                    const key = KeyGenerator.generateUInt64Key('KYC'.toLowerCase());


                    const transaction = MosaicGlobalRestrictionTransaction.create(
                        Deadline.create(epochAdjustment),
                        mosaicId, // mosaicId
                        key, // restrictionKey
                        UInt64.fromUint(0), // previousRestrictionValue
                        MosaicRestrictionType.NONE, // previousRestrictionType
                        UInt64.fromUint(1), // newRestrictionValue
                        MosaicRestrictionType.EQ, // newRestrictionType
                        networkName,
                        undefined,
                        UInt64.fromUint(0),
                    );
                    const signedTransaction = mosaicCreatorAccount.sign(transaction, generationHash);
                    const listener = new BlockchainListener(
                        signedTransaction,
                        mosaicCreatorAccount.address
                    );
                    listener.createListener(writer);

                    const announcer = new TransactionAnouncer(signedTransaction);

                    announcer.announceTransaction(writer)
                        .then(result => resolve(result));
                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }

            }, 0)
        })
    }
}

export const restrictionService = new RestrictionService();