import express = require("express");
import {Request, Response} from "express";
import {Writer} from '../../../helpers/writer';
import {generator} from "../../../helpers/generator";
import {accountService} from "../../../services/symbol-sdk/accountService";
import {transactionService} from "../../../services/symbol-sdk/transactionService";
import {createMultisigService} from "../../../services/symbol-sdk/multisig/createMultisigService";
import {Account} from "symbol-sdk";
import {Constants} from '../../../helpers/constants';
import {transactionMultisigService} from "../../../services/symbol-sdk/multisig/transactionMultisigService";
import {getMultisigService} from "../../../services/symbol-sdk/multisig/getMultisigService";
import {modifyMultisigService} from "../../../services/symbol-sdk/multisig/modifyMultisigService";
import {PublicAccount} from "symbol-sdk";
import { blockchainService } from "../../../services/symbol-sdk/blockchainService";

const networkName = Constants.NETWORK_IDENTIFIER;
const router = express.Router();

/**
 * @swagger
 * /multisig/create/fromProvidedCosignatories/fromMultisig:
 *   post:
 *     summary: Create multisig account from provided cosignatories providing the xym from a multisig account.
 *     description: |
 *       Generates account for the multisig head. \
 *       Sends a transaction to the multisig head account. \
 *       Connects accounts to multisig. \
 *       Co-signs a transaction with the keys of participants.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminAccountPublicKeyMultisig:
 *                 type: string
 *                 description: Public key of a multisig account which is going to provide currency for multisig creation
 *                 example: "0B5239348B4492F47FEF260DBFE87A8C88381221A09FBA9C78A64A9DE9814FF8"
 *               adminAccountCosignatoryPrivateKeyMultisig:
 *                 type: string
 *                 description: Private key of a multisig account which is going to provide currency for multisig creation
 *                 example: "F75B2F06B408005BFE66779AA63640597DEB34A75D6221037D57C1A31BA010DC"
 *               cosignatoriesPrivateKeysList:
 *                 type: array
 *                 description: Array of cosignatory private keys
 *                 example: [ "631401F44252AD8D0C9C3C9D508D1311A3F7DB5D8917A1D75E22449CDC7BC405", "648CF47C72BF25FB5E73443A19C6A349250D96CD2F91733214E9D67976D86C7C", "C0824419FD589DCD31C79FFEC7887C3544BF330DEF927BA09AF0D22D3D364A08" ]
 *               minApproval:
 *                 type: integer
 *                 description: Minimum cosigns needed for transaction approval.
 *                 example: 1
 *               minRemoval:
 *                 type: integer
 *                 description: Minimum cosigns needed for cosignatory removal.
 *                 example: 1
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   type: object
 *                   description: Account
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: User ID.
 *                       example: multisig
 *                     address:
 *                       type: object
 *                       description: Address object.
 *                       properties:
 *                         address:
 *                           type: string
 *                           description: Account address.
 *                           example: TDEEW57VUGI6GDDLYYRZXOXK4XFAAT23UMQ573Q
 *                         networkType:
 *                           type: integer
 *                           description: Blockchain network type.
 *                           example: 152
 *                     privateKey:
 *                       type: string
 *                       description: Account private key.
 *                       example: D1F8EB0D63A75A20D5FAB61998D589D9B2B84CD36193D2FAD0018BD2D1CE369B
 *                     publicKey:
 *                       type: string
 *                       description: Account public key.
 *                       example: FC8B6601CCA7BFD21526E20B938A6CB54A41477B8F19EAF9C20E721D00297E34
 *                 minApproval:
 *                   type: integer
 *                   description: Minimum cosigns for transaction approval.
 *                   example: 1
 *                 minRemoval:
 *                   type: integer
 *                   description: Minimum cosigns for cosignatory removal.
 *                   example: 1
 *                 cosignatoryAccounts:
 *                   type: array
 *                   description: Array of cosignatory account objects.
 *                   items:
 *                     type: object
 *                     description: Cosignatory account object.
 *                     properties:
 *                       address:
 *                         type: object
 *                         description: Address object.
 *                         properties:
 *                           address:
 *                             type: string
 *                             description: Account address.
 *                             example: TAW5FU2OX7ZQRZ7TRZRRQ5U63AEHP3MQ3DJRCYY
 *                           networkType:
 *                             type: integer
 *                             description: Blockchain network type.
 *                             example: 152
 *                       privateKey:
 *                         type: string
 *                         description: Account private key.
 *                         example: 0B267564996A966DD8C7DF45D888F379A4D45915E6601E6272C0B74440F134BF
 *                       publicKey:
 *                         type: string
 *                         description: Account public key.
 *                         example: F74E48CF42206F76F66D04E626AD756CFC568428519E671FD2BD45B27BCFE710
 */
