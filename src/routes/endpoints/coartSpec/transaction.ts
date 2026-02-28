import express = require("express");
import { Request, Response } from "express";
import { transactionService } from "../../../services/symbol-sdk/transactionService";
import { generator } from "../../../helpers/generator";
import { Writer } from "../../../helpers/writer";
import { Constants } from "../../../helpers/constants";
import {transactionMultisigService} from "../../../services/symbol-sdk/multisig/transactionMultisigService";
import { Account, AggregateTransaction, Transaction, TransactionType } from "symbol-sdk";
import { encryptObject, decryptObject } from "../../../../utils/cryptoUtils";

const router = express.Router();

type SendInput = {
  senderPrivateKey: string,
  recipientAddress: string,
  amount: number,
  namespaceName: string,
  message: string,
};

/**
 * @swagger
 * /transaction/send:
 *   put:
 *     summary: Transfer transaction (debug).
 *     description: |
 *       Send a transfer transaction of the specified mosaic.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderPrivateKey:
 *                 type: string
 *                 description: Private key of the sender account.
 *                 example: 5C0EC86EC32C493637830B2E77CFE8189B9A155002AACDD19050EA978D1B7681
 *               recipientAddress:
 *                 type: string
 *                 description: Account address of the recipient.
 *                 example: TD7JAQGZCS6LPIK5CO6GMYZUCDIGUYEZLWPYV7Y
 *               amount:
 *                 type: number
 *                 description: Amount of mosaic to send.
 *                 example: 30
 *               namespaceName:
 *                 type: string
 *                 description: Mosaic namespace name.
 *                 example: cat.currency
 *               message:
 *                 type: string
 *                 description: Message to attach.
 *                 example: "Sending tokens"
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
 *                   description: transaction hash
 *                   example: D6355954825757DF3543796DC079B0BBD80F7D3434F0E89586C0D07F72273B7F
 *                 message:
 *                   type: string
 *                   description: transaction pushed to blockchain message
 *                   example: packet 9 was pushed to the network via /transactions
 */
router.put("/send", async (req: Request, res: Response) => {
  const senderPrivateKey = req.body.senderPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const amount = req.body.amount;
  const namespaceName = req.body.namespaceName;
  const message = req.body.message;
  const length = Object.keys(req.body).length;

  if (!req.body.senderPrivateKey) {
    return res.status(400).send({
      status: "failed",
      message: "senderPrivateKey is required"
    });
  }
  if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: "failed",
      message: "recipientAddress is required"
    });
  }
  if (!req.body.namespaceName) {
    return res.status(400).send({
      status: "failed",
      message: "namespaceName is required"
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: "failed",
      message: "amount is required"
    });
  }
  if (!req.body.message) {
    return res.status(400).send({
      status: "failed",
      message: "message is required"
    });
  } else if (length !== 5) {
    return res.status(400).send({
      status: "failed",
      message: "too many or too little parameters"
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog("send"));

  try {
    writer.addTASK("transactionService.sendTransaction");
    const transaction = await transactionService
        .sendTransaction(
            senderPrivateKey,
            recipientAddress,
            amount,
            namespaceName.toLowerCase(),
            message,
            writer
        );

    const senderAccount = Account.createFromPrivateKey(senderPrivateKey, Constants.NETWORK_IDENTIFIER);

    const confirmedTransaction = await transactionService.waitForConfirmedTransaction(
        transaction.hash,
        senderAccount.address,
        false,
        writer
    );

    res.json(confirmedTransaction);
  }
  catch(err){
    res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    });
  }
});

