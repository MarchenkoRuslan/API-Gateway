// import express = require("express");
// import { Request, Response } from "express";
// import { accountService } from "../../services/symbol-sdk/accountService";

// const router = express.Router();

// /**
//  * Endpoint: create account
//  * Generates a pair of keys and an address
//  */
// router.post("/create", (req: Request, res: Response) => {
//   const length = Object.keys(req.body).length

//   if (!req.body.userId) {
//     return res.status(400).send({
//       status: 'failed',
//       message: 'userId is required',
//     });
//   }
//   else if (length !== 1) {
//     return res.status(400).send({
//       status: 'failed',
//       message: 'too much parameters',
//     });
//   }
//   accountService.createAccount(req.body.userId)
//     .then((result) => res.json(result))
//     .catch((err) => res.status(400).send({
//       status: "failed",
//       error: `An Unexpected Error Occurred: ` + err.message
//     }));
// });

// /**
//  * Endpoint: query user (address's) balance
//  */
// router.get("/getBalance", (req: Request, res: Response) => {
//   const address = req.body.address;
//   const length = Object.keys(req.body).length

//   if (!req.body.address) {
//     return res.status(400).send({
//       status: 'failed',
//       message: 'address is required',
//     });
//   }
//   else if (length !== 1) {
//     return res.status(400).send({
//       status: 'failed',
//       message: 'too much parameters',
//     });
//   }

//   accountService.getUserBalance(address)
//     .then((result) => res.json(result))
//     .catch((err) => res.status(400).send({
//       status: "failed",
//       error: `An Unexpected Error Occurred: ` + err.message
//     }));
// });

// /**
//  * Endpoint: query user (address's) transactions, Incoming and Outgoing
//  */
// router.get("/getTransactions", (req: Request, res: Response) => {
//   const address = req.body.address;
//   const length = Object.keys(req.body).length

//   if (!req.body.address) {
//     return res.status(400).send({
//       status: 'failed',
//       message: 'address is required',
//     });
//   }
//   else if (length !== 1) {
//     return res.status(400).send({
//       status: 'failed',
//       message: 'too much parameters',
//     });
//   }

//   accountService.getUserTransactions(address)
//     .then((result) => res.json(result))
//     .catch((err) => res.status(400).send({
//       status: "failed",
//       error: `An Unexpected Error Occurred: ` + err.message
//     }));
// });
// export default router;