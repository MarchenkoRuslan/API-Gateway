import {
    Account,
    AggregateTransaction,
    Deadline,
    NamespaceRegistrationTransaction,
    MosaicId,
    Mosaic,
    UInt64,
    PublicAccount,
    HashLockTransaction
} from 'symbol-sdk';

import { BlockchainListener } from "../../../helpers/transactionListener";
import '../../../../utils/env-config';
import { Constants } from '../../../helpers/constants';
import { Writer } from '../../../helpers/writer';
import { ErrorHandler } from '../../../helpers/errorHandler';

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
 * Class to handle Namespace Transactions with multisig account
 */
export class NamespaceMultisigService {
    private namespaceId: string;
    private cosignHash: string;
    private signedHash: string;

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
     * Checks if the given namespace name is already linked to namespace id.
     * If not Creates Namespace and links to provided name, with multisig account,
     * Else - "Failure_Namespace_With_Given_Name_Already_Exists"
     * @param multisigAccountPublicKey Multisig Account, which is going to create Namespace, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param namespaceName Namespace name to link to the created namespace id
     * @param duration The duration of the namespace. How long will the namespace exist (blocks)
     * @param writer Writer object with filepath
     */
    public createNamespace(multisigAccountPublicKey: string, cosignatoryPrivateKey: string,
        namespaceName: string, duration: number, writer: Writer) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const cosignatoryAccount = Account.createFromPrivateKey(
                        cosignatoryPrivateKey,
                        networkName
                    );
                    const multisigAccount = PublicAccount.createFromPublicKey(
                        multisigAccountPublicKey,
                        networkName
                    );

                    const namespaceRegistrationTransaction = NamespaceRegistrationTransaction.createRootNamespace(
                        Deadline.create(epochAdjustment),
                        namespaceName,
                        UInt64.fromUint(duration),
                        networkName,
                        UInt64.fromUint(maxFee)
                    );
                    writer.addText("NamespaceName: " + namespaceName);
                    writer.addText("NamespaceId: " + namespaceRegistrationTransaction.namespaceId.id.toHex());

                    const aggregateTransaction = AggregateTransaction.createBonded(
                        Deadline.create(epochAdjustment),
                        [namespaceRegistrationTransaction.toAggregate(multisigAccount)],
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

                } catch (error) {
                    writer.addERROR(error.message);
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Creates Sub Namespace for provided root namespace with multisig account. 
     * @param multisigAccountPublicKey Multisig Account, which is going to create Sub-Namespace, Public Key
     * @param cosignatoryPrivateKey Multisig Cosignatory Account Private Key
     * @param rootNamespaceName Root namespace name which is linekd to namespace id, for which to create sub namespace
     * @param subnamespaceName Sub Namespace name, which is going to be linked to Root-SubNamespace id
     * @param writer Writer object with filepath
     */
    public createSubNamespace(multisigAccountPublicKey: string, cosignatoryPrivateKey: string,
        rootNamespaceName: string, subnamespaceName: string, writer: Writer, errorHandler?: ErrorHandler, script?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const cosignatoryAccount = Account.createFromPrivateKey(
                    cosignatoryPrivateKey,
                    networkName
                );
                const multisigAccount = PublicAccount.createFromPublicKey(
                    multisigAccountPublicKey,
                    networkName
                );

                const namespaceRegistrationTransaction = NamespaceRegistrationTransaction.createSubNamespace(
                    Deadline.create(epochAdjustment),
                    subnamespaceName,
                    rootNamespaceName,
                    networkName);
                writer.addText("Root NamespaceName: " + rootNamespaceName);
                writer.addText("Sub NamespaceName: " + subnamespaceName);
                writer.addText("NamespaceId: " + namespaceRegistrationTransaction.namespaceId.id.toHex());

                const aggregateTransaction = AggregateTransaction.createBonded(
                    Deadline.create(epochAdjustment),
                    [namespaceRegistrationTransaction.toAggregate(multisigAccount)],
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

export const namespaceMultisigService = new NamespaceMultisigService();