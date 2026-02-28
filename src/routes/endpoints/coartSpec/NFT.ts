import express = require("express");
import { Request, Response } from "express";
import {Writer} from '../../../helpers/writer';
import {generator} from "../../../helpers/generator";
import {metadataService} from "../../../services/symbol-sdk/metadataService";
import {mosaicService} from "../../../services/symbol-sdk/mosaicService";
import {transactionService} from "../../../services/symbol-sdk/transactionService";
import {Account, AggregateTransactionInfo, KeyGenerator, PublicAccount, Transaction} from "symbol-sdk";
import {Constants} from '../../../helpers/constants';
import {mosaicMultisigService} from "../../../services/symbol-sdk/multisig/mosaicMultisigService";
import {metadataMultisigService} from "../../../services/symbol-sdk/multisig/metadataMultisigService";
import {transactionMultisigService} from "../../../services/symbol-sdk/multisig/transactionMultisigService";
import { blockchainService } from "../../../services/symbol-sdk/blockchainService";
import { accountService } from "../../../services/symbol-sdk/accountService";


const networkName = Constants.NETWORK_IDENTIFIER;
const router = express.Router();

/**
 * @swagger
 * /nft/create:
 *   post:
 *     summary: Creates a new nft.
 *     description: |
 *       Creates a new nft for the given account.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               privateKey:
 *                 type: string
 *                 description: Account which creates a mosaic private key.
 *                 example: 79AF1D3741B427CEE34143BE19E93F573B1AF97F0EDFFFB26683E2A25570B7A0
 *               amount:
 *                 type: integer
 *                 description: Amount of mosaic to create.
 *                 example: 1
 *               divisibility:
 *                 type: integer
 *                 description: Mosaic divisibility.
 *                 example: 0
 *               duration:
 *                 type: integer
 *                 description: Duration of validity.
 *                 example: 1000
 *               metadataKey:
 *                 type: string
 *                 description: Metadata key.
 *                 example: key1
 *               metadataValue:
 *                 type: string
 *                 description: Metadata value.
 *                 example: Value1
 *               userAddress:
 *                 type: string
 *                 description: User who is creating an NFT address.
 *                 example: TC7I7E7O325KSJJZS4PMJ6EIHZFEFWWCHHLPJCQ
 *               sendMessage:
 *                 type: string
 *                 description: Message.
 *                 example: "NFT created."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mosaicId:
 *                   type: string
 *                   description: Mosaic ID.
 *                   example: 2BE68A6BC9E43079
 *                 metadataKey:
 *                   type: string
 *                   description: Metadata key.
 *                   example: key1
 *                 metadataKeyHex:
 *                   type: string
 *                   description: Metadata key in hexadecimal.
 *                   example: 9438C047281E2E7B
 *                 metadataValue:
 *                   type: string
 *                   description: Metadata value.
 *                   example: value1
 *                 mosaicCreationHash:
 *                   type: string
 *                   description: Mosaic creation transaction hash.
 *                   example: F6D14976E0969C1D02E915035B410C11180018755C88D280D89FDE0DDAC176E4
 *                 metadataAttachmentHash:
 *                   type: string
 *                   description: Metadata attachment transaction hash.
 *                   example: A5C0C195D369ED5FE9A7C4A8393504EE8612BE44DD4ACB799F2B86D54389BCF7
 *                 sendMosaicTransactionHash:
 *                   type: string
 *                   description: Mosaic transaction hash.
 *                   example: 34085E9EE70F99330953FD462546BB6F7395D0DCE345DA78341A10A4F37BE66C
 */