/**
 * @swagger
 * /transaction/demo/encrypt:
 *   put:
 *     summary: Encrypt's an object (debug).
 *     description: |
 *       Encrypts a given object to be used for /sendEncrypted endpoint. Encryption parameters: ENCRYPTION_KEY - from .env, ALGORITHM - aes-256-gcm, initialization vector (IV) length - 12, input encoding - utf-8, output format - hexadecimal string, with parts concatenated and separated by ":" (order - iv -> tag -> encrypted data) (e.g. `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}` 
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderPrivateKey:
 *                 type: string
 *                 description: Private key of the sender account.
 *                 example: 5C0EC86EC32C493637830B2E77CFE8189B9A155002AACDD19050EA978D1B7681
 *               recipientAddress:
 *                 type: string
 *                 description: Account address of the recipient.
 *                 example: TD7JAQGZCS6LPIK5CO6GMYZUCDIGUYEZLWPYV7Y
 *               amount:
 *                 type: string
 *                 description: Amount of mosaic to send.
 *                 example: 30
 *               namespaceName:
 *                 type: string
 *                 description: Mosaic namespace name.
 *                 example: cat.currency
 *               message:
 *                 type: string
 *                 description: Message to attach.
 *                 example: "Sending tokens"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: encrypted object (token)
 *                   example: 09186ae68118ba5682e12a63:616cf44275ae101d5510d550b18d9d97:4c70aab593c49638c6ef4cea1de9a078c8fd1b081dbc580dba9b03497b82bd28cbbd3616aa3bb9115dabb78516ba622d67ba684ee8f8f7bbc2a93d2b2b2fac5b2f78cba62f25e193d1d8f9f2b5eebe51b15a25430472df72c39aa375a1c1f4d283baf9c42a0a7b7a2db183c0dd21df28be93658d59b284e93fc75591ae9ee1a1d0852461fe1dcad473eb24cb0c382f581e0484087f2b033051a1f4f63b9fc7e65ca7ee30e4434744a767831e5e533c069966c8092e18153213ead5c9b1b2fdbd077ce74a98cd1ec339cf91199940ba6d926111c72548f4a2f58f31a7bb0e0c
 */
router.put("/demo/encrypt", (req: Request, res: Response) => {
  const senderPrivateKey = req.body.senderPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const amount = req.body.amount;
  const namespaceName = req.body.namespaceName;
  const message = req.body.message;
  const length = Object.keys(req.body).length;

  if (!req.body.senderPrivateKey) {
    return res.status(400).send({
      status: "failed",
      message: "senderPrivateKey is required"
    });
  }
  else if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: "failed",
      message: "recipientAddress is required"
    });
  }
  else if (!req.body.namespaceName) {
    return res.status(400).send({
      status: "failed",
      message: "namespaceName is required"
    });
  }
  else if (!req.body.amount) {
    return res.status(400).send({
      status: "failed",
      message: "amount is required"
    });
  }
  else if (!req.body.message) {
    return res.status(400).send({
      status: "failed",
      message: "message is required"
    });
  } 
  else if (length !== 5) {
    return res.status(400).send({
      status: "failed",
      message: "too much parameters"
    });
  }
 
  try {
    const inputObj: SendInput = {
      senderPrivateKey,
      recipientAddress,
      namespaceName,
      amount,
      message
    }; 
    const encryptedToken: string = encryptObject(inputObj); 
    res.json({token: encryptedToken}) 
  } catch (err) {
    res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    })
  } 
});


/**
 * @swagger
 * /transaction/sendEncrypted:
 *   put:
 *     summary: Transfer transaction (debug).
 *     description: |
 *       Send a transfer transaction of the specified mosaic. Inputs are encrypted
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Private key of the sender account.
 *                 example: 09186ae68118ba5682e12a63:616cf44275ae101d5510d550b18d9d97:4c70aab593c49638c6ef4cea1de9a078c8fd1b081dbc580dba9b03497b82bd28cbbd3616aa3bb9115dabb78516ba622d67ba684ee8f8f7bbc2a93d2b2b2fac5b2f78cba62f25e193d1d8f9f2b5eebe51b15a25430472df72c39aa375a1c1f4d283baf9c42a0a7b7a2db183c0dd21df28be93658d59b284e93fc75591ae9ee1a1d0852461fe1dcad473eb24cb0c382f581e0484087f2b033051a1f4f63b9fc7e65ca7ee30e4434744a767831e5e533c069966c8092e18153213ead5c9b1b2fdbd077ce74a98cd1ec339cf91199940ba6d926111c72548f4a2f58f31a7bb0e0c
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
 *                   description: transaction hash
 *                   example: D6355954825757DF3543796DC079B0BBD80F7D3434F0E89586C0D07F72273B7F
 *                 message:
 *                   type: string
 *                   description: transaction pushed to blockchain message
 *                   example: packet 9 was pushed to the network via /transactions
 */
