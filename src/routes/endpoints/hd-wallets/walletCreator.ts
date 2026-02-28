import express = require("express");
import { Request, Response } from "express";
import { walletCreatorService } from "../../../services/hd-wallets/walletCreatorService";
const router = express.Router();

/**
 * @swagger
 * /hd-wallets/create/wallet:
 *   get:
 *     summary: Generates a HD-Wallet account
 *     description: |
 *       Generates HD-Wallet's master account from a provided passphrase.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passPhrase:
 *                 type: string
 *                 description: HD-Wallet passphrase.
 *                 example: "trophy demand duck food hurt solid flight shrimp leopard road olympic trigger"
 *               language:
 *                 type: string
 *                 description: language of the passphrase.
 *                 example: "english"
 *               strength:
 *                 type: string
 *                 description: Strength - leave empty.
 *                 example: ""
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pass_phrase:
 *                   type: string
 *                   description: passphrase used for wallet generation.
 *                   example: "trophy demand duck food hurt solid flight shrimp leopard road olympic trigger"
 *                 master_account:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       description: Master account address.
 *                       example: TBEZ2ED7QNEZXLDUBBQ6OJKFL6K6Y4YZIVYHLNI
 *                     public_key:
 *                       type: string
 *                       description: Master account public key.
 *                       example: 13FA93C616BFB426809239AFAB31CCE9B158EA6B3193727B2009BA7B80E6C30A
 *                     private_key:
 *                       type: string
 *                       description: Master account private key.
 *                       example: 7ECC029D91CDC53E77099DA6D2587659C6C850A76BC95BC1BE6157F34C30950E
 */
router.get("/wallet", (req: Request, res: Response) => {
    let passPhrase = req.body.passPhrase;
    let language = req.body.language;
    let strength = req.body.strength;
    const length = Object.keys(req.body).length

    if (!req.body.passPhrase) {
        if (req.body.passPhrase === "0" || req.body.passPhrase === "") {
            passPhrase = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'passPhrase is required',
            });
        }
    }
    if (!req.body.language) {
        if (req.body.language === "0" || req.body.language === "") {
            language = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'language is required',
            });
        }
    }
    if (!req.body.strength) {
        if (req.body.strength === "0" || req.body.strength === "") {
            strength = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'strength is required',
            });
        }
    }
    else if (length !== 3) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    res.send(walletCreatorService.createDeterministicWallet(passPhrase, language, strength));
});

export default router;