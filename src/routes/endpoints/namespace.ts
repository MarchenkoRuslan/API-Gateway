// import express = require("express");
// import { Request, Response } from "express";
// import { namespaceService } from "../../services/symbol-sdk/namespaceService";
// import { Writer } from "../../helpers/writer";
// import { generator } from "../../helpers/generator";

// const router = express.Router();

// /**
//  * Endpoint: Create namespace
//  */
// router.post("/create", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const namespaceName = req.body.namespaceName;
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
//       message: "namespaceName is required"
//     });
//   }
//   if (!req.body.duration) {
//     return res.status(400).send({
//       status: "failed",
//       message: "duration is required"
//     });
//   } else if (length !== 3) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("createNamespace"));

//   writer.addTASK("namespaceService.createNamespaceForce");
//   namespaceService
//     .createNamespace(privateKey, namespaceName.toLowerCase(), duration, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: create sub namespace
//  */
// router.post("/createSub", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const rootNamespaceName = req.body.rootNamespaceName;
//   const subnamespaceName = req.body.subnamespaceName;
//   const length = Object.keys(req.body).length;

//   if (!req.body.privateKey) {
//     return res.status(400).send({
//       status: "failed",
//       message: "privateKey is required"
//     });
//   }
//   if (!req.body.rootNamespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "rootNamespaceName is required"
//     });
//   }
//   if (!req.body.subnamespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "subnamespaceName is required"
//     });
//   } else if (length !== 3) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("createSubNamespace"));

//   writer.addTASK("namespaceService.createSubNamespace");
//   namespaceService
//     .createSubNamespace(privateKey, rootNamespaceName.toLowerCase(), subnamespaceName.toLowerCase(), writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: get namespace info
//  */
// router.get("/getInfo", (req: Request, res: Response) => {
//   const namespaceName = req.body.namespaceName;
//   const length = Object.keys(req.body).length;

//   if (!req.body.namespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceName is required"
//     });
//   } else if (length !== 1) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   namespaceService
//     .getNamespaceInfo(namespaceName.toLowerCase())
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: get id by namespace
//  */
// router.get("/getIdByNamespace", (req: Request, res: Response) => {
//   const namespaceName = req.body.namespaceName;
//   const length = Object.keys(req.body).length;

//   if (!req.body.namespaceName) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceName is required"
//     });
//   } else if (length !== 1) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   namespaceService
//     .getIdByNamespace(namespaceName.toLowerCase())
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: get namespace by id
//  */
// router.get("/getNamespaceById", (req: Request, res: Response) => {
//   const namespaceId = req.body.namespaceId;
//   const length = Object.keys(req.body).length;

//   if (!req.body.namespaceId) {
//     return res.status(400).send({
//       status: "failed",
//       message: "namespaceId is required"
//     });
//   } else if (length !== 1) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   namespaceService
//     .getNamespaceById(namespaceId)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: Link a namespace to an address
//  */
// router.post("/linkToAnAddress", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const namespaceName = req.body.namespaceName;
//   const address = req.body.address;
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
//       message: "namespaceName is required"
//     });
//   }
//   if (!req.body.address) {
//     return res.status(400).send({
//       status: "failed",
//       message: "address is required"
//     });
//   } else if (length !== 3) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("linkToAnAddress"));

//   writer.addTASK("namespaceService.linkToAnAddress");
//   namespaceService
//     .linkToAnAddress(privateKey, namespaceName.toLowerCase(), address, writer)
//     .then(result => res.json(result))
//     .catch(err =>
//       res.status(400).send({
//         status: "failed",
//         error: `An Unexpected Error Occurred: ` + err.message
//       })
//     );
// });

// /**
//  * Endpoint: Link a namespace to a mosaic
//  */
// router.post("/linkToAMosaic", (req: Request, res: Response) => {
//   const privateKey = req.body.privateKey;
//   const namespaceName = req.body.namespaceName;
//   const mosaicId = req.body.mosaicId;
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
//       message: "namespaceName is required"
//     });
//   }
//   if (!req.body.mosaicId) {
//     return res.status(400).send({
//       status: "failed",
//       message: "mosaicId is required"
//     });
//   } else if (length !== 3) {
//     return res.status(400).send({
//       status: "failed",
//       message: "too much parameters"
//     });
//   }

//   const writer = new Writer();
//   writer.createStream(generator.makeLog("linkToAMosaic"));

//   writer.addTASK("namespaceService.linkToAMosaic");
//   namespaceService
//       .linkToAMosaic(privateKey, namespaceName.toLowerCase(), mosaicId, writer)
//       .then(result => res.json(result))
//       .catch(err =>
//           res.status(400).send({
//             status: "failed",
//             error: `An Unexpected Error Occurred: ` + err.message
//           })
//       );
// });
// export default router;