router.post("/create/fromProvidedCosignatories/fromMultisig", async (req: Request, res: Response) => {
    const adminAccountPublicKeyMultisig = req.body.adminAccountPublicKeyMultisig;
    const adminAccountCosignatoryPrivateKeyMultisig: string =  req.body.adminAccountCosignatoryPrivateKeyMultisig;
    const cosignatoriesPrivateKeysList = req.body.cosignatoriesPrivateKeysList;
    const minApproval = req.body.minApproval;
    const minRemoval = req.body.minRemoval;
    const length = Object.keys(req.body).length

    if (length !== 5) return res.status(400).send({ status: 'failed', message: 'too many or too little parameters' })
    if (!req.body.cosignatoriesPrivateKeysList) return res.status(400).send({ status: 'failed', message: 'cosignatoriesPrivateKeysList is required' });
    if (!req.body.minApproval) return res.status(400).send({ status: 'failed', message: 'minApproval is required' });
    if (!req.body.minRemoval) return res.status(400).send({ status: 'failed', message: 'minRemoval is required' });
    if (!req.body.adminAccountPublicKeyMultisig) 
        return res.status(400).send({ status: 'failed', message: 'adminAccountPublicKeyMultisig is required' });
    if (adminAccountCosignatoryPrivateKeyMultisig.length != 64){
        return res.status(400).send({
            status: 'failed',
            message: 'multisigAdminAccountCosignatoryPrivateKey input must be exact of 64 character length.',
        });
    }
    if (!req.body.adminAccountCosignatoryPrivateKeyMultisig) 
        return res.status(400).send({ status: 'failed', message: 'multisigAdminAccountCosignatoryPrivateKey is required' });

    if (cosignatoriesPrivateKeysList.length < minApproval || cosignatoriesPrivateKeysList.length < minRemoval){
        return res.status(400).send({
            status: 'failed',
            message: 'Not enough cosignatories for provided minApproval and minRemoval number.',
        });
    }
    for (const cosignatory of cosignatoriesPrivateKeysList) {
        if(cosignatory.length != 64){
            return res.status(400).send({
                status: 'failed',
                message: 'Each cosignatory private key input must match 64 character length.',
            });
        }
    }
    
    const writer = new Writer();
    
    try {
        const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();

        writer.createStream(generator.makeLog());
        writer.addTASK("createMultisigTemplate.createFromProvidedCosignatories");
    
        writer.addTASK("create an account for multisig.");
        const account: any = await accountService.createAccount("multisig")
        writer.addText("Account has been created.")
    
        writer.addTASK("Send currency to future multisig account.");

        //Account address which will be converted to multisig
        const recipientAddress: string = account.address.address;
    
        const message: string = "Sending currency for future multisig";
        await transactionMultisigService.sendMultisigTransactionMosaic(
            adminAccountPublicKeyMultisig, adminAccountCosignatoryPrivateKeyMultisig,
            recipientAddress,
            Constants.MINIMUM_MULTISIG_CURRENCY_AMOUNT, 
            Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING, writer, medianFeeMultiplier, message
        );
        writer.addText("Transfer transaction has been confirmed.");
        
        writer.addTASK("Connect accounts to multisig.");
        const multisigAccount = Account.createFromPrivateKey(account.privateKey, networkName);
        const cosignatoriesList: Account[] = [];

        cosignatoriesPrivateKeysList.forEach(async (cosignatory: string) => {
            cosignatoriesList.push(Account.createFromPrivateKey(cosignatory, networkName));
        });

        const multisig: any = await createMultisigService.convertToMultisig(multisigAccount, cosignatoriesList, minApproval, minRemoval, writer, medianFeeMultiplier);
        await transactionService.waitForBondedTransaction(multisig.hash, multisigAccount.address, false, writer);
        writer.addText("Multisig has been formed.");

        writer.addTASK("Cosign multisig creation transaction.");
        for (const cosignatory of cosignatoriesList) {
            await transactionMultisigService.coSignTransaction(cosignatory.privateKey, multisig.cosignHash, writer);
        }
        writer.addText("Transaction has been cosigned.");


        const cosignatoryAccounts: any[] = [];
        for (const cosignatory of cosignatoriesList) {
            cosignatoryAccounts.push({
                address: cosignatory.address,
                privateKey: cosignatory.privateKey,
                publicKey: cosignatory.publicKey
            });
        }
        await transactionService.waitForConfirmedTransaction(multisig.hash, multisigAccount.address, false, writer);
        writer.addText("Transaction has been confirmed.");

        writer.addTASK("Provide multisig information");
        res.json({
            account,
            minApproval,
            minRemoval,
            cosignatoryAccounts
        });

    } catch (error) {
        writer.addERROR(error.message);
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        });
    }
});