router.put("/sendEncrypted", (req: Request, res: Response) => {
  const encryptedToken = req.body.token;      
  const length = Object.keys(req.body).length;

  if (!encryptedToken) {
    return res.status(400).send({
      status: "failed",
      message: "token is required"
    });
  } else if (length !== 1) {
    return res.status(400).send({
      status: "failed",
      message: length > 1 ? "too much parameter(s)" : "missing parameter(s)"
    });
  }

  const decryptedObject = JSON.parse(decryptObject(encryptedToken)) as SendInput;
  const writer = new Writer();
  writer.createStream(generator.makeLog("send"));

  writer.addTASK("transactionService.sendTransaction");
  transactionService
    .sendTransaction(
      decryptedObject.senderPrivateKey,
      decryptedObject.recipientAddress,
      decryptedObject.amount,
      decryptedObject.namespaceName.toLowerCase(),
      decryptedObject.message,
      writer
    )
    .then(result => res.json(result))
    .catch(err =>
      res.status(400).send({
        status: "failed",
        error: `An Unexpected Error Occurred: ` + err.message
      })
    );
});


/**
 * @swagger
 * /transaction/sendMosaic:
 *   put:
 *     summary: Transfer transaction by ID (debug).
 *     description: |
 *       Send a mosaic transfer transaction specifying the mosaic ID instead of its namespace name.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderPrivateKey:
 *                 type: string
 *                 description: Private key of the sender account.
 *                 example: 5C0EC86EC32C493637830B2E77CFE8189B9A155002AACDD19050EA978D1B7681
 *               recipientAddress:
 *                 type: string
 *                 description: Account address of the recipient.
 *                 example: TC7I7E7O325KSJJZS4PMJ6EIHZFEFWWCHHLPJCQ
 *               amount:
 *                 type: number
 *                 description: Amount of mosaic to send.
 *                 example: 40
 *               mosaicId:
 *                 type: string
 *                 description: Mosaic ID.
 *                 example: 326B5549E9FC8F15
 *               message:
 *                 type: string
 *                 description: Message to attach.
 *                 example: "event start"
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
 *                   description: transaction hash
 *                   example: D6355954825757DF3543796DC079B0BBD80F7D3434F0E89586C0D07F72273B7F
 *                 message:
 *                   type: string
 *                   description: transaction pushed to blockchain message
 *                   example: packet 9 was pushed to the network via /transactions
 */
router.put("/sendMosaic", (req: Request, res: Response) => {
  const senderPrivateKey = req.body.senderPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const amount = req.body.amount;
  const mosaicId = req.body.mosaicId;
  const message = req.body.message;
  const length = Object.keys(req.body).length;

  if (!req.body.senderPrivateKey) {
    return res.status(400).send({
      status: "failed",
      message: "senderPrivateKey is required"
    });
  }
  if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: "failed",
      message: "recipientAddress is required"
    });
  }
  if (!req.body.mosaicId) {
    return res.status(400).send({
      status: "failed",
      message: "mosaicId is required"
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: "failed",
      message: "amount is required"
    });
  }
  if (!req.body.message) {
    return res.status(400).send({
      status: "failed",
      message: "message is required"
    });
  } else if (length !== 5) {
    return res.status(400).send({
      status: "failed",
      message: "too many or too little parameters"
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog("send"));

  writer.addTASK("transactionService.sendTransactionMosaic");
  transactionService
    .sendTransactionMosaic(
      senderPrivateKey,
      recipientAddress,
      amount,
      mosaicId,
      message,
      writer
    )
    .then(result => res.json(result))
    .catch(err =>
      res.status(400).send({
        status: "failed",
        error: `An Unexpected Error Occurred: ` + err.message
      })
    );
});


