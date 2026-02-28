import express = require("express");
import { Request, Response } from "express";
import { blockchainService } from "../../../services/symbol-sdk/blockchainService";

const router = express.Router();

/**
 * Endpoint: get Blockchain height in blocks
 */
/**
 * @swagger
 * /blockchain/getHeight:
 *   get:
 *     summary: Get blockchain height.
 *     description: |
 *       Get the height of the most recently harvested block on the blockchain.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               description: Blockchain height.
 *               example: 125126
 */
router.get("/getHeight", (req: Request, res: Response) => {

    blockchainService.getHeight()
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));

});

export default router;