/**
 * @swagger
 * /multisig/create/fromProvidedCosignatories/fromMultisig/financial:
 *   post:
 *     summary: Create multisig account from provided cosignatories providing the xym from a multisig account.
 *     description: |
 *       Generates account for the multisig head. \
 *       Sends a transaction to the multisig head account and to the given cosignatory. \
 *       Connects accounts to multisig. \
 *       Co-signs a transaction with the keys of participants. \
 *       Transfers back part of network currency to multisig admin account
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminAccountPublicKeyMultisig:
 *                 type: string
 *                 description: Public key of a multisig account which is going to provide currency for multisig creation
 *                 example: "0B5239348B4492F47FEF260DBFE87A8C88381221A09FBA9C78A64A9DE9814FF8"
 *               adminAccountCosignatoryPrivateKeyMultisig:
 *                 type: string
 *                 description: Private key of a multisig account which is going to provide currency for multisig creation
 *                 example: "F75B2F06B408005BFE66779AA63640597DEB34A75D6221037D57C1A31BA010DC"
 *               cosignatoriesPrivateKeysList:
 *                 type: array
 *                 description: Array of cosignatory private keys
 *                 example: [ "631401F44252AD8D0C9C3C9D508D1311A3F7DB5D8917A1D75E22449CDC7BC405", "648CF47C72BF25FB5E73443A19C6A349250D96CD2F91733214E9D67976D86C7C", "C0824419FD589DCD31C79FFEC7887C3544BF330DEF927BA09AF0D22D3D364A08" ]
 *               cosignatoryForCurrencyPrivateKey:
 *                 type: string
 *                 description: Private key of a cosignatory account which is going to get some funds to initiate transactions on behalf of newly created multisig.
 *                 example: "631401F44252AD8D0C9C3C9D508D1311A3F7DB5D8917A1D75E22449CDC7BC405"
 *               minApproval:
 *                 type: integer
 *                 description: Minimum cosigns needed for transaction approval.
 *                 example: 1
 *               minRemoval:
 *                 type: integer
 *                 description: Minimum cosigns needed for cosignatory removal.
 *                 example: 1
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   type: object
 *                   description: Account
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: User ID.
 *                       example: multisig
 *                     address:
 *                       type: object
 *                       description: Address object.
 *                       properties:
 *                         address:
 *                           type: string
 *                           description: Account address.
 *                           example: TDEEW57VUGI6GDDLYYRZXOXK4XFAAT23UMQ573Q
 *                         networkType:
 *                           type: integer
 *                           description: Blockchain network type.
 *                           example: 152
 *                     privateKey:
 *                       type: string
 *                       description: Account private key.
 *                       example: D1F8EB0D63A75A20D5FAB61998D589D9B2B84CD36193D2FAD0018BD2D1CE369B
 *                     publicKey:
 *                       type: string
 *                       description: Account public key.
 *                       example: FC8B6601CCA7BFD21526E20B938A6CB54A41477B8F19EAF9C20E721D00297E34
 *                 minApproval:
 *                   type: integer
 *                   description: Minimum cosigns for transaction approval.
 *                   example: 1
 *                 minRemoval:
 *                   type: integer
 *                   description: Minimum cosigns for cosignatory removal.
 *                   example: 1
 *                 cosignatoryAccounts:
 *                   type: array
 *                   description: Array of cosignatory account objects.
 *                   items:
 *                     type: object
 *                     description: Cosignatory account object.
 *                     properties:
 *                       address:
 *                         type: object
 *                         description: Address object.
 *                         properties:
 *                           address:
 *                             type: string
 *                             description: Account address.
 *                             example: TAW5FU2OX7ZQRZ7TRZRRQ5U63AEHP3MQ3DJRCYY
 *                           networkType:
 *                             type: integer
 *                             description: Blockchain network type.
 *                             example: 152
 *                       privateKey:
 *                         type: string
 *                         description: Account private key.
 *                         example: 0B267564996A966DD8C7DF45D888F379A4D45915E6601E6272C0B74440F134BF
 *                       publicKey:
 *                         type: string
 *                         description: Account public key.
 *                         example: F74E48CF42206F76F66D04E626AD756CFC568428519E671FD2BD45B27BCFE710
 */