/**
 * @swagger
 * /transaction/sendJSON:
 *   put:
 *     summary: Transfer transaction (debug).
 *     description: |
 *       Send a transfer transaction of the specified mosaic.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderPrivateKey:
 *                 type: string
 *                 description: Private key of the sender account.
 *                 example: 5C0EC86EC32C493637830B2E77CFE8189B9A155002AACDD19050EA978D1B7681
 *               recipientAddress:
 *                 type: string
 *                 description: Account address of the recipient.
 *                 example: TD7JAQGZCS6LPIK5CO6GMYZUCDIGUYEZLWPYV7Y
 *               amount:
 *                 type: number
 *                 description: Amount of mosaic to send.
 *                 example: 30
 *               namespaceName:
 *                 type: string
 *                 description: Mosaic namespace name.
 *                 example: cat.currency
 *               message:
 *                 type: object
 *                 description: Message in JSON to attach.
 *                 example: {"sender": {"companyName": "SomeName","companyAddress": "TDEEW57VUGI6GDDLYYRZXOXK4XFAAT23UMQ573Q"},"receiver": {"companyName": "AnotherName","companyAddress": "TD52CVYBERXNGUOFGWPY24KNG2XOJTD7MXU2PII"}}
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
 *                   description: transaction hash
 *                   example: D6355954825757DF3543796DC079B0BBD80F7D3434F0E89586C0D07F72273B7F
 *                 message:
 *                   type: string
 *                   description: transaction pushed to blockchain message
 *                   example: packet 9 was pushed to the network via /transactions
 */
router.put("/sendJSON", (req: Request, res: Response) => {
  const senderPrivateKey = req.body.senderPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const amount = req.body.amount;
  const namespaceName = req.body.namespaceName;
  const message = req.body.message;
  const length = Object.keys(req.body).length;

  if (!req.body.senderPrivateKey) {
    return res.status(400).send({
      status: "failed",
      message: "senderPrivateKey is required"
    });
  }
  if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: "failed",
      message: "recipientAddress is required"
    });
  }
  if (!req.body.namespaceName) {
    return res.status(400).send({
      status: "failed",
      message: "namespaceName is required"
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: "failed",
      message: "amount is required"
    });
  }
  if (!req.body.message) {
    return res.status(400).send({
      status: "failed",
      message: "message is required"
    });
  } else if (length !== 5) {
    return res.status(400).send({
      status: "failed",
      message: "too many or too little parameters"
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog("send"));

  writer.addTASK("transactionService.sendTransactionJSON");
  transactionService
    .sendTransactionJSON(
      senderPrivateKey,
      recipientAddress,
      amount,
      namespaceName.toLowerCase(),
      JSON.stringify(message),
      writer
    )
    .then(result => res.json(result))
    .catch(err =>
      res.status(400).send({
        status: "failed",
        error: `An Unexpected Error Occurred: ` + err.message
      })
    );
});


/**
 * @swagger
 * /transaction/getStatus/{transactionHash}:
 *   get:
 *     summary: Get transaction status (debug).
 *     description: |
 *       Get the status of the transaction with a specified hash.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *           description: Transaction hash.
 *           example: DED2B90907812338F60649205118E4B891151607836D94E6766612963355B52D
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: transaction status, group, hash, blockchain block number, safety level and additional information
 *               example: {"group": "confirmed","code": "Success","hash": "DED2B90907812338F60649205118E4B891151607836D94E6766612963355B52D","deadline": "3894214781","height": "145258","transactionSafety": "LOW","blockConfirmationsSinceAnnouncing": "1"}
 */
