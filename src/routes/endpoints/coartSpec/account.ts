import express = require("express");
import { Request, Response } from "express";
import { accountService } from "../../../services/symbol-sdk/accountService";

const router = express.Router();

/**
 * @swagger
 * /account/create:
 *   post:
 *     summary: Create account.
 *     description: |
 *       Generates a keypair and an address. Account is not yet activated on the blockchain.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID.
 *                 example: 1
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: User ID.
 *                   example: 1
 *                 address:
 *                   type: object
 *                   description: Account address object.
 *                   properties:
 *                     address:
 *                       type: string
 *                       description: Account address.
 *                       example: TCIYKUSKMZ7HH57LV3RZGJ2RH3X46XWOQJ6MFUA
 *                     networkType:
 *                       type: integer
 *                       description: Blockchain network type.
 *                       example: 152
 *                 privateKey:
 *                   type: string
 *                   description: Account private key.
 *                   example: C0824419FD589DCD31C79FFEC7887C3544BF330DEF927BA09AF0D22D3D364A08
 *                 publicKey:
 *                   type: string
 *                   description: Account public key.
 *                   example: 0B13A3A818CA7F96F46C3E7AD124CD516953F1424C4DE16B4868E381E0F7B034
 */
router.post("/create", (req: Request, res: Response) => {
  const length = Object.keys(req.body).length

  if (!req.body.userId) {
    return res.status(400).send({
      status: 'failed',
      message: 'userId is required',
    });
  }
  else if (length !== 1) {
    return res.status(400).send({
      status: 'failed',
      message: 'too many or too little parameters',
    });
  }
  accountService.createAccount(req.body.userId)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});


/**
 * @swagger
 * /account/getBalance/{address}:
 *   get:
 *     summary: Get balance.
 *     description: |
 *       Get mosaic balance of specified address.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           description: Account address.
 *           example: TCIYKUSKMZ7HH57LV3RZGJ2RH3X46XWOQJ6MFUA
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 description: Currency amount object
 *                 properties:
 *                    mosaicId:
 *                      type: string
 *                      description: Mosaic Id.
 *                      example: 7B2D18A409AAC10C
 *                    amount:
 *                       type: integer
 *                       description: Owned mosaic amount
 *                       example: 1
 */
router.get("/getBalance/:address", (req: Request, res: Response) => {
  const address = req.params.address;

  if (!req.params.address) {
    return res.status(400).send({
      status: 'failed',
      message: 'address is required',
    });
  }

  accountService.getUserBalance(address)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});


/**
 * @swagger
 * /account/getTransactions/{address}:
 *   get:
 *     summary: Get address transactions.
 *     description: |
 *       Query the specified address incoming and outgoing transactions.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           description: Account address.
 *           example: TCIYKUSKMZ7HH57LV3RZGJ2RH3X46XWOQJ6MFUA
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 description: Currency amount object
 *                 properties:
 *                    transaction:
 *                      type: object
 *                      description: transaction information
 */
router.get("/getTransactions/:address", (req: Request, res: Response) => {
  const address = req.params.address;

  if (!req.params.address) {
    return res.status(400).send({
      status: 'failed',
      message: 'address is required',
    });
  }

  accountService.getUserTransactions(address)
    .then((result) => res.json(result))
    .catch((err) => res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + err.message
    }));
});
export default router;