router.post("/create/fromProvidedCosignatories/fromMultisig/financial", async (req: Request, res: Response) => {
    const adminAccountPublicKeyMultisig = req.body.adminAccountPublicKeyMultisig;
    const adminAccountCosignatoryPrivateKeyMultisig: string =  req.body.adminAccountCosignatoryPrivateKeyMultisig;
    const cosignatoriesPrivateKeysList = req.body.cosignatoriesPrivateKeysList;
    const cosignatoryForCurrencyPrivateKey: string = req.body.cosignatoryForCurrencyPrivateKey;
    const minApproval = req.body.minApproval;
    const minRemoval = req.body.minRemoval;
    const length = Object.keys(req.body).length

    if (length !== 6) return res.status(400).send({ status: 'failed', message: 'too many or too little parameters' })
    if (!req.body.cosignatoriesPrivateKeysList) return res.status(400).send({ status: 'failed', message: 'cosignatoriesPrivateKeysList is required' });
    if (!req.body.minApproval) return res.status(400).send({ status: 'failed', message: 'minApproval is required' });
    if (!req.body.minRemoval) return res.status(400).send({ status: 'failed', message: 'minRemoval is required' });
    if (!req.body.adminAccountPublicKeyMultisig) 
        return res.status(400).send({ status: 'failed', message: 'adminAccountPublicKeyMultisig is required' });
    if (!cosignatoryForCurrencyPrivateKey) 
        return res.status(400).send({ status: 'failed', message: 'cosignatoryForCurrencyPrivateKey is required' });
    
    if (adminAccountCosignatoryPrivateKeyMultisig.length != 64){
        return res.status(400).send({
            status: 'failed',
            message: 'multisigAdminAccountCosignatoryPrivateKey input must be exact of 64 character length.',
        });
    }
    if (!req.body.adminAccountCosignatoryPrivateKeyMultisig) 
        return res.status(400).send({ status: 'failed', message: 'multisigAdminAccountCosignatoryPrivateKey is required' });

    if (cosignatoriesPrivateKeysList.length < minApproval || cosignatoriesPrivateKeysList.length < minRemoval){
        return res.status(400).send({
            status: 'failed',
            message: 'Not enough cosignatories for provided minApproval and minRemoval number.',
        });
    }
    for (const cosignatory of cosignatoriesPrivateKeysList) {
        if(cosignatory.length != 64){
            return res.status(400).send({
                status: 'failed',
                message: 'Each cosignatory private key input must match 64 character length.',
            });
        }
    }
    if(!cosignatoriesPrivateKeysList.includes(cosignatoryForCurrencyPrivateKey)){
        return res.status(400).send({
            status: 'failed',
            message: 'cosignatoryForCurrencyPrivateKey input must be in cosignatoriesPrivateKeysList input.',
        });
    }

    if(minApproval !=1){
        return res.status(400).send({
            status: 'failed',
            message: 'Choose different endpoint if more than one minApproval is required.',
        });
    }

    
    const writer = new Writer();
    
    try {
        writer.createStream(generator.makeLog());
        writer.addTASK("createMultisigTemplate.createFromProvidedCosignatories");
    
        writer.addTASK("create an account for multisig.");
        const account: any = await accountService.createAccount("multisig")
        writer.addText("Account has been created.")
    
        writer.addTASK("Send currency to future multisig account.");

        //Account address which will be converted to multisig
        const recipientAddress: string = account.address.address;
        const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();
        const cosignatoryAccountForTransfer = Account.createFromPrivateKey(cosignatoryForCurrencyPrivateKey, networkName);
        const adminAccountAddress = PublicAccount.createFromPublicKey(adminAccountPublicKeyMultisig, networkName).address.plain();

        const adminAccountBalance: number = await accountService.getUserBalanceForGivenMosaicId(
                adminAccountAddress,
                Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING
        )
        if(adminAccountBalance < Constants.MINIMUM_MULTISIG_CURRENCY_AMOUNT  + 1_100_000)
        {
            throw Error("adminAccountPublicKeyMultisig has insufficient balance to perform funding actions")
        }
        const message: string = "Sending currency for future multisig";
        await transactionMultisigService.sendMultisigTransactionMosaicWithCosignatory(
            adminAccountPublicKeyMultisig, adminAccountCosignatoryPrivateKeyMultisig,
            [recipientAddress, cosignatoryAccountForTransfer.publicAccount.address.plain()],
            [Constants.MINIMUM_MULTISIG_CURRENCY_AMOUNT, 1_100_000], 
            Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING, writer, medianFeeMultiplier, message
        );
        writer.addText("Transfer transactions have been confirmed.");
        
        writer.addTASK("Connect accounts to multisig.");
        const multisigAccount = Account.createFromPrivateKey(account.privateKey, networkName);
        const cosignatoriesList: Account[] = [];

        cosignatoriesPrivateKeysList.forEach(async (cosignatory: string) => {
            cosignatoriesList.push(Account.createFromPrivateKey(cosignatory, networkName));
        });

        const multisig: any = await createMultisigService.convertToMultisig(multisigAccount, cosignatoriesList, minApproval, minRemoval, writer, medianFeeMultiplier);
        await transactionService.waitForBondedTransaction(multisig.hash, multisigAccount.address, false, writer);
        writer.addText("Multisig has been formed.");

        writer.addTASK("Cosign multisig creation transaction.");
        for (const cosignatory of cosignatoriesList) {
            await transactionMultisigService.coSignTransaction(cosignatory.privateKey, multisig.cosignHash, writer);
        }
        writer.addText("Transaction has been cosigned.");


        const cosignatoryAccounts: any[] = [];
        for (const cosignatory of cosignatoriesList) {
            cosignatoryAccounts.push({
                address: cosignatory.address,
                privateKey: cosignatory.privateKey,
                publicKey: cosignatory.publicKey
            });
        }
        await transactionService.waitForConfirmedTransaction(multisig.hash, multisigAccount.address, false, writer);
        writer.addText("Transaction has been confirmed.");



        
        writer.addText("Begin transfer transaction back to admin multisig account");
        const amountToTransferBack: number = await accountService.getUserBalanceForGivenMosaicId(
            multisigAccount.address.plain(),
            Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING
         ) * 0.8;

        
        await transactionMultisigService.sendMultisigTransactionMosaicComplete(
            multisigAccount.publicKey, cosignatoryAccountForTransfer.privateKey,
            adminAccountAddress,
            Math.floor(amountToTransferBack), 
            Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING, writer, medianFeeMultiplier, 'return funds to admin multisig account', 
        );
        writer.addText("Transfer transaction back to admin multisig account has been confirmed.");
        
        writer.addTASK("Provide multisig information");
        res.json({
            account,
            minApproval,
            minRemoval,
            cosignatoryAccounts
        });

    } catch (error) {
        writer.addERROR(error.message);
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        });
    }
});


