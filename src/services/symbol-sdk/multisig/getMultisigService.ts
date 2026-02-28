import {Address, RepositoryFactoryHttp} from 'symbol-sdk';

import '../../../../utils/env-config';

// Environment variables
const URL = process.env.URL as string;

// HTTP
const repositoryFactory = new RepositoryFactoryHttp(URL);
const multisigHttp = repositoryFactory.createMultisigRepository();

/**
 * Class to get Multisig Account information
 */
export class GetMultisigService {

    /**
     * Gets multisig account information.
     * @param addressString Multisig account address
     * @returns Response from blockchain as JSON
     */
    public getMultisigInfo(addressString: string) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const address = Address.createFromRawAddress(addressString);

                    multisigHttp.getMultisigAccountInfo(address).subscribe(
                        (multisigInfo) => resolve(multisigInfo),
                        (err) => reject(err.message),
                    );
                } catch (error) {
                    reject(error);
                }
            }, 0)
        })
    }
}

export const getMultisigService = new GetMultisigService();