import {
    Account,
    Address,
    AliasTransaction,
    AliasAction,
    Deadline,
    NamespaceRegistrationTransaction,
    NamespaceId,
    RepositoryFactoryHttp,
    UInt64,
    MosaicId
} from 'symbol-sdk';

import { BlockchainListener } from "../../helpers/transactionListener";
import { TransactionAnouncer } from "../../helpers/transactionAnouncer";
import '../../../utils/env-config';
import { Constants } from '../../helpers/constants';
import { Writer } from '../../helpers/writer';

// Environment variables
const networkGenerationHash = process.env.nemesisGenerationHash as string;
const URL = process.env.URL as string;
const networkName = Constants.NETWORK_IDENTIFIER;

const repositoryFactory = new RepositoryFactoryHttp(URL);
const namespaceHttp = repositoryFactory.createNamespaceRepository();

const epochAdjustment = Constants.EPOCH_ADJUSTMENT;
const maxFee = Constants.MAX_FEE;

/**
 * Class to handle Namespace Transactions
 */
export class NamespaceService {

    private hash: string;
    private namespaceId: string;

    /**
     * Getter $namespaceId
     * @return {string}
     */
    public get $namespaceId(): string {
        return this.namespaceId;
    }

    /**
     * Setter $namespaceId
     * @param {string} value
     */
    public set $namespaceId(value: string) {
        this.namespaceId = value;
    }


    public get Hash(): string {
        return this.hash;
    }


    public set Hash(value: string) {
        this.hash = value;
    }

