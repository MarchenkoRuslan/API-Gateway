// import express = require("express");
// import { Request, Response } from "express";
// import { restrictionService } from "../../services/symbol-sdk/restrictionService";
// import { generator } from "../../helpers/generator";
// import { Writer } from "../../helpers/writer";

// const router = express.Router();

// /**
//  * Endpoint: restrict account
//  */
// router.post("/restrictAccount", (req: Request, res: Response) => {
//     const mosaicCreatorPrivateKey = req.body.mosaicCreatorPrivateKey;
//     const accountAddress = req.body.accountAddress;
//     const mosaicId = req.body.mosaicId;
//     const length = Object.keys(req.body).length

//     if (!req.body.mosaicCreatorPrivateKey) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'mosaicCreatorPrivateKey is required',
//         });
//     }
//     if (!req.body.accountAddress) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'accountAddress is required',
//         });
//     }
//     if (!req.body.mosaicId) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'mosaicId is required',
//         });
//     }
//     else if (length !== 3) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'too much parameters',
//         });
//     }
//     const writer = new Writer();
//     writer.createStream(generator.makeLog("restrict"));

//     writer.addTASK("restrictionService.restrictAccountTransfers");

//     restrictionService.restrictAccountTransfers(
//         mosaicCreatorPrivateKey,
//         accountAddress,
//         mosaicId,
//         writer
//     )
//         .then((result) => res.json(result))
//         .catch((err) =>
//             res.status(400).send({
//                 status: "failed",
//                 error: `An Unexpected Error Occurred: ` + err.message
//             }));
// });


// /**
//  * Endpoint: Get Account Restrictions
//  */
// router.get("/getAccountRestrictions", (req: Request, res: Response) => {
//     const accountAddress = req.body.accountAddress;
//     const length = Object.keys(req.body).length

//     if (!req.body.accountAddress) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'accountAddress is required',
//         });
//     }
//     else if (length !== 1) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'too much parameters',
//         });
//     }

//     restrictionService.getAccountRestrictions(
//         accountAddress
//     )
//         .then((result) => res.json(result))
//         .catch((err) =>
//             res.status(400).send({
//                 status: "failed",
//                 error: `An Unexpected Error Occurred: ` + err.message
//             }));
// });

// /**
//  * Endpoint: Get Mosaic Restrictions
//  */
// router.get("/getMosaicRestrictions", (req: Request, res: Response) => {
//     const mosaicId = req.body.mosaicId;
//     const length = Object.keys(req.body).length

//     if (!req.body.mosaicId) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'mosaicId is required',
//         });
//     }
//     else if (length !== 1) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'too much parameters',
//         });
//     }

//     restrictionService.getMosaicRestrictions(
//         mosaicId
//     )
//         .then((result) => res.json(result))
//         .catch((err) =>
//             res.status(400).send({
//                 status: "failed",
//                 error: `An Unexpected Error Occurred: ` + err.message
//             }));
// });

// /**
//  * Endpoint: mosaic global restriction
//  */
// router.post("/mosaicGlobalRestriction", (req: Request, res: Response) => {
//     const mosaicCreatorPrivateKey = req.body.mosaicCreatorPrivateKey;
//     const mosaicId = req.body.mosaicId;
//     const length = Object.keys(req.body).length

//     if (!req.body.mosaicCreatorPrivateKey) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'mosaicCreatorPrivateKey is required',
//         });
//     }
//     if (!req.body.mosaicId) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'mosaicId is required',
//         });
//     }
//     else if (length !== 2) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'too much parameters',
//         });
//     }
//     const writer = new Writer();
//     writer.createStream(generator.makeLog("restrict"));

//     writer.addTASK("restrictionService.mosaicGlobalRestriction");

//     restrictionService.mosaicGlobalRestriction(
//         mosaicCreatorPrivateKey,
//         mosaicId,
//         writer
//     )
//         .then((result) => res.json(result))
//         .catch((err) =>
//             res.status(400).send({
//                 status: "failed",
//                 error: `An Unexpected Error Occurred: ` + err.message
//             }));
// });

// export default router;