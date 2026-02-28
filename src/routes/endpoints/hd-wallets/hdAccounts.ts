import express = require("express");
import { Request, Response } from "express";
import { hdAccountsService } from "../../../services/hd-wallets/hdAccountsService"

const router = express.Router();

/**
 * @swagger
 * /hd-wallets/hdAccounts/getChild:
 *   get:
 *     summary: Gets a child account of a HD-Wallet
 *     description: |
 *       Gets a child account of a HD-Wallet by passphrase, account number, keychain and address number
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
 *                 description: HD-Wallet passphrase
 *                 example: "trophy demand duck food hurt solid flight shrimp leopard road olympic trigger"
 *               accountNumber:
 *                 type: integer
 *                 description: child account number to be received.
 *                 example: 1
 *               keychain:
 *                 type: string
 *                 description: Keychain number which in COART is equal to 0.
 *                 example: 0
 *               addressNumber:
 *                 type: string
 *                 description: Address number which in COART is equal to 0.
 *                 example: 0
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 child_account:
 *                   type: object
 *                   properties:
 *                     account_number:
 *                       type: integer
 *                       description: Child account number.
 *                       example: 1
 *                     keyChain:
 *                       type: string
 *                       description: Keychain number.
 *                       example: 0
 *                     address_number:
 *                       type: string
 *                       description: Address number.
 *                       example: 0
 *                     address:
 *                       type: string
 *                       description: Child account address.
 *                       example: TBEZ2ED7QNEZXLDUBBQ6OJKFL6K6Y4YZIVYHLNI
 *                     public_key:
 *                       type: string
 *                       description: Child account public key.
 *                       example: 13FA93C616BFB426809239AFAB31CCE9B158EA6B3193727B2009BA7B80E6C30A
 *                     private_key:
 *                       type: string
 *                       description: Child account private key.
 *                       example: 7ECC029D91CDC53E77099DA6D2587659C6C850A76BC95BC1BE6157F34C30950E
 */
router.get("/getChild", (req: Request, res: Response) => {
    const accountNumber = req.body.accountNumber;
    const keychain = req.body.keychain;
    const addressNumber = req.body.addressNumber;
    let passPhrase = req.body.passPhrase;
    const length = Object.keys(req.body).length

    if (!req.body.accountNumber) {
        return res.status(400).send({
            status: 'failed',
            message: 'accountNumber is required',
        });
    }
    if (!req.body.keychain) {
        return res.status(400).send({
            status: 'failed',
            message: 'keychain is required',
        });
    }
    if (!req.body.addressNumber) {
        return res.status(400).send({
            status: 'failed',
            message: 'addressNumber is required',
        });
    }
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
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    res.send(hdAccountsService.getWalletChildAccount(accountNumber, keychain, addressNumber, passPhrase));
});

export default router;