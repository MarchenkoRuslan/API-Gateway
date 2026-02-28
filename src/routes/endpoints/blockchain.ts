// import express = require("express");
// import { Request, Response } from "express";
// import { blockchainService } from "../../services/symbol-sdk/blockchainService";

// const router = express.Router();

// /**
//  * Endpoint: get Blockchain height in blocks
//  */
// router.get("/getHeight", (req: Request, res: Response) => {

//     blockchainService.getHeight()
//         .then((result) => res.json(result))
//         .catch((err) => res.status(400).send({
//             status: "failed",
//             error: `An Unexpected Error Occurred: ` + err.message
//         }));

// });

// export default router;