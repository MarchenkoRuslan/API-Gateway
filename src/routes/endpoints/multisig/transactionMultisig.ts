import express = require("express");
import { Request, Response } from "express";
import { transactionMultisigService } from "../../../services/symbol-sdk/multisig/transactionMultisigService";
import { generator } from '../../../helpers/generator';
import { Writer } from '../../../helpers/writer';
import { blockchainService } from "../../../services/symbol-sdk/blockchainService";


const router = express.Router();

/**
 * Endpoint: send multisig transaction
 */
router.put("/send", (req: Request, res: Response) => {
  const multisigPublicKey = req.body.multisigPublicKey;
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const amount = req.body.amount;
  const namespaceName = req.body.namespaceName;
  const length = Object.keys(req.body).length


  if (!req.body.multisigPublicKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPublicKey is required',
    });
  }
  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: 'failed',
      message: 'recipientAddress is required',
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: 'failed',
      message: 'amount is required',
    });
  }
  if (!req.body.namespaceName) {
    return res.status(400).send({
      status: 'failed',
      message: 'namespaceName is required',
    });
  }
  else if (length !== 5) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("transactionMultisigService.sendMultisigTransaction");
  transactionMultisigService.sendMultisigTransaction(multisigPublicKey, cosignatoryPrivateKey, recipientAddress,
    amount, namespaceName.toLowerCase(), writer)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});

/**
 * Endpoint: send multisig transaction by mosaicID
 */
router.put("/sendMosaic", async (req: Request, res: Response) => {
  const multisigPublicKey = req.body.multisigPublicKey;
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const amount = req.body.amount;
  const mosaicId = req.body.mosaicId;
  const length = Object.keys(req.body).length


  if (!req.body.multisigPublicKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPublicKey is required',
    });
  }
  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: 'failed',
      message: 'recipientAddress is required',
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: 'failed',
      message: 'amount is required',
    });
  }
  if (!req.body.mosaicId) {
    return res.status(400).send({
      status: 'failed',
      message: 'mosaicId is required',
    });
  }
  else if (length !== 5) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());
  const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();

  writer.addTASK("transactionMultisigService.sendMultisigTransactionByMosaic");
  transactionMultisigService.sendMultisigTransactionMosaic(multisigPublicKey, cosignatoryPrivateKey, recipientAddress,
    amount, mosaicId, writer, medianFeeMultiplier)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});

/**
 * Endpoint: send multisig transaction by mosaicID and namespace name
 */
router.put("/sendMosaicAlias", (req: Request, res: Response) => {
  const multisigPublicKey = req.body.multisigPublicKey;
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const recipientAddressNamespace = req.body.recipientAddressNamespace;
  const amount = req.body.amount;
  const mosaicId = req.body.mosaicId;
  const message = req.body.message;
  const length = Object.keys(req.body).length


  if (!req.body.multisigPublicKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPublicKey is required',
    });
  }
  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.recipientAddressNamespace) {
    return res.status(400).send({
      status: 'failed',
      message: 'recipientAddressNamespace is required',
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: 'failed',
      message: 'amount is required',
    });
  }
  if (!req.body.mosaicId) {
    return res.status(400).send({
      status: 'failed',
      message: 'mosaicId is required',
    });
  }
  if (!req.body.message) {
    return res.status(400).send({
      status: 'failed',
      message: 'message is required',
    });
  }
  else if (length !== 6) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("transactionMultisigService.sendMultisigTransactionByMosaic");
  transactionMultisigService.sendMultisigTransactionMosaicAlias(
    multisigPublicKey,
    cosignatoryPrivateKey,
    recipientAddressNamespace.toLowerCase(),
    amount,
    mosaicId,
    JSON.stringify(message),
    writer
  )
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});

/**
 * Endpoint: coSign transaction
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
      message: 'too much parameters',
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

/**
 * Endpoint: send multisig transaction aggregate complete
 */
router.put("/receiveFromMultiple", (req: Request, res: Response) => {
  const multisigPublicKeysList = req.body.multisigPublicKeysList;
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const amount = req.body.amount;
  const namespaceName = req.body.namespaceName;
  const length = Object.keys(req.body).length


  if (!req.body.multisigPublicKeysList) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPublicKeysList is required',
    });
  }
  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: 'failed',
      message: 'recipientAddress is required',
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: 'failed',
      message: 'amount is required',
    });
  }
  if (!req.body.namespaceName) {
    return res.status(400).send({
      status: 'failed',
      message: 'namespaceName is required',
    });
  }
  else if (length !== 5) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("transactionMultisigService.receiveTransactionsFromMultiple");
  transactionMultisigService.receiveTransactionsFromMultiple(multisigPublicKeysList, cosignatoryPrivateKey, recipientAddress,
    amount, namespaceName.toLowerCase(), writer)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});

