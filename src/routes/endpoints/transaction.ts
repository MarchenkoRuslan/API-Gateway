// import express = require("express");
// import { Request, Response } from "express";
// import { transactionService } from "../../services/symbol-sdk/transactionService";
// import { generator } from "../../helpers/generator";
// import { Writer } from "../../helpers/writer";

// const router = express.Router();

// /**
//  * Endpoint: transfer transaction
//  */
// router.put("/send", (req: Request, res: Response) => {
//   const senderPrivateKey = req.body.senderPrivateKey;
//   const recipientAddress = req.body.recipientAddress;
//   const amount = req.body.amount;
//   const namespaceName = req.body.namespaceName;
//   const message = req.body.message;
//   const length = Object.keys(req.body).length;

//   if (!req.body.senderPrivateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "senderPrivateKey is required"
//     });
//   }
//   if (!req.body.recipientAddress) {
//     return res.status(400).send({
//       status: "failed",
//       message: "recipientAddress is required"
//     });
//   }
//   if (!req.body.namespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceName is required"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (!req.body.message) {
//     return res.status(400).send({
//       status: "failed",
//       message: "message is required"
//     });
//   } else if (length !== 5) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("send"));

//   writer.addTASK("transactionService.sendTransaction");
//   transactionService
//     .sendTransaction(
//       senderPrivateKey,
//       recipientAddress,
//       amount,
//       namespaceName.toLowerCase(),
//       message,
//       writer
//     )
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: transfer transaction with mosaic id
//  */
// router.put("/sendMosaic", (req: Request, res: Response) => {
//   const senderPrivateKey = req.body.senderPrivateKey;
//   const recipientAddress = req.body.recipientAddress;
//   const amount = req.body.amount;
//   const mosaicId = req.body.mosaicId;
//   const message = req.body.message;
//   const length = Object.keys(req.body).length;

//   if (!req.body.senderPrivateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "senderPrivateKey is required"
//     });
//   }
//   if (!req.body.recipientAddress) {
//     return res.status(400).send({
//       status: "failed",
//       message: "recipientAddress is required"
//     });
//   }
//   if (!req.body.mosaicId) {
//     return res.status(400).send({
//       status: "failed",
//       message: "mosaicId is required"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (!req.body.message) {
//     return res.status(400).send({
//       status: "failed",
//       message: "message is required"
//     });
//   } else if (length !== 5) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("send"));

//   writer.addTASK("transactionService.sendTransactionMosaic");
//   transactionService
//     .sendTransactionMosaic(
//       senderPrivateKey,
//       recipientAddress,
//       amount,
//       mosaicId,
//       message,
//       writer
//     )
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: transfer transaction with JSON message
//  */
// router.put("/sendJSON", (req: Request, res: Response) => {
//   const senderPrivateKey = req.body.senderPrivateKey;
//   const recipientAddress = req.body.recipientAddress;
//   const amount = req.body.amount;
//   const namespaceName = req.body.namespaceName;
//   const message = req.body.message;
//   const length = Object.keys(req.body).length;

//   if (!req.body.senderPrivateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "senderPrivateKey is required"
//     });
//   }
//   if (!req.body.recipientAddress) {
//     return res.status(400).send({
//       status: "failed",
//       message: "recipientAddress is required"
//     });
//   }
//   if (!req.body.namespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceName is required"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (!req.body.message) {
//     return res.status(400).send({
//       status: "failed",
//       message: "message is required"
//     });
//   } else if (length !== 5) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("send"));

//   writer.addTASK("transactionService.sendTransactionJSON");
//   transactionService
//     .sendTransactionJSON(
//       senderPrivateKey,
//       recipientAddress,
//       amount,
//       namespaceName.toLowerCase(),
//       JSON.stringify(message),
//       writer
//     )
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: get transaction status
//  */
// router.get("/getStatus", (req: Request, res: Response) => {
//   const transactionHash = req.body.transactionHash;
//   const length = Object.keys(req.body).length;

//   if (!req.body.transactionHash) {
//     return res.status(400).send({
//       status: "failed",
//       message: "transactionHash is required"
//     });
//   } else if (length !== 1) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   transactionService
//     .getTransactionStatus(transactionHash)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: get confirmed transaction info
//  */
// router.get("/getConfirmedInfo", (req: Request, res: Response) => {
//   const transactionHash = req.body.transactionHash;
//   const length = Object.keys(req.body).length;

//   if (!req.body.transactionHash) {
//     return res.status(400).send({
//       status: "failed",
//       message: "transactionHash is required"
//     });
//   } else if (length !== 1) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   transactionService
//     .getConfirmedTransactionInfo(transactionHash)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: transfer transaction to multiple recipients
//  */
// router.put("/sendToMultiple", (req: Request, res: Response) => {
//   const senderPrivateKey = req.body.senderPrivateKey;
//   const recipientsList = req.body.recipientsList;
//   const amount = req.body.amount;
//   const message = req.body.message;
//   const namespaceName = req.body.namespaceName;
//   const length = Object.keys(req.body).length;

//   if (!req.body.senderPrivateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "senderPrivateKey is required"
//     });
//   }
//   if (!req.body.recipientsList) {
//     return res.status(400).send({
//       status: "failed",
//       message: "recipientsList is required"
//     });
//   }
//   if (!req.body.namespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceName is required"
//     });
//   }
//   if (!req.body.message) {
//     return res.status(400).send({
//       status: "failed",
//       message: "message is required"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (length !== 5) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog());

//   writer.addTASK("transactionService.sendTransactionToMultiple");
//   transactionService.sendToMultipleTransaction(recipientsList, senderPrivateKey, amount, namespaceName, message, writer).then(transactions => {
//     res.json({
//       "transactionHashes": transactions
//     });
//   })
// });

// export default router;