/**
 * @swagger
 * /multisig/create/fromProvidedCosignatories:
 *   post:
 *     summary: Create multisig account from provided cosignatories.
 *     description: |
 *       Generates account for the multisig head. \
 *       Sends a transaction to the multisig head account. \
 *       Connects accounts to multisig. \
 *       Co-signs a transaction with the keys of participants.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminAccountPrivateKey:
 *                 type: string
 *                 description: Private key of account which is going to provide currency for multisig creation
 *                 example: "F75B2F06B408005BFE66779AA63640597DEB34A75D6221037D57C1A31BA010DC"
 *               cosignatoriesPrivateKeysList:
 *                 type: array
 *                 description: Array of cosignatory private keys
 *                 example: [ "631401F44252AD8D0C9C3C9D508D1311A3F7DB5D8917A1D75E22449CDC7BC405", "648CF47C72BF25FB5E73443A19C6A349250D96CD2F91733214E9D67976D86C7C", "C0824419FD589DCD31C79FFEC7887C3544BF330DEF927BA09AF0D22D3D364A08" ]
 *               minApproval:
 *                 type: integer
 *                 description: Minimum cosigns needed for transaction approval.
 *                 example: 1
 *               minRemoval:
 *                 type: integer
 *                 description: Minimum cosigns needed for cosignatory removal.
 *                 example: 1
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   type: object
 *                   description: Account
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: User ID.
 *                       example: multisig
 *                     address:
 *                       type: object
 *                       description: Address object.
 *                       properties:
 *                         address:
 *                           type: string
 *                           description: Account address.
 *                           example: TDEEW57VUGI6GDDLYYRZXOXK4XFAAT23UMQ573Q
 *                         networkType:
 *                           type: integer
 *                           description: Blockchain network type.
 *                           example: 152
 *                     privateKey:
 *                       type: string
 *                       description: Account private key.
 *                       example: D1F8EB0D63A75A20D5FAB61998D589D9B2B84CD36193D2FAD0018BD2D1CE369B
 *                     publicKey:
 *                       type: string
 *                       description: Account public key.
 *                       example: FC8B6601CCA7BFD21526E20B938A6CB54A41477B8F19EAF9C20E721D00297E34
 *                 minApproval:
 *                   type: integer
 *                   description: Minimum cosigns for transaction approval.
 *                   example: 1
 *                 minRemoval:
 *                   type: integer
 *                   description: Minimum cosigns for cosignatory removal.
 *                   example: 1
 *                 cosignatoryAccounts:
 *                   type: array
 *                   description: Array of cosignatory account objects.
 *                   items:
 *                     type: object
 *                     description: Cosignatory account object.
 *                     properties:
 *                       address:
 *                         type: object
 *                         description: Address object.
 *                         properties:
 *                           address:
 *                             type: string
 *                             description: Account address.
 *                             example: TAW5FU2OX7ZQRZ7TRZRRQ5U63AEHP3MQ3DJRCYY
 *                           networkType:
 *                             type: integer
 *                             description: Blockchain network type.
 *                             example: 152
 *                       privateKey:
 *                         type: string
 *                         description: Account private key.
 *                         example: 0B267564996A966DD8C7DF45D888F379A4D45915E6601E6272C0B74440F134BF
 *                       publicKey:
 *                         type: string
 *                         description: Account public key.
 *                         example: F74E48CF42206F76F66D04E626AD756CFC568428519E671FD2BD45B27BCFE710
 */
