// import express = require("express");
// import { Request, Response } from "express";
// import { mosaicService } from "../../services/symbol-sdk/mosaicService";
// import { Writer } from "../../helpers/writer";
// import { generator } from "../../helpers/generator";

// const router = express.Router();

// /**
//  * Endpoint: create mosaic
//  */
// router.post("/create", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const namespaceName = req.body.namespaceName;
//   const amount = req.body.amount;
//   const divisibility = req.body.divisibility;
//   const duration = req.body.duration;
//   const length = Object.keys(req.body).length;

//   if (!req.body.privateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "privateKey is required"
//     });
//   }
//   if (!req.body.namespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceName is required (format: namespace.subnamespace)"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (!req.body.divisibility) {
//     return res.status(400).send({
//       status: "failed",
//       message: "divisibility is required"
//     });
//   }
//   if (!req.body.duration) {
//     return res.status(400).send({
//       status: "failed",
//       message: "duration is required"
//     });
//   } else if (length !== 5) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("createMosaic"));

//   writer.addTASK("mosaicService.createMosaic");
//   mosaicService
//     .createMosaic(privateKey, namespaceName.toLowerCase(), amount, divisibility, duration, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: create mosaic without namespace
//  */
// router.post("/createWithoutNamespace", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const amount = req.body.amount;
//   const divisibility = req.body.divisibility;
//   const duration = req.body.duration;
//   const length = Object.keys(req.body).length;

//   if (!req.body.privateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "privateKey is required"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (!req.body.divisibility) {
//     return res.status(400).send({
//       status: "failed",
//       message: "divisibility is required"
//     });
//   }
//   if (!req.body.duration) {
//     return res.status(400).send({
//       status: "failed",
//       message: "duration is required"
//     });
//   } else if (length !== 4) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("createMosaicWithoutNamespace"));

//   writer.addTASK("mosaicService.createMosaicWithoutNamespace");
//   mosaicService
//     .createMosaicWithoutNamespace(privateKey, amount, divisibility, duration, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: create mosaic bonded
//  */
// router.post("/createBonded", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const namespaceName = req.body.namespaceName;
//   const amount = req.body.amount;
//   const divisibility = req.body.divisibility;
//   const duration = req.body.duration;
//   const length = Object.keys(req.body).length;

//   if (!req.body.privateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "privateKey is required"
//     });
//   }
//   if (!req.body.namespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceName is required (format: namespace.subnamespace)"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (!req.body.divisibility) {
//     return res.status(400).send({
//       status: "failed",
//       message: "divisibility is required"
//     });
//   }
//   if (!req.body.duration) {
//     return res.status(400).send({
//       status: "failed",
//       message: "duration is required"
//     });
//   } else if (length !== 5) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("createMosaicBonded"));

//   writer.addTASK("mosaicService.createMosaicBonded");
//   mosaicService
//     .createMosaicBonded(privateKey, namespaceName.toLowerCase(), amount, divisibility, duration, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: create mosaic bonded Without Namespace
//  */
// router.post("/createBondedWithoutNamespace", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const amount = req.body.amount;
//   const divisibility = req.body.divisibility;
//   const duration = req.body.duration;
//   const length = Object.keys(req.body).length;

//   if (!req.body.privateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "privateKey is required"
//     });
//   }
//   if (!req.body.amount) {
//     return res.status(400).send({
//       status: "failed",
//       message: "amount is required"
//     });
//   }
//   if (!req.body.divisibility) {
//     return res.status(400).send({
//       status: "failed",
//       message: "divisibility is required"
//     });
//   }
//   if (!req.body.duration) {
//     return res.status(400).send({
//       status: "failed",
//       message: "duration is required"
//     });
//   } else if (length !== 4) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("createMosaicBondedWithoutNamespace"));

//   writer.addTASK("mosaicService.createMosaicBondedWithoutNamespace");
//   mosaicService
//     .createMosaicBondedWithoutNamespace(privateKey, amount, divisibility, duration, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: get mosaic info
//  */
// router.get("/getInfo", (req: Request, res: Response) => {
//   const mosaicId = req.body.mosaicId;
//   const length = Object.keys(req.body).length;

//   if (!req.body.mosaicId) {
//     return res.status(400).send({
//       status: "failed",
//       message: "mosaicId is required"
//     });
//   } else if (length !== 1) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }
//   mosaicService
//     .getMosaicInfo(mosaicId)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: increase supply
//  */
// router.put("/increase", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const mosaicId = req.body.mosaicId;
//   const amount = req.body.amount;
//   const mosaicDivisibility = req.body.mosaicDivisibility;
//   const length = Object.keys(req.body).length;

//   if (!req.body.privateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "privateKey is required"
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
//   if (!req.body.mosaicDivisibility) {
//     return res.status(400).send({
//       status: "failed",
//       message: "mosaicDivisibility is required"
//     });
//   } else if (length !== 4) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog());

//   writer.addTASK("mosaicService.increaseSupply");
//   mosaicService
//     .increaseSupply(privateKey, mosaicId, amount, mosaicDivisibility, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: decrease supply
//  */
// router.put("/decrease", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const mosaicId = req.body.mosaicId;
//   const amount = req.body.amount;
//   const mosaicDivisibility = req.body.mosaicDivisibility;
//   const length = Object.keys(req.body).length;

//   if (!req.body.privateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "privateKey is required"
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
//   if (!req.body.mosaicDivisibility) {
//     return res.status(400).send({
//       status: "failed",
//       message: "mosaicDivisibility is required"
//     });
//   } else if (length !== 4) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog());

//   writer.addTASK("mosaicService.decreaseSupply");
//   mosaicService
//     .decreaseSupply(privateKey, mosaicId, amount, mosaicDivisibility, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// export default router;