router.post("/create", async (req: Request, res: Response) => {
    const privateKey = req.body.privateKey;
    const amount = req.body.amount;
    const divisibility = req.body.divisibility;
    const duration = req.body.duration;
    const metadataKey = req.body.metadataKey;
    const metadataValue = req.body.metadataValue;
    const ownerAddress = req.body.ownerAddress;
    const sendMessage = req.body.sendMessage;
    const length = Object.keys(req.body).length;

    if (length !== 8) return res.status(400).send({ status: "failed", message: "too many or too little parameters" });
    if (!req.body.privateKey) return res.status(400).send({ status: "failed", message: "privateKey is required" });
    if (!req.body.amount) return res.status(400).send({ status: "failed", message: "amount is required" });
    if (!req.body.divisibility) return res.status(400).send({ status: "failed", message: "divisibility is required" });
    if (!req.body.duration) return res.status(400).send({ status: "failed", message: "duration is required" });
    if (!req.body.metadataKey) return res.status(400).send({ status: "failed", message: "metadataKey is required" });
    if (!req.body.metadataValue) return res.status(400).send({ status: "failed", message: "metadataValue is required" });
    if (!req.body.ownerAddress) return res.status(400).send({ status: "failed", message: "contractAddress is required" });
    if (!req.body.sendMessage) return res.status(400).send({ status: "failed", message: "sendMessage is required" });

    if(ownerAddress.length != 39){
        return res.status(400)
        .send({ status: "failed", message: "ownerAddress parameter must be 39 characters long" });
    }

    try {
        const senderAccount = Account.createFromPrivateKey(privateKey, Constants.NETWORK_IDENTIFIER);
        const writer = new Writer();
        writer.createStream(generator.makeLog("create mosaic with metadata sent to the multisig"));

        writer.addTASK("mosaicService.createMosaicBondedWithoutNamespace");
        const mosaicTransaction = await mosaicService.createMosaicBondedWithoutNamespace(privateKey, amount, divisibility, duration, writer);
        await transactionService.waitForFinalizedTransaction(mosaicTransaction.hash, senderAccount.address, false, writer);

        writer.addTASK("transactionService.getConfirmedinfo");
        const confirmedInfo: any = await transactionService.getConfirmedTransactionInfo(mosaicTransaction.hash);
        const mosaicId = confirmedInfo.transaction.transactions[1].transaction.mosaicId;

        writer.addTASK("metadataService.assignMetadataToMosaic");
        const metadataTransaction: any = await metadataService.assignMetadataToMosaicBonded(privateKey, mosaicId, metadataKey, metadataValue, writer);
        await transactionService.waitForConfirmedTransaction(metadataTransaction.hash, senderAccount.address, false, writer);

        writer.addTASK("sendMosaic.sendMosaicToAddress");
        const sendTransaction: any = await transactionService.sendTransactionMosaic(privateKey, ownerAddress, amount, mosaicId, sendMessage, writer);
        await transactionService.waitForConfirmedTransaction(sendTransaction.hash, senderAccount.address, false, writer);

        res.json({
            "mosiacId": mosaicId,
            "metadataKey": metadataKey,
            "metadataKeyHex": (KeyGenerator.generateUInt64Key(metadataKey)).toHex(),
            "metadataValue": metadataValue,
            "mosaicCreationHash": mosaicTransaction.hash,
            "metadataAttachmentHash": metadataTransaction.hash,
            "sendMosaicTransactionHash": sendTransaction.hash
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
 * /nft/create/fromMultisig:
 *   post:
 *     summary: Creates a new nft from a multisig account.
 *     description: |
 *       Creates a new nft for the given account.
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
 *                 description: Multisig account which creates a mosaic public key.
 *                 example: 7FECFBD6C74D75D42E27D1D476CAF9FAC63957AA6688507ED029B5217DB93E0A
 *               adminCosignatoryPrivateKeyMultisig:
 *                 type: string
 *                 description: Multisig account cosignatory which creates a mosaic private key.
 *                 example: 5EE980B0C60F66ED754B46E3B1EDDA928D46240F3A8C91A2A27893CC839686CB
 *               amount:
 *                 type: integer
 *                 description: Amount of mosaic to create.
 *                 example: 1
 *               divisibility:
 *                 type: integer
 *                 description: Mosaic divisibility.
 *                 example: 0
 *               duration:
 *                 type: integer
 *                 description: Duration of validity.
 *                 example: 1000
 *               metadataKey:
 *                 type: string
 *                 description: Metadata key.
 *                 example: key1
 *               metadataValue:
 *                 type: string
 *                 description: Metadata value.
 *                 example: Value1
 *               userAddress:
 *                 type: string
 *                 description: User who is creating an NFT address.
 *                 example: TC7I7E7O325KSJJZS4PMJ6EIHZFEFWWCHHLPJCQ
 *               sendMessage:
 *                 type: string
 *                 description: Message.
 *                 example: "NFT created."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mosaicId:
 *                   type: string
 *                   description: Mosaic ID.
 *                   example: 2BE68A6BC9E43079
 *                 metadataKey:
 *                   type: string
 *                   description: Metadata key.
 *                   example: key1
 *                 metadataKeyHex:
 *                   type: string
 *                   description: Metadata key in hexadecimal.
 *                   example: 9438C047281E2E7B
 *                 metadataValue:
 *                   type: string
 *                   description: Metadata value.
 *                   example: value1
 *                 mosaicCreationHash:
 *                   type: string
 *                   description: Mosaic creation transaction hash.
 *                   example: F6D14976E0969C1D02E915035B410C11180018755C88D280D89FDE0DDAC176E4
 *                 metadataAttachmentHash:
 *                   type: string
 *                   description: Metadata attachment transaction hash.
 *                   example: A5C0C195D369ED5FE9A7C4A8393504EE8612BE44DD4ACB799F2B86D54389BCF7
 *                 sendMosaicTransactionHash:
 *                   type: string
 *                   description: Mosaic transaction hash.
 *                   example: 34085E9EE70F99330953FD462546BB6F7395D0DCE345DA78341A10A4F37BE66C
 */
router.post("/create/fromMultisig", async (req: Request, res: Response) => {
    const adminAccountPublicKeyMultisig = req.body.adminAccountPublicKeyMultisig;
    const adminCosignatoryPrivateKeyMultisig = req.body.adminCosignatoryPrivateKeyMultisig;
    const amount = req.body.amount;
    const divisibility = req.body.divisibility;
    const duration = req.body.duration;
    const metadataKey = req.body.metadataKey;
    const metadataValue = req.body.metadataValue;
    const ownerAddress = req.body.ownerAddress;
    const sendMessage = req.body.sendMessage;
    const length = Object.keys(req.body).length;

    if (length !== 9) return res.status(400).send({ status: "failed", message: "too many or too little parameters" });
    if (!req.body.adminCosignatoryPrivateKeyMultisig) return res.status(400).send({ status: "failed", message: "adminCosignatoryPrivateKeyMultisig is required" });
    if (!req.body.adminAccountPublicKeyMultisig) return res.status(400).send({ status: "failed", message: "adminAccountPublicKeyMultisig is required" });
    if (!req.body.amount) return res.status(400).send({ status: "failed", message: "amount is required" });
    if (!req.body.divisibility) return res.status(400).send({ status: "failed", message: "divisibility is required" });
    if (!req.body.duration) return res.status(400).send({ status: "failed", message: "duration is required" });
    if (!req.body.metadataKey) return res.status(400).send({ status: "failed", message: "metadataKey is required" });
    if (!req.body.metadataValue) return res.status(400).send({ status: "failed", message: "metadataValue is required" });
    if (!req.body.ownerAddress) return res.status(400).send({ status: "failed", message: "contractAddress is required" });
    if (!req.body.sendMessage) return res.status(400).send({ status: "failed", message: "sendMessage is required" });

    try {
        const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();
        const creatorPublicAccount = PublicAccount.createFromPublicKey(adminAccountPublicKeyMultisig, Constants.NETWORK_IDENTIFIER);
        const writer = new Writer();
        writer.createStream(generator.makeLog("create mosaic with metadata sent to the multisig"));

        writer.addTASK("mosaicService.createMosaicBondedWithoutNamespace");
        const mosaicTransaction = await mosaicMultisigService.createMosaicWithoutNamespace(adminAccountPublicKeyMultisig, adminCosignatoryPrivateKeyMultisig, amount, divisibility, duration, writer);
        await transactionService.waitForFinalizedTransaction(mosaicTransaction.hash, creatorPublicAccount.address, true, writer);

        writer.addTASK("transactionService.getConfirmedinfo");
        const confirmedInfo: any = await transactionService.getConfirmedTransactionInfo(mosaicTransaction.hash);
        const mosaicId: string = confirmedInfo.transaction.transactions[1].transaction.mosaicId;

        writer.addTASK("metadataService.assignMetadataToMosaic");
        const metadataTransaction: any = await metadataMultisigService.assignMetadataToMosaic(adminAccountPublicKeyMultisig, adminCosignatoryPrivateKeyMultisig, mosaicId, metadataKey, metadataValue, writer, medianFeeMultiplier);
        writer.addTASK("Metadata assignment status is: " + metadataTransaction.group);

        if (!(!ownerAddress || ownerAddress === "" || ownerAddress===creatorPublicAccount.address.plain())) {
            writer.addTASK("sendMosaic.sendMosaicToAddress");
            const sendTransaction: any = await transactionMultisigService.sendMultisigTransactionMosaic(adminAccountPublicKeyMultisig, adminCosignatoryPrivateKeyMultisig, ownerAddress, amount, mosaicId, writer, medianFeeMultiplier, sendMessage);

            res.json({
                "mosaicId": mosaicId,
                "metadataKey": metadataKey,
                "metadataKeyHex": (KeyGenerator.generateUInt64Key(metadataKey)).toHex(),
                "metadataValue": metadataValue,
                "mosaicCreationHash": mosaicTransaction.hash,
                "metadataAttachmentHash": metadataTransaction.hash,
                "sendMosaicTransactionHash": sendTransaction.hash
            });
        }
        else {
            res.json({
                "mosiacId": mosaicId,
                "metadataKey": metadataKey,
                "metadataKeyHex": (KeyGenerator.generateUInt64Key(metadataKey)).toHex(),
                "metadataValue": metadataValue,
                "mosaicCreationHash": mosaicTransaction.hash,
                "metadataAttachmentHash": metadataTransaction.hash
            });
        }
    } catch (error) {
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        })
    }
});


/**
 * @swagger
 * /nft/create/fromMultisig/escrow:
 *   post:
 *     summary: Creates a new nft from a multisig account.
 *     description: |
 *       Creates a new nft for the given account when that account pays mosaic creation (rental) fee.
 *       Owner private key cannot be the same as adminAccountCosignatoryPrivateKeyMultisig.
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
 *                 description: Multisig account which creates a mosaic public key.
 *                 example: 7FECFBD6C74D75D42E27D1D476CAF9FAC63957AA6688507ED029B5217DB93E0A
 *               adminCosignatoryPrivateKeyMultisig:
 *                 type: string
 *                 description: Multisig account cosignatory which creates a mosaic private key.
 *                 example: 5EE980B0C60F66ED754B46E3B1EDDA928D46240F3A8C91A2A27893CC839686CB
 *               amount:
 *                 type: integer
 *                 description: Amount of mosaic to create.
 *                 example: 1
 *               divisibility:
 *                 type: integer
 *                 description: Mosaic divisibility.
 *                 example: 0
 *               duration:
 *                 type: integer
 *                 description: Duration of validity.
 *                 example: 1000
 *               metadataKey:
 *                 type: string
 *                 description: Metadata key.
 *                 example: key1
 *               metadataValue:
 *                 type: string
 *                 description: Metadata value.
 *                 example: Value1
 *               ownerCosignatoryPrivateKeyMultisig:
 *                 type: string
 *                 description: Multisig private key who is cosigning transactions in the name of multisig owner.
 *                 example: 0422F1E3CAC62FA64BAF999C1346B0FB4EEA319C2EC4E7701A0D085B2DBA7DA4
 *               ownerPublickeyMultisig:
 *                 type: string
 *                 description: Multisig owner public key who is receiving an NFT address and paying rental fees through escrow contract.
 *                 example: 2671D1C01036DE67D06726FF804905731F03EBEC1DE70ADE918F032957B57442
 *               sendMessage:
 *                 type: string
 *                 description: Message.
 *                 example: "NFT created."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mosaicId:
 *                   type: string
 *                   description: Mosaic ID.
 *                   example: 2BE68A6BC9E43079
 *                 metadataKey:
 *                   type: string
 *                   description: Metadata key.
 *                   example: key1
 *                 metadataKeyHex:
 *                   type: string
 *                   description: Metadata key in hexadecimal.
 *                   example: 9438C047281E2E7B
 *                 metadataValue:
 *                   type: string
 *                   description: Metadata value.
 *                   example: value1
 *                 mosaicCreationHash:
 *                   type: string
 *                   description: Mosaic creation transaction hash.
 *                   example: F6D14976E0969C1D02E915035B410C11180018755C88D280D89FDE0DDAC176E4
 *                 metadataAttachmentHash:
 *                   type: string
 *                   description: Metadata attachment transaction hash.
 *                   example: A5C0C195D369ED5FE9A7C4A8393504EE8612BE44DD4ACB799F2B86D54389BCF7
 *                 sendMosaicTransactionHash:
 *                   type: string
 *                   description: Mosaic transaction hash.
 *                   example: 34085E9EE70F99330953FD462546BB6F7395D0DCE345DA78341A10A4F37BE66C
 */
router.post("/create/fromMultisig/escrow", async (req: Request, res: Response) => {
    const adminAccountPublicKeyMultisig = req.body.adminAccountPublicKeyMultisig;
    const adminCosignatoryPrivateKeyMultisig = req.body.adminCosignatoryPrivateKeyMultisig;
    const amount = req.body.amount;
    const divisibility = req.body.divisibility;
    const duration = req.body.duration;
    const metadataKey = req.body.metadataKey;
    const metadataValue = req.body.metadataValue;
    const ownerCosignatoryPrivateKeyMultisig = req.body.ownerCosignatoryPrivateKeyMultisig;
    const ownerPublickeyMultisig = req.body.ownerPublickeyMultisig;
    const sendMessage = req.body.sendMessage;
    const length = Object.keys(req.body).length;

    if (length !== 10) return res.status(400).send({ status: "failed", message: "too many or too little parameters" });
    if (!req.body.adminCosignatoryPrivateKeyMultisig) return res.status(400).send({ status: "failed", message: "adminCosignatoryPrivateKeyMultisig is required" });
    if (!req.body.adminAccountPublicKeyMultisig) return res.status(400).send({ status: "failed", message: "adminAccountPublicKeyMultisig is required" });
    if (!req.body.amount) return res.status(400).send({ status: "failed", message: "amount is required" });
    if (!req.body.divisibility) return res.status(400).send({ status: "failed", message: "divisibility is required" });
    if (!req.body.duration) return res.status(400).send({ status: "failed", message: "duration is required" });
    if (!req.body.metadataKey) return res.status(400).send({ status: "failed", message: "metadataKey is required" });
    if (!req.body.metadataValue) return res.status(400).send({ status: "failed", message: "metadataValue is required" });
    if (!req.body.ownerCosignatoryPrivateKeyMultisig) return res.status(400).send({ status: "failed", message: "ownerCosignatoryPrivateKeyMultisig is required" });
    if (!req.body.ownerPublickeyMultisig) return res.status(400).send({ status: "failed", message: "ownerPublickeyMultisig is required" });
    if (!req.body.sendMessage) return res.status(400).send({ status: "failed", message: "sendMessage is required" });
    if (!metadataService.checkMetadataAscii(metadataKey) || !metadataService.checkMetadataAscii(metadataValue)){
        return res.status(400).send({ status: "failed", message: "metadataKey and metadataValue must be ascii valid text" });
    }
    
    try {
        const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();
        const creatorPublicAccount = PublicAccount.createFromPublicKey(adminAccountPublicKeyMultisig, Constants.NETWORK_IDENTIFIER);
        const writer = new Writer();
        writer.createStream(generator.makeLog("create mosaic with metadata sent to the multisig"));
        const adminAccountAddress = PublicAccount.createFromPublicKey(adminAccountPublicKeyMultisig, networkName).address.plain();
        const adminAccountBalance: number = await accountService.getUserBalanceForGivenMosaicId(
            adminAccountAddress,
            Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING
        )

        if(adminAccountBalance < Constants.MOSAIC_RENTAL_FEE)
        {
            writer.addERROR("adminAccountPublicKeyMultisig has insufficient balance to perform NFT creation from multisig actions");
            throw Error("adminAccountPublicKeyMultisig has insufficient balance to perform NFT creation from multisig actions")
        }
        const ownerAccountAddress = PublicAccount.createFromPublicKey(ownerPublickeyMultisig, networkName).address.plain();

        const ownerAccountBalance: number = await accountService.getUserBalanceForGivenMosaicId(
            ownerAccountAddress,
            Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING
        )

        if(ownerAccountBalance < Constants.MOSAIC_RENTAL_FEE  + Constants.MOSAIC_CREATION_FEE)
        {
            writer.addERROR("ownerPublickeyMultisig has insufficient balance to pay necessary fees for NFT creation");
            throw Error("ownerPublickeyMultisig has insufficient balance to pay necessary fees for NFT creation")
        }
        writer.addTASK("mosaicService.createMosaicWithoutNamespaceEscrow");
        const mosaicTransaction = await mosaicMultisigService.createMosaicWithoutNamespaceEscrow(
            adminAccountPublicKeyMultisig, adminCosignatoryPrivateKeyMultisig, 
            ownerCosignatoryPrivateKeyMultisig, ownerPublickeyMultisig, amount, divisibility,
            duration, writer, medianFeeMultiplier
        );
        await transactionService.waitForFinalizedTransaction(mosaicTransaction.hash, creatorPublicAccount.address, true, writer);

        writer.addTASK("transactionService.getConfirmedinfo");
        const confirmedInfo: any = await transactionService.getConfirmedTransactionInfo(mosaicTransaction.hash);
        const mosaicId: string = confirmedInfo.transaction.transactions[1].transaction.mosaicId;

        writer.addTASK("metadataService.assignMetadataToMosaic");
        const metadataTransaction: any = await metadataMultisigService.assignMetadataToMosaic(adminAccountPublicKeyMultisig, adminCosignatoryPrivateKeyMultisig, mosaicId, metadataKey, metadataValue, writer, medianFeeMultiplier);
        writer.addTASK("Metadata assignment status is: " + metadataTransaction.group);

        const ownerAddress = PublicAccount.createFromPublicKey(ownerPublickeyMultisig, networkName).address.plain();
        writer.addTASK("sendMosaic.sendMosaicToAddress");
        const sendTransaction: any = await transactionMultisigService.sendMultisigTransactionMosaic(adminAccountPublicKeyMultisig, adminCosignatoryPrivateKeyMultisig, ownerAddress, amount, mosaicId, writer, medianFeeMultiplier, sendMessage);

        res.json({
            "mosaicId": mosaicId,
            "metadataKey": metadataKey,
            "metadataKeyHex": (KeyGenerator.generateUInt64Key(metadataKey)).toHex(),
            "metadataValue": metadataValue,
            "mosaicCreationHash": mosaicTransaction.hash,
            "metadataAttachmentHash": metadataTransaction.hash,
            "sendMosaicTransactionHash": sendTransaction.hash
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
 * /nft/updateMetadata:
 *   put:
 *     summary: Updates mosaic metadata.
 *     description: |
 *       Updates mosaic metadata.
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
 *                 description: Multisig Account which has created the mosaic public key.
 *                 example: 134D647E17E0F57F7F8158D0B7818A833DEDAC995753B01DD345DDD4B40CAD32
 *               adminCosignatoryPrivateKeyMultisig:
 *                 type: string
 *                 description: Multisig account cosignatory which has created the mosaic private key.
 *                 example: B250B56A0F3D7C3ECC14ED85EBE9D2E366DBC725F2DE28120123898429D901DB
 *               mosaicId:
 *                 type: string
 *                 description: Mosaic ID.
 *                 example: 7168B64E5D49C698
 *               metadataKey:
 *                 type: string
 *                 description: Metadata key to be updated.
 *                 example: key1
 *               newMetadataValue:
 *                 type: string
 *                 description: New value for the specified metadata entry.
 *                 example: value2
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mosaicId:
 *                   type: string
 *                   description: Mosaic ID.
 *                   example: 2BE68A6BC9E43079
 *                 metadataKey:
 *                   type: string
 *                   description: Metadata key.
 *                   example: key1
 *                 metadataValue:
 *                   type: string
 *                   description: Metadata value.
 *                   example: value2
 *                 transactionHash:
 *                   type: string
 *                   description: Metadata transaction hash.
 *                   example: 110C508F1462967EAC8A69CB71733B99189D1D1B883B4F80BA95FA2AD5E6E625
 *                 transactionStatus:
 *                   type: string
 *                   description: Transaction status.
 *                   example: success
 *                 transactionGroup:
 *                   type: string
 *                   description: Transaction group.
 *                   example: confirmed
 */
router.put("/updateMetadata", async (req: Request, res: Response) => {
    const mosaicId = req.body.mosaicId;
    const metadataKey = req.body.metadataKey;
    const newMetadataValue = req.body.newMetadataValue;
    const adminAccountPublicKeyMultisig = req.body.adminAccountPublicKeyMultisig;
    const adminCosignatoryPrivateKeyMultisig = req.body.adminCosignatoryPrivateKeyMultisig;
    const length = Object.keys(req.body).length

    if (length !== 5) return res.status(400).send({ status: 'failed', message: 'too many or too little parameters' });
    if (!req.body.mosaicId) return res.status(400).send({ status: 'failed', message: 'mosaicId is required' });
    if (!req.body.metadataKey) return res.status(400).send({ status: 'failed', message: 'metadataKey is required' });
    if (!req.body.newMetadataValue) return res.status(400).send({ status: 'failed', message: 'newMetadataValue is required' });


    try {
        const writer = new Writer();
        writer.createStream(generator.makeLog("AssignMetadata"));

        writer.addTASK("metadataService.updateMetadataToMosaic");
        const updateMetaTransaction: any = await metadataMultisigService.updateMetadataToMosaic(adminAccountPublicKeyMultisig, adminCosignatoryPrivateKeyMultisig, mosaicId, metadataKey, newMetadataValue, writer);

        writer.addTASK("Metadata assignment status is: " + updateMetaTransaction.group);
        if(updateMetaTransaction.cosignHash == null)
        {
            return res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + ' Mosaic is not created by given private key owner'
            })

        }
        const creatorPublicAccount = PublicAccount.createFromPublicKey(adminAccountPublicKeyMultisig, Constants.NETWORK_IDENTIFIER);

        const transactionStatus: any = await transactionService.waitForConfirmedTransaction(updateMetaTransaction.cosignHash, creatorPublicAccount.address, false, writer);

        res.json({
            "eventId": mosaicId,
            "metadataKey": metadataKey,
            "metadataKeyHex": (KeyGenerator.generateUInt64Key(metadataKey)).toHex(),
            "metadataValue": newMetadataValue,
            "transactionHash": updateMetaTransaction.cosignHash,
            "transactionStatus": transactionStatus.status,
            "transactionGroup": transactionStatus.group
        });
        
    } 
    catch (error) {
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        })
    }
    
});

/**
 * @swagger
 * /nft/getInfo/{mosaicId}:
 *   get:
 *     summary: Gets info of NFT (mosaic).
 *     description: |
 *       Gets info of NFT (mosaic).
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: mosaicId
 *         required: true
 *         example: 75663A21CF28FF6A
 *         description: Mosaic ID
 *         schema:
 *           type: string
 *           description: Mosaic ID
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Object of mosaic detailed information
 *               example: {"version": 1, "recordId": "623B33FC950247371317C288", "id": { "id": { "lower": 3475570538, "higher": 1969633825 } }, "supply": { "lower": 1000, "higher": 0 }, "startHeight": { "lower": 253517, "higher": 0 }, "ownerAddress": { "address": "TDD4BQRS7AZ77NLB6ONBGFH5PUPSSEQNVF5DV7Q", "networkType": 152 }, "revision": 1, "flags": { "supplyMutable": true, "transferable": true, "restrictable": true, "revokable": false }, "divisibility": 0, "duration": { "lower": 0, "higher": 0 }}
 */
router.get("/getInfo/:mosaicId", async (req: Request, res: Response) => {
    const mosaicId = req.params.mosaicId;

    if (!req.params.mosaicId) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicId is required"
        });
    }

    try {
        const mosaicInfo = await mosaicService.getMosaicInfo(mosaicId);
        res.json(mosaicInfo);
    } 
    catch (error) {
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        });
    }
    
});