router.post("/create/fromProvidedCosignatories", async (req: Request, res: Response) => {
    const adminAccountPrivateKey = req.body.adminAccountPrivateKey;
    const cosignatoriesPrivateKeysList = req.body.cosignatoriesPrivateKeysList;
    const minApproval = req.body.minApproval;
    const minRemoval = req.body.minRemoval;
    const length = Object.keys(req.body).length

    if (length !== 4) return res.status(400).send({ status: 'failed', message: 'too many or too little parameters' })
    if (!req.body.cosignatoriesPrivateKeysList) return res.status(400).send({ status: 'failed', message: 'cosignatoriesPrivateKeysList is required' });
    if (!req.body.minApproval) return res.status(400).send({ status: 'failed', message: 'minApproval is required' });
    if (!req.body.minRemoval) return res.status(400).send({ status: 'failed', message: 'minRemoval is required' });
    if (!req.body.adminAccountPrivateKey) return res.status(400).send({ status: 'failed', message: 'adminAccountPrivateKey is required' });

    if (cosignatoriesPrivateKeysList.length<minApproval || cosignatoriesPrivateKeysList.length<minRemoval)
        return res.status(400).send({
            status: 'failed',
            message: 'Not enough cosignatories for provided minApproval and minRemoval number.',
        });
    
    for (const cosignatory of cosignatoriesPrivateKeysList) {
        if(cosignatory.length != 64){
            return res.status(400).send({
                status: 'failed',
                message: 'Each cosignatory private key input must match 64 character length.',
            });
        }
    }

    const writer = new Writer();
    
    try {
        writer.createStream(generator.makeLog());
        const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();

        writer.addTASK("createMultisigTemplate.createFromProvidedCosignatories");

        writer.addTASK("create an account for multisig.");
        const account: any = await accountService.createAccount("multisig");
        writer.addText("Account has been created.");

        writer.addTASK("Send currency to future multisig account.");
        // transaction may send less currency, or send 0, if the fees are deleted
        const transaction: any = await transactionService.sendTransactionWithMosaicId(
            adminAccountPrivateKey,
            account.address.address,
            Constants.MINIMUM_MULTISIG_CURRENCY_AMOUNT,
            Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING,
            "Sending currency for future multisig",
            writer
        );
        writer.addText("Transaction has been sent.");

        await transactionService.waitForConfirmedTransaction(transaction.hash, account.address, false, writer);
        writer.addText("Transaction has been confirmed.");
        
        writer.addTASK("Connect accounts to multisig.");
        const multisigAccount = Account.createFromPrivateKey(account.privateKey, networkName);
        const cosignatoriesList: Account[] = [];

        cosignatoriesPrivateKeysList.forEach(async (cosignatory: string) => {
            cosignatoriesList.push(Account.createFromPrivateKey(cosignatory, networkName));
        });

        const multisig: any = await createMultisigService.convertToMultisig(multisigAccount, cosignatoriesList, minApproval, minRemoval, writer, medianFeeMultiplier);
        await transactionService.waitForBondedTransaction(multisig.hash, multisigAccount.address, false, writer);
        writer.addText("Multisig has been formed.");

        writer.addTASK("Cosign multisig creation transaction.");
        for (const cosignatory of cosignatoriesList) {
            await transactionMultisigService.coSignTransaction(cosignatory.privateKey, multisig.cosignHash, writer);
        }
        writer.addText("Transaction has been cosigned.");

        const cosignatoryAccounts: any[] = [];
        for (const cosignatory of cosignatoriesList) {
            cosignatoryAccounts.push({
                address: cosignatory.address,
                privateKey: cosignatory.privateKey,
                publicKey: cosignatory.publicKey
            });
        }
        await transactionService.waitForConfirmedTransaction(multisig.hash, multisigAccount.address, false, writer);
        writer.addText("Transaction has been confirmed.");

        writer.addTASK("Provide multisig information");
        res.json({
            account,
            minApproval,
            minRemoval,
            cosignatoryAccounts
        });
    } catch (error) {
        writer.addERROR(error.message);
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        });
    }
});

