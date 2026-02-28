import { ChainInfo, MosaicId, RepositoryFactoryHttp, TransactionFees } from 'symbol-sdk';
import '../../../utils/env-config';
import { Observable } from 'rxjs';

// Environment variables
const URL = process.env.URL as string;

// HTTP
const repositoryFactory = new RepositoryFactoryHttp(URL);
const chainHttp = repositoryFactory.createChainRepository();
const networkHttp = repositoryFactory.createNetworkRepository();

/**
 * Class to handle information about blockchain with transactions
 */
export class BlockchainService {

    /**
     * Gets the current block height number in the network.
     * @returns Response from blockchain as JSON
     */
    public getHeight() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                chainHttp.getChainInfo().subscribe(
                    (info: ChainInfo) => resolve(info.height.compact()),
                    (err) => reject(err),
                );
            }, 0)
        })
    }

    /**
     * Gets the nework median fee multiplier value dynamically. More info:
     * https://symbolplatform.com/fees/#dynamic-fee-multiplier
     * @returns median fee multiplier
     */
    public async getMedianFeeMultiplier(): Promise<number> {
        try {
            const txFees: Observable<TransactionFees> = networkHttp.getTransactionFees();
            return new Promise((resolve, reject) => {
                txFees.subscribe({
                    next: fees => resolve(fees.medianFeeMultiplier),
                    error: err => reject(err),
                });
            });
        } catch (error) {
            throw error;
        }
    }
}

export const blockchainService = new BlockchainService();