router.get("/getStatus/:transactionHash", async (req: Request, res: Response) => {
  const transactionHash = req.params.transactionHash;


  if (!req.params.transactionHash) {
    return res.status(400).send({
      status: "failed",
      message: "transactionHash is required"
    });
  }

  try {
    const transactionStatus = await transactionService.getTransactionStatus(transactionHash);
    res.json(transactionStatus);
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
 * /transaction/getConfirmedInfo/{transactionHash}:
 *   get:
 *     summary: Get confirmed transaction info (debug).
 *     description: |
 *       Get information of a confirmed transaction with a specified hash.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *           description: Transaction hash.
 *           example: DED2B90907812338F60649205118E4B891151607836D94E6766612963355B52D
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: detailed transaction information. Response content depends on the transaction type.
 *               example: {"meta": {"height": "119632","hash": "A1848B7438EA6B333203B49A5553F9F7970F64C59ED0B008A2481A6E7A9D11C8","merkleComponentHash": "A1848B7438EA6B333203B49A5553F9F7970F64C59ED0B008A2481A6E7A9D11C8","index": 0},"transaction": {"size": 184,"signature": "872163CCA4E4F80001F6199213B2FD00BF919ADE85AA0CADA5FAA9DE37F0A0CE822F07F45CD2873EA930D955B6C732FD12A9F1C0F60503D5C13FEDA49D240503","signerPublicKey": "DD3BDC1BB8ECDB2BD0A8EC391B9154F1237B9D758AD3D332041CC77C0705B552","version": 1,"network": 152,"type": 16712,"maxFee": "0","deadline": "3637693637","duration": "480","mosaicId": "21BF87A49B786037","amount": "0","hash": "F76164CBCA86A934C0D1D60D24385666DB25281BB8B71693B977DE77A8AE06B6"},"id": "6197720C3854262F4A53FA10"}
 */
 router.get("/getConfirmedInfo/:transactionHash", async (req: Request, res: Response) => {
  const transactionHash = req.params.transactionHash;

  if (!req.params.transactionHash) {
    return res.status(400).send({
      status: "failed",
      message: "transactionHash is required"
    });
  }

  await transactionService
    .getConfirmedTransactionInfo(transactionHash)
    .then(result => res.json(result))
    .catch(err =>
      res.status(400).send({
        status: "failed",
        error: `An Unexpected Error Occurred: ` + err.message
      })
    );
});


/**
 * @swagger
 * /transaction/coSign:
 *   put:
 *     summary: Cosign a transaction (debug).
 *     description: |
 *       Cosign a multisig transaction.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cosignatoryPrivateKey:
 *                 type: string
 *                 description: Private key of the signer account.
 *                 example: B9785E4AF19D7CE5D54790117A4A9C2CA7D0ECB15C24BA6802464B3240413912
 *               transactionHash:
 *                 type: string
 *                 description: Transaction hash.
 *                 example: BD691B4065219CD14427B5D9FA8ADA0977F5D38226DB576564390293AD005DB3
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: transaction pushed to blockchain message
 *                   example: packet 257 was pushed to the network via /transactions/cosignature
 */
router.put("/coSign", (req: Request, res: Response) => {
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const transactionHash = req.body.transactionHash;
  const length = Object.keys(req.body).length

  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.transactionHash) {
    return res.status(400).send({
      status: 'failed',
      message: 'transactionHash is required',
    });
  }
  else if (length !== 2) {
    return res.status(400).send({
      status: 'failed',
      message: 'too many or too little parameters',
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("transactionMultisigService.coSignTransaction");
  transactionMultisigService.coSignTransaction(cosignatoryPrivateKey, transactionHash, writer)
      .then((result) => res.json(result))
      .catch((err) => res.status(400).send({
        status: "failed",
        error: `An Unexpected Error Occurred: ` + err.message
      }));
});

export default router;