/**
 * @swagger
 * /multisig/modify:
 *   put:
 *     summary: Modify Multisig members and structure.
 *     description: |
 *       Modify Multisig members and structure. \
 *       Uses Aggregate Bonded transaction multisigPublicKey Multisig Account, which is going to be modified.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cosignatoryPrivateKeyList:
 *                 type: list
 *                 description: Cosignatory private key list. Have to be at least as many as minApproval/minRemoval
 *                 example: [ "631401F44252AD8D0C9C3C9D508D1311A3F7DB5D8917A1D75E22449CDC7BC405", "648CF47C72BF25FB5E73443A19C6A349250D96CD2F91733214E9D67976D86C7C"]
 *               multisigPublicKey:
 *                 type: string
 *                 description: Multisig public key.
 *                 example: 3BD046E921CF3A29DA42D0D0CE30DCEBE84F484634C67581D60F7790C55154E8
 *               newMinApproval:
 *                 type: number
 *                 description: Minimum cosigns needed for transaction approval.
 *                 example: 2
 *               newMinRemoval:
 *                 type: number
 *                 description: Minimum cosigns needed for cosignatory removal.
 *                 example: 1
 *               newCosignatoryPublicKey:
 *                 type: string
 *                 description: Private key of the cosignatory to be added.
 *                 example: ""
 *               cosignatoryToRemovePublicKey:
 *                 type: string
 *                 description: Public key of the cosignatory to be removed.
 *                 example: 8BA2AA95C462074F1780D14A9218FDA679C47AC3E152327D3D142F81054280C0
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                   description: Transaction hash.
 *                   example: B6363DCAA30B03F61DDA31407F8207C57FB40606F07C7B96EB62A820786A9DFA
 *                 group:
 *                   type: string
 *                   description: Transaction type.
 *                   example: confirmed
 *                 status:
 *                   type: string
 *                   description: Transaction status.
 *                   example: success
 */