/**
 * Endpoint: transfer transaction to multiple recipients with multisig
 */
router.put("/sendToMultiple", (req: Request, res: Response) => {

  const multisigPublicKey = req.body.multisigPublicKey;
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const recipientsList = req.body.recipientsList;
  const amount = req.body.amount;
  const namespaceName = req.body.namespaceName;
  const length = Object.keys(req.body).length

  if (!req.body.multisigPublicKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPublicKey is required',
    });
  }
  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.recipientsList) {
    return res.status(400).send({
      status: 'failed',
      message: 'recipientsList is required',
    });
  }
  if (!req.body.namespaceName) {
    return res.status(400).send({
      status: 'failed',
      message: 'namespaceName is required',
    });
  }
  if (!req.body.amount) {
    return res.status(400).send({
      status: 'failed',
      message: 'amount is required',
    });
  }
  else if (length !== 5) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    });
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("transactionMultisigService.sendTransactionToMultiple");
  transactionMultisigService.sendTransactionToMultiple(multisigPublicKey, cosignatoryPrivateKey, recipientsList, amount, namespaceName.toLowerCase(), writer)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});

/**
 * Endpoint: transfer transaction with multiple mosaics with multisig
 */
router.put("/sendMultiple", (req: Request, res: Response) => {

  const multisigPublicKey = req.body.multisigPublicKey;
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const recipientAddress = req.body.recipientAddress;
  const namespaceList = req.body.namespaceList;
  const length = Object.keys(req.body).length

  if (!req.body.multisigPublicKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPublicKey is required',
    });
  }
  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.recipientAddress) {
    return res.status(400).send({
      status: 'failed',
      message: 'recipientAddress is required',
    });
  }
  if (!req.body.namespaceList) {
    return res.status(400).send({
      status: 'failed',
      message: 'namespaceList is required',
    });
  }
  if (length !== 4) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    });
  }
  else if (Object.keys(req.body.namespaceList).length > 5) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much mosaics (max 5)',
    });
  }
  for (let id = 0; id < Object.keys(req.body.namespaceList).length; id++) {
    if (!req.body.namespaceList[id].namespaceName) {
      return res.status(400).send({
        status: 'failed',
        message: 'namespaceList : namespaceName is required',
      });
    }
    if (!req.body.namespaceList[id].amount) {
      return res.status(400).send({
        status: 'failed',
        message: 'namespaceList: amount is required',
      });
    }
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("transactionMultisigService.sendMultipleTransaction");
  transactionMultisigService.sendMultipleTransaction(multisigPublicKey, cosignatoryPrivateKey, recipientAddress, namespaceList, writer)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});

/**
 * Endpoint: transfer transactions with multiple mosaics to multiple recipients with multisig
 */
router.put("/sendMultipleToMultiple", (req: Request, res: Response) => {

  const multisigPublicKey = req.body.multisigPublicKey;
  const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
  const recipientsList = req.body.recipientsList;
  const namespaceList = req.body.namespaceList;
  const length = Object.keys(req.body).length

  if (!req.body.multisigPublicKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPublicKey is required',
    });
  }
  if (!req.body.cosignatoryPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoryPrivateKey is required',
    });
  }
  if (!req.body.recipientsList) {
    return res.status(400).send({
      status: 'failed',
      message: 'recipientsList is required',
    });
  }
  if (!req.body.namespaceList) {
    return res.status(400).send({
      status: 'failed',
      message: 'namespaceList is required',
    });
  }
  if (length !== 4) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    });
  }
  else if (Object.keys(req.body.namespaceList).length > 5) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much mosaics (max 5)',
    });
  }
  for (let id = 0; id < Object.keys(req.body.namespaceList).length; id++) {
    if (!req.body.namespaceList[id].namespaceName) {
      return res.status(400).send({
        status: 'failed',
        message: 'namespaceList : namespaceName is required',
      });
    }
    if (!req.body.namespaceList[id].amount) {
      return res.status(400).send({
        status: 'failed',
        message: 'namespaceList: amount is required',
      });
    }
  }

  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("transactionMultisigService.sendMultipleTransactionToMultiple");
  transactionMultisigService.sendMultipleTransactionToMultiple(multisigPublicKey, cosignatoryPrivateKey, recipientsList, namespaceList, writer)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});

export default router;