/**
 * @swagger
 * /nft/getMetadata/{mosaicId}:
 *   get:
 *     summary: Retrieves all assigned metadata for a given NFT (mosaic).
 *     description: |
 *       Retrieves all assigned metadata for a given NFT (mosaic).
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: mosaicId
 *         required: true
 *         schema:
 *           type: string
 *           description: Mosaic ID.
 *           example: 2BE68A6BC9E43079
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: Array of metadata objects
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                     description: Metadata key.
 *                     example: AACFBE3CC93EABF3
 *                   value:
 *                     type: string
 *                     description: Metadata value.
 *                     example: started1
 */
router.get("/getMetadata/:mosaicId", async (req: Request, res: Response) => {
    const mosaicId = req.params.mosaicId;

    if (!req.params.mosaicId) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicId is required"
        });
    }

    try {
        const metadataInfo = await metadataService.getMetadataMosaic(mosaicId);
        res.json(metadataInfo);
    } 
    catch (error) {
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        });
    }
    
});


/**
 * @swagger
 * /nft/getTransactions/{mosaicId}:
 *   get:
 *     summary: Get transactions for a given mosaic ID.
 *     description: |
 *       Get past 100 transactions for a given mosaic ID.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: mosaicId
 *         required: true
 *         schema:
 *           type: string
 *           description: Mosaic ID.
 *           example: 7168B64E5D49C698
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: Array of transaction objects
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: integer
 *                     description: Transaction type.
 *                     example: 16724
 *                   recipientAddress:
 *                     type: object
 *                     properties:
 *                       address:
 *                         type: string
 *                         description: Address of the recipient
 *                         example: TB5GXZFMAGZ2L3BURIOHHPKTL6SX65BA7VXGLPI
 *                       networkType:
 *                         type: integer
 *                         description: Type of the network (Mainnet, testnet)
 *                         example: 152
 *                   mosaics:
 *                     type: array
 *                     description: Array of transferred mosaics
 *                     items:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: int
 *                           description: Amount of mosaic (absolute units)
 *                           example: 4
 *                         id:
 *                           type: string
 *                           description: Id of the mosaic
 *                           example: 7168B64E5D49C698
 *                   signerPublicKey:
 *                     type: string
 *                     description: Signer public key of the transaction
 *                     example: 2671D1C01036DE67D06726FF804905731F03EBEC1DE70ADE918F032957B57442
 *                   transferId:
 *                     type: string
 *                     description: Transfer id of the transaction
 *                     example: 6304BE377D1D93630164C9DB                    
 *                   aggregateId:
 *                     type: string
 *                     description: Aggregate id of the aggregated transaction (transaction is part of aggregate)
 *                     example: 6304BE377D1D93630164C9D9
 *                   aggregateHash:
 *                     type: string
 *                     description: Hash of the aggregated transaction (transaction is part of aggregate)
 *                     example: 4438E0FDD0CA346C8800B05CAA809D0E55909E800612D5587D2DFF95012C177F   
 *             
 */
router.get("/getTransactions/:mosaicId", async (req: Request, res: Response) => {
    const mosaicId = req.params.mosaicId;
  
    if (!req.params.mosaicId) {
      return res.status(400).send({
        status: 'failed',
        message: 'mosaicId is required',
      });
    }

    try {
        let result: Transaction[] = await mosaicService.getTransactionsByMosaicId(mosaicId);
        //Type, recipient address, mosaics, transferID, aggregateID, aggregateHash, signerPublicKey
        const parsedTransactions: any = [];
        result = result.slice(1);
        result.forEach(element => {
            const info = <AggregateTransactionInfo>element.transactionInfo;
            const transactionInfo = {
                type: element.type, 
                recipientAddress: element.toJSON().transaction.recipientAddress,
                mosaics: element.toJSON().transaction.mosaics,
                signerPublicKey: element.signer.publicKey,
                transferId: element.transactionInfo.id,
                aggregateId: info.aggregateId,
                aggregateHash: info.aggregateHash,
            };

            parsedTransactions.push(transactionInfo);
        });
        res.json(parsedTransactions);
    } 
    catch (error) {
        res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + error.message
        });
    }
  });


export default router;