router.put("/modify", async (req: Request, res: Response) => {
    const cosignatoryPrivateKeyList = req.body.cosignatoryPrivateKeyList;
    const multisigPublicKey = req.body.multisigPublicKey;
    const newMinApproval = req.body.newMinApproval;
    const newMinRemoval = req.body.newMinRemoval;
    let newCosignatoryPrivateKey = req.body.newCosignatoryPrivateKey;
    let cosignatoryToRemovePublicKey = req.body.cosignatoryToRemovePublicKey;
    const length = Object.keys(req.body).length

    if (length !== 6) return res.status(400).send({ status: 'failed', message: 'too many or too little parameters' });
    if (!req.body.multisigPublicKey) return res.status(400).send({ status: 'failed', message: 'multisigPublicKey is required' });
    if (!req.body.newMinApproval) return res.status(400).send({ status: 'failed', message: 'newMinApproval is required' });
    if (!req.body.newMinRemoval) return res.status(400).send({ status: 'failed', message: 'newMinRemoval is required' });

    if (!req.body.cosignatoryPrivateKeyList || req.body.cosignatoryPrivateKeyList.length===0)
        return res.status(400).send({ status: 'failed', message: 'cosignatoryPrivateKeyList is required' });

    if (!req.body.newCosignatoryPrivateKey)
        if (req.body.newCosignatoryPrivateKey === "0" || req.body.newCosignatoryPrivateKey === "")
            newCosignatoryPrivateKey = undefined;
        else return res.status(400).send({ status: 'failed', message: 'newCosignatoryPrivateKey is required' });

    if (!req.body.cosignatoryToRemovePublicKey)
        if (req.body.cosignatoryToRemovePublicKey === "0" || req.body.cosignatoryToRemovePublicKey === "")
            cosignatoryToRemovePublicKey = undefined;
        else return res.status(400).send({ status: 'failed', message: 'cosignatoryToRemovePublicKey is required' });

    const writer = new Writer();
    writer.createStream(generator.makeLog());

    try {
        writer.addText("Get current multisig information.");
        const multisigAccount = PublicAccount.createFromPublicKey(multisigPublicKey, networkName);
        const multisigInfo :any = await getMultisigService.getMultisigInfo(multisigAccount.address.plain())

        var newCosignatoryPublicKey = undefined
        if (newCosignatoryPrivateKey) {
            newCosignatoryPublicKey = Account.createFromPrivateKey(newCosignatoryPrivateKey, networkName).publicKey;
        }

        const minApproval :number = multisigInfo.minApproval;
        const minRemoval :number = multisigInfo.minRemoval;
        const approvalChange :number = Number(newMinApproval) - minApproval;
        const removalChange :number = Number(newMinRemoval) - minRemoval;

        writer.addTASK("modifyMultisigService.modifyMultisigBonded");
        const result: any = await modifyMultisigService.modifyMultisigBonded(
            multisigPublicKey,
            cosignatoryPrivateKeyList[0],
            approvalChange,
            removalChange,
            newCosignatoryPublicKey,
            cosignatoryToRemovePublicKey,
            writer
        ).catch(error => { throw(error) });
        await transactionService.waitForBondedTransaction(result.cosignHash, multisigAccount.address, false, writer);

        let i = 1;

        var minCosigns: number = 0;
        if (!cosignatoryToRemovePublicKey)
            minCosigns = multisigInfo.minApproval;
        else if (!approvalChange && !removalChange && !newCosignatoryPrivateKey)
            minCosigns = multisigInfo.minRemoval;
        else
            minCosigns = (multisigInfo.minRemoval > multisigInfo.minApproval) ? multisigInfo.minRemoval : multisigInfo.minApproval;

        while (i < minCosigns) {
            var cosignRes: any = await transactionMultisigService.coSignTransaction(
                cosignatoryPrivateKeyList[i],
                result.cosignHash,
                writer
            );
            i++;
        }

        if (newCosignatoryPrivateKey) {
            await transactionMultisigService.coSignTransaction(
                newCosignatoryPrivateKey,
                result.cosignHash,
                writer
            );
        }

        const transactionStatus: any = await transactionService.waitForConfirmedTransaction(result.cosignHash, multisigAccount.address, false, writer);
        res.json({
            transactionHash: result.hash,
            status: result.status,
            group: transactionStatus.group
        });
    } catch (error) {
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        })
    }
});

/**
 * @swagger
 * /multisig/getInfo/{multisigAddress}:
 *   get:
 *     summary: Returns information about the multisig's members (cosignatories).
 *     description: |
 *       Returns information about the multisig's members (cosignatories).
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: multisigAddress
 *         required: true
 *         schema:
 *           type: string
 *           description: Multisig account address.
 *           example: TDEEW57VUGI6GDDLYYRZXOXK4XFAAT23UMQ573Q
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: integer
 *                   description: Version.
 *                   example: 1
 *                 accountAddress:
 *                   type: object
 *                   description: Account address object.
 *                   properties:
 *                     address:
 *                       type: string
 *                       description: Account address.
 *                       example: TDEEW57VUGI6GDDLYYRZXOXK4XFAAT23UMQ573Q
 *                     networkType:
 *                       type: integer
 *                       description: Blockchain network type.
 *                       example: 152
 *                 minApproval:
 *                   type: integer
 *                   description: minimum number of cosignatories to confirm transaction
 *                   example: 1
 *                 minRemoval:
 *                   type: string
 *                   description: minimum number of cosignatories needed to remove a cosignatory
 *                   example: 2
 *                 cosignatoryAddresses:
 *                   type: array
 *                   description: Array of cosignatory address objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       address:
 *                         type: string
 *                         description: Account address.
 *                         example: TAW5FU2OX7ZQRZ7TRZRRQ5U63AEHP3MQ3DJRCYY
 *                       networkType:
 *                         type: integer
 *                         description: Blockchain network type.
 *                         example: 152
 *                 multisigAddresses:
 *                   type: array
 *                   description: a list of multisig accounts to which a multisig belongs to
 *                   example: []
 */
router.get("/getInfo/:multisigAddress", (req: Request, res: Response) => {
    const address = req.params.multisigAddress;

    if (!req.params.multisigAddress) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigAddress is required',
        });
    }

    getMultisigService.getMultisigInfo(address)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});
export default router;