    /**
     * Creates new namespace with provided name for the specified duration.
     * If provided namespace name is already linked to namespace id, then the existence of this namespace is increased by the specified duration.
     * @param privateKey Account, which is going to create Namespace, private key
     * @param namespaceName Namespace name to link to the created namespace id
     * @param duration The duration of the namespace. How long will the namespace exist (blocks)
     * @param writer Writer object with filepath
     */
    public async createNamespace(privateKey: string, namespaceName: string, duration: number, writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceRegistrationTransaction = NamespaceRegistrationTransaction.createRootNamespace(
                        Deadline.create(epochAdjustment),
                        namespaceName,
                        UInt64.fromUint(duration),
                        networkName,
                        UInt64.fromUint(maxFee)
                    );

                    const account = Account.createFromPrivateKey(privateKey, networkName);

                    const signedTransaction = account.sign(
                        namespaceRegistrationTransaction,
                        networkGenerationHash,
                    );
                    writer.addText("NamespaceName: " + namespaceName);
                    writer.addText("NamespaceId: " + namespaceRegistrationTransaction.namespaceId.id.toHex());

                    const listener = new BlockchainListener(signedTransaction, account.address);
                    listener.createListener(writer);

                    const announcer = new TransactionAnouncer(signedTransaction);

                    announcer.announceTransaction(writer)
                        .then((result) => resolve(result));
                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Creates Sub Namespace for provided root namespace.
     * Root Namespace name must be existing Namespace and owned by given privateKey account.
     * @param privateKey  Account, which is going to create Sub-Namespace, Private Key
     * @param rootNamespaceName Root namespace name which is linekd to namespace id, for which to create sub namespace
     * @param subnamespaceName Sub Namespace name, which is going to be linked to Root-SubNamespace id
     * @param writer Writer object with filepath
     */
    public async createSubNamespace(privateKey: string, rootNamespaceName: string, subnamespaceName: string, writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceRegistrationTransaction = NamespaceRegistrationTransaction.createSubNamespace(
                        Deadline.create(epochAdjustment),
                        subnamespaceName,
                        rootNamespaceName,
                        networkName,
                        UInt64.fromUint(maxFee)
                    );

                    const account = Account.createFromPrivateKey(privateKey, networkName);

                    const signedTransaction = account.sign(
                        namespaceRegistrationTransaction,
                        networkGenerationHash,
                    );

                    writer.addText("RootNamespaceName: " + rootNamespaceName);
                    writer.addText("SubNamespaceName: " + subnamespaceName);
                    writer.addText("SubNamespaceId: " + namespaceRegistrationTransaction.namespaceId.id.toHex());

                    const listener = new BlockchainListener(signedTransaction, account.address);
                    listener.createListener(writer);


                    const announcer = new TransactionAnouncer(signedTransaction);

                    announcer.announceTransaction(writer)
                        .then((result) => resolve(result));

                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Gets namespace information for given namespace id.
     * @param namespaceString Namespace name which is linked to mosaic
     * @returns Response from blockchain as JSON
     */
    public getNamespaceInfo(namespaceString: string) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceId = new NamespaceId(namespaceString);
                    namespaceHttp.getNamespace(namespaceId).subscribe(
                        (namespaceInfo) => resolve(namespaceInfo),
                        (err) => reject(err),
                    );
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Gets id by namespace
     * @param namespaceString Namespace name
     * @returns Response from blockchain as JSON
     */
    public getIdByNamespace(namespaceString: string) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceId = new NamespaceId(namespaceString);
                    resolve(namespaceId.id.toHex());
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Gets namespace by id.
     * @param namespaceId Namespace id
     * @returns Response from blockchain as JSON
     */
    public getNamespaceById(namespaceIdString: NamespaceId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // const name = new NamespaceName(namespaceIdString)
                    // console.log(namespaceIdString.encodeUnresolvedAddress)
                    // const namespaceId = new NamespaceId(namespaceIdString)
                    // namespaceHttp.
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Links a namespace to an address.
     * Namespace has to be already created.
     * @param privateKey Account, which is going to sign the transaction
     * @param namespaceName Namespace name to link to the address
     * @param addressString Account, which is going to be linked to Namespace, address
     * @param writer Writer object with filepath
     */
    public async linkToAnAddress(privateKey: string, namespaceName: string, addressString: string, writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceId = new NamespaceId(namespaceName);
                    const address = Address.createFromRawAddress(addressString);

                    const addressAliasTransaction = AliasTransaction.createForAddress(
                        Deadline.create(epochAdjustment),
                        AliasAction.Link,
                        namespaceId,
                        address,
                        networkName,
                        UInt64.fromUint(maxFee)
                    );

                    const account = Account.createFromPrivateKey(privateKey, networkName);

                    const signedTransaction = account.sign(
                        addressAliasTransaction,
                        networkGenerationHash,
                    );

                    writer.addText("NamespaceName: " + namespaceName);
                    writer.addText("NamespaceId: " + namespaceId.id);
                    writer.addText("Address: " + addressString);

                    const listener = new BlockchainListener(signedTransaction, account.address);
                    listener.createListener(writer);

                    const announcer = new TransactionAnouncer(signedTransaction);

                    announcer.announceTransaction(writer)
                        .then((result) => resolve(result));
                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Links a namespace to a mosaic.
     * Namespace has to be already created.
     * @param privateKey Account, which is going to sign the transaction
     * @param namespaceName Namespace name to link to the address
     * @param mosaicIdString Mosaic id, which is going to be linked to Namespace
     * @param writer Writer object with filepath
     */
    public async linkToAMosaic(privateKey: string, namespaceName: string, mosaicIdString: string, writer: Writer): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceId = new NamespaceId(namespaceName);
                    const mosaic = new MosaicId(mosaicIdString);


                    const mosaicAliasTransaction = AliasTransaction.createForMosaic(
                        Deadline.create(epochAdjustment),
                        AliasAction.Link,
                        namespaceId,
                        mosaic,
                        networkName,
                        UInt64.fromUint(maxFee)
                    );

                    const account = Account.createFromPrivateKey(privateKey, networkName);

                    const signedTransaction = account.sign(
                        mosaicAliasTransaction,
                        networkGenerationHash,
                    );

                    writer.addText("NamespaceName: " + namespaceName);
                    writer.addText("NamespaceId: " + namespaceId.id);
                    writer.addText("MosaicId: " + mosaicIdString);

                    const listener = new BlockchainListener(signedTransaction, account.address);
                    listener.createListener(writer);

                    const announcer = new TransactionAnouncer(signedTransaction);

                    announcer.announceTransaction(writer)
                        .then((result) => resolve(result));
                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }
            }, 0)
        })
    }
}



export const namespaceService = new NamespaceService();
