import {
    Account,
    Address,
    RepositoryFactoryHttp,
    TransactionGroup,
    NamespaceId,
} from 'symbol-sdk';

import '../../../utils/env-config';
import { Constants } from '../../helpers/constants';

// Environment variables
const URL = process.env.URL as string;
const networkName = Constants.NETWORK_IDENTIFIER;

// HTTP
const repositoryFactory = new RepositoryFactoryHttp(URL);
const accountHttp = repositoryFactory.createAccountRepository();
const transactionHttp = repositoryFactory.createTransactionRepository();
const namespaceHttp = repositoryFactory.createNamespaceRepository();

/**
 * Class to handle Account transactions
 */
export class AccountService {

    /**
     * Generates current network public and private keys pair with an address.
     * At this point created account is inactive. After participating in first
     * transaction account will be activated.
     * @param userid Unique user id
     * @returns userid, account address, privateKey, publicKey
     */
    public async createAccount(userid: string): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const account = Account.generateNewAccount(networkName);
                const privatekey = account.privateKey;
                const publickey = account.publicKey;
                resolve({
                    userId: userid,
                    address: account.address,
                    privateKey: privatekey,
                    publicKey: publickey
                });
            }, 0)
        })
    }

    /**
     * Generates current network public and private keys pair with an address.
     * At this point created accounts are inactive. After participating in first
     * transaction account will be activated.
     * @param accountNumber is the number of accounts to be created
     * @returns a list of account objects having userid, account address, privateKey, publicKey
     */
    public async createAccounts(accountNumber: number) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const accounts: any[] = [];
                    for (let i=0; i<accountNumber; i++){
                        accounts.push(await this.createAccount(i.toString()));
                    }
                    resolve(accounts);
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }

    /**
     * Gets Account owned mosaics ids and amount
     * @param address Account address in blockchain
     * @returns Response from blockchain as JSON
     */
    public async getUserBalance(address: string) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const addressToSearch = Address.createFromRawAddress(address);
                    accountHttp.getAccountInfo(addressToSearch).subscribe(
                        (accountInfo) => {
                            const response = [{}];
                            let i = 0;
                            accountInfo.mosaics.forEach(mosaic => {
                                response[i] = {
                                    mosaicId: mosaic.id.toHex(),
                                    amount: mosaic.amount.compact()
                                };
                                i++;
                            });
                            resolve(response);
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
     * Gets Account's specific mosaics balance
     * @param address Account address in blockchain
     * @param mosaicId mosaic id to retrieve balance for
     * @returns 
     */
     public async getUserBalanceForGivenMosaicId(address: string, mosaicId: string) {
        try {
            const balances: any = await this.getUserBalance(address);
            for(const balance of balances){
                if(balance.mosaicId === mosaicId){
                    return balance.amount;
                }
            }
            throw Error("Wrong mosaic id")
        } 
        catch (error) {
            throw Error(error.message);
        }
    }

    /**
     * Gets Account owned mosaics ids and amount by namespace alias
     * @param namespaceName Account address namespace in blockchain
     * @returns Response from blockchain as JSON
     */
    public async getUserBalanceByNamespace(namespaceName: string) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceId = new NamespaceId(namespaceName);
                    namespaceHttp.getLinkedAddress(namespaceId).subscribe(
                        (addressToSearch) => {
                            try {
                                accountHttp.getAccountInfo(addressToSearch).subscribe(
                                    (accountInfo) => {
                                        const response = [{}];
                                        let i = 0;
                                        accountInfo.mosaics.forEach(mosaic => {
                                            response[i] = {
                                                mosaicId: mosaic.id.toHex(),
                                                amount: mosaic.amount.compact()
                                            };
                                            i++;
                                        });
                                        resolve(response);
                                    },
                                    (err) => reject(err),
                                );
                            } catch (error) {
                                reject(error);
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
     * Gets past transactions list of the selected account.
     * Currently request returns last 100 transactions of the account.
     * @param address Account address in blockchain
     * @returns Response from blockchain as JSON
     */
    public getUserTransactions(addressString: string) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const address = Address.createFromRawAddress(addressString);
                    const searchCriteria = {
                        group: TransactionGroup.Confirmed,
                        address,
                        pageNumber: 1,
                        pageSize: 100,
                    };
                    transactionHttp.search(searchCriteria).subscribe(
                        (page) => resolve(page.data),
                        (err) => reject(err.message),
                    );
                } catch (error) {
                    reject(error.message);
                }
            }, 0)
        })
    }

    /**
     * Gets past transactions list of the selected account by namespace.
     * Currently request returns last 100 transactions of the account.
     * @param namespaceName Account address namespace in blockchain
     * @returns Response from blockchain as JSON
     */
    public getUserTransactionsByNamespace(namespaceName: string) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const namespaceId = new NamespaceId(namespaceName);
                    namespaceHttp.getLinkedAddress(namespaceId).subscribe(
                        (addressToSearch) => {
                            try {
                                const address = Address.createFromRawAddress(addressToSearch.plain());
                                const searchCriteria = {
                                    group: TransactionGroup.Confirmed,
                                    address,
                                    pageNumber: 1,
                                    pageSize: 100,
                                };
                                transactionHttp.search(searchCriteria).subscribe(
                                    (page) => resolve(page.data),
                                    (err) => reject(err),
                                );
                            } catch (error) {
                                reject(error);
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
}

export const accountService = new AccountService();