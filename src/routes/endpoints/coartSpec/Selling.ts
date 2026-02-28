import express = require("express");
import {Request, Response} from "express";
import {Writer} from '../../../helpers/writer';
import {generator} from "../../../helpers/generator";
import {transactionService} from "../../../services/symbol-sdk/transactionService";
import {Constants} from '../../../helpers/constants';
import {transactionMultisigService} from "../../../services/symbol-sdk/multisig/transactionMultisigService";
import { blockchainService } from "../../../services/symbol-sdk/blockchainService";


const router = express.Router();

/**
 * @swagger
 * /selling/sellMosaicTransactionBonded:
 *   post:
 *     summary: Executes the sale process of the mosaic between two regular accounts
 *     description: |
 *       Mosaic (NFT) is transferred from seller account to buyer |
 *       and currency is send from buyer to seller. Needs co-sign for confirmation
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buyerPrivateKey:
 *                 type: string
 *                 description: Private key of the buyer (initiator of the transaction).
 *                 example: 0FE4E9B0CC7F009ADBD4040DC80387C9E481D37311FD9AC1ACABCA3D4977483F
 *               sellerPublicKey:
 *                 type: string
 *                 description: Public key of the current mosaic holder (seller).
 *                 example: 74BD7DE4298AF902F723FFE9B90EB6AFAAECE5E0B63F6A817C7F03A029BCBCA3
 *               mosaicAmount:
 *                 type: integer
 *                 description: Mosaic amount to sell.
 *                 example: 4
 *               costCurrency:
 *                 type: integer
 *                 description: Cost of the mosaic that is bought.
 *                 example: 1000
 *               mosaicId:
 *                 type: string
 *                 description: Id of the mosaic to be sold.
 *                 example: 129739805D21ECBF
 *               message:
 *                 type: string
 *                 description: Message to attach to the selling transaction.
 *                 example: Selling a painting.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                   description: Hash of the transaction
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 *                 group:
 *                   type: string
 *                   description: Transaction group.
 *                   example: partial
 *                 status:
 *                   type: string
 *                   description: Transaction status.
 *                   example: Success
 *                 cosignHash:
 *                   type: string
 *                   description: Hash of transaction for the buyer to cosign
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 */
router.put("/sellMosaicTransactionBonded", async (req: Request, res: Response) => {
    const buyerPrivateKey = req.body.buyerPrivateKey;
    const sellerPublicKey = req.body.sellerPublicKey;
    const mosaicAmount = req.body.mosaicAmount;
    const costCurrency = req.body.costCurrency;
    const mosaicId = req.body.mosaicId;
    const message = req.body.message;
    const length = Object.keys(req.body).length;

    if (!req.body.buyerPrivateKey) {
        return res.status(400).send({
            status: "failed",
            message: "buyerPrivateKey is required"
        });
    }
    if (!req.body.sellerPublicKey) {
        return res.status(400).send({
            status: "failed",
            message: "sellerPublicKey is required"
        });
    }
    if (!req.body.mosaicAmount) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicAmount is required"
        });
    }
    if (!req.body.costCurrency) {
        return res.status(400).send({
            status: "failed",
            message: "costCurrency is required"
        });
    }
    if (!req.body.mosaicId) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicId is required"
        });
    }
    if (!req.body.message) {
        return res.status(400).send({
            status: "failed",
            message: "message is required"
        });
    }
    else if (length !== 6) {
        return res.status(400).send({
            status: "failed",
            message: "too many or too little parameters"
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog("send"));
    const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();
    writer.addTASK("transactionService.sellMosaicTransactionBonded");
    await transactionService
        .sellMosaicTransactionBonded(
            buyerPrivateKey,
            sellerPublicKey,
            mosaicAmount,
            costCurrency,
            mosaicId,
            message,
            writer,
            medianFeeMultiplier
        ).then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

/**
 * @swagger
 * /selling/sellMosaicTransactionComplete:
 *   post:
 *     summary: Executes the sale process of the mosaic between two regular accounts
 *     description: |
 *       Mosaic (NFT) is transferred from seller account to buyer |
 *       and currency is send from buyer to seller and co-signs the transaction
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buyerPrivateKey:
 *                 type: string
 *                 description: Private key of the buyer (initiator of the transaction).
 *                 example: 0FE4E9B0CC7F009ADBD4040DC80387C9E481D37311FD9AC1ACABCA3D4977483F
 *               sellerPrivateKey:
 *                 type: string
 *                 description: Private key of the current mosaic holder (seller).
 *                 example: 6E8B0A89D3B5450AA16ABE25E72DDCEC6A039751E6E757045766A92919A34444
 *               mosaicAmount:
 *                 type: integer
 *                 description: Mosaic amount to sell.
 *                 example: 4
 *               costCurrency:
 *                 type: integer
 *                 description: Cost of the mosaic that is bought.
 *                 example: 1000
 *               mosaicId:
 *                 type: string
 *                 description: Id of the mosaic to be sold.
 *                 example: 129739805D21ECBF
 *               message:
 *                 type: string
 *                 description: Message to attach to the selling transaction.
 *                 example: Selling a painting.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                   description: Hash of the transaction
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 *                 group:
 *                   type: string
 *                   description: Transaction group.
 *                   example: partial
 *                 status:
 *                   type: string
 *                   description: Transaction status.
 *                   example: Success
 *                 cosignHash:
 *                   type: string
 *                   description: Hash of transaction for the buyer to cosign
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 */
router.put("/sellMosaicTransactionComplete", async (req: Request, res: Response) => {
    const buyerPrivateKey = req.body.buyerPrivateKey;
    const sellerPrivateKey = req.body.sellerPrivateKey;
    const mosaicAmount = req.body.mosaicAmount;
    const costCurrency = req.body.costCurrency;
    const mosaicId = req.body.mosaicId;
    const message = req.body.message;
    const length = Object.keys(req.body).length;

    if (!buyerPrivateKey) {
        return res.status(400).send({
            status: "failed",
            message: "buyerPrivateKey is required"
        });
    }
    if (!mosaicAmount) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicAmount is required"
        });
    }
    if (!costCurrency) {
        return res.status(400).send({
            status: "failed",
            message: "costCurrency is required"
        });
    }
    if (!mosaicId) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicId is required"
        });
    }
    if (!message) {
        return res.status(400).send({
            status: "failed",
            message: "message is required"
        });
    }
    else if (length !== 6) {
        return res.status(400).send({
            status: "failed",
            message: "too many or too little parameters"
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog("send"));
    const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();

    writer.addTASK("transactionService.sellMosaicTransactionComplete");
    await transactionService
        .sellMosaicTransactionComplete(
            buyerPrivateKey,
            sellerPrivateKey,
            mosaicAmount,
            costCurrency,
            mosaicId,
            message,
            writer,
            medianFeeMultiplier
        ).then(result => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            })
        );
});


/**
 * @swagger
 * /selling/sellMosaicTransactionBonded:
 *   post:
 *     summary: Executes the sale process of the mosaic between two multisig accounts
 *     description: |
 *       Mosaic (NFT) is transferred from seller account to buyer |
 *       and currency is send from buyer to seller
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buyerMultisigPublicKey:
 *                 type: string
 *                 description: Public key of the buyer (initiator of the transaction) multisig account.
 *                 example: 0FE4E9B0CC7F009ADBD4040DC80387C9E481D37311FD9AC1ACABCA3D4977483F
 *               cosignatoryPrivateKey:
 *                 type: string
 *                 description: Private key of one of the cosignatories from the buyer account
 *                 example: DF5584622B270198291FEF991AD926607F30193E6A307276A5296B8F3EC043BC
 *               sellerPublicKey:
 *                 type: string
 *                 description: Public key of the current mosaic holder (seller).
 *                 example: 74BD7DE4298AF902F723FFE9B90EB6AFAAECE5E0B63F6A817C7F03A029BCBCA3
 *               mosaicAmount:
 *                 type: integer
 *                 description: Mosaic amount to sell.
 *                 example: 4
 *               costCurrency:
 *                 type: integer
 *                 description: Cost of the mosaic that is bought.
 *                 example: 1000
 *               mosaicId:
 *                 type: string
 *                 description: Id of the mosaic to be sold.
 *                 example: 129739805D21ECBF
 *               message:
 *                 type: string
 *                 description: Message to attach to the selling transaction.
 *                 example: Selling a painting.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                   description: Hash of the transaction
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 *                 group:
 *                   type: string
 *                   description: Transaction group.
 *                   example: partial
 *                 status:
 *                   type: string
 *                   description: Transaction status.
 *                   example: Success
 *                 cosignHash:
 *                   type: string
 *                   description: Hash of transaction for the buyer to cosign
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 */
router.put("/multisigSellMosaicTransactionBonded", async (req: Request, res: Response) => {
    const buyerMultisigPublicKey = req.body.buyerMultisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const sellerPublicKey = req.body.sellerPublicKey;
    const mosaicAmount = req.body.mosaicAmount;
    const costCurrency = req.body.costCurrency;
    const mosaicId = req.body.mosaicId;
    const message = req.body.message;
    const length = Object.keys(req.body).length;

    if (!req.body.buyerMultisigPublicKey) {
        return res.status(400).send({
            status: "failed",
            message: "buyerMultisigPublicKey is required"
        });
    }
    if (!req.body.cosignatoryPrivateKey) {
        return res.status(400).send({
            status: "failed",
            message: "cosignatoryPrivateKey is required"
        });
    }
    if (!req.body.sellerPublicKey) {
        return res.status(400).send({
            status: "failed",
            message: "sellerPublicKey is required"
        });
    }
    if (!req.body.mosaicAmount) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicAmount is required"
        });
    }
    if (!req.body.costCurrency) {
        return res.status(400).send({
            status: "failed",
            message: "costCurrency is required"
        });
    }
    if (!req.body.mosaicId) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicId is required"
        });
    }
    if (!req.body.message) {
        return res.status(400).send({
            status: "failed",
            message: "message is required"
        });
    }
    else if (length !== 7) {
        return res.status(400).send({
            status: "failed",
            message: "too many or too little parameters"
        });
    }

    const writer = new Writer();
    const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();
    writer.createStream(generator.makeLog("send"));

    writer.addTASK("transactionMultisigService.sellMosaicTransactionBonded");
    await transactionMultisigService
        .sellMosaicTransactionBonded(
            buyerMultisigPublicKey,
            cosignatoryPrivateKey,
            sellerPublicKey,
            mosaicAmount,
            costCurrency,
            mosaicId,
            message,
            writer,
            medianFeeMultiplier
        ).then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

/**
 * @swagger
 * /selling/sellMosaicRoyalties:
 *   post:
 *     summary: Executes the sale process of the mosaic between two multisig accounts
 *     description: |
 *       Mosaic (NFT) is transferred from seller account to buyer |
 *       and currency is sent from buyer to seller. |
 *       A percentage of NFT price is sent to each of the royalty recipients. |
 *       Needs co-sign for confirmation.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buyerMultisigPublicKey:
 *                 type: string
 *                 description: Public key of the buyer (initiator of the transaction) multisig account.
 *                 example: 3D3B2280534A6A3226387A7DC3F14A8BE48679A7338EF1F21C238DD414D76141
 *               cosignatoryPrivateKey:
 *                 type: string
 *                 description: Private key of one of the cosignatories from the buyer account
 *                 example: E65D7C8B60CD8E81A0C93FF027CA35E4AE6DA19B6F4A41C73A9FC9B93E1D9258
 *               sellerPublicKey:
 *                 type: string
 *                 description: Public key of the current mosaic holder (seller).
 *                 example: 533DDB6BCE1BC554FC40A45E7C3BF5B6F3A1A5E75147AF779844612B5EBA3757
 *               mosaicAmount:
 *                 type: integer
 *                 description: Mosaic amount to sell.
 *                 example: 4
 *               costCurrency:
 *                 type: integer
 *                 description: Cost of the mosaic that is bought.
 *                 example: 1000
 *               royalties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   description: Accounts to receive royalites.
 *                   properties:
 *                     address:
 *                       type: string
 *                       description: Recipient address.
 *                       example: TCRGFWR5FBGK2YEKPXJYX7N26FBSGNXFNEE6RBY
 *                     percentage:
 *                       type: number
 *                       description: Percentage of NFT price to send.
 *                       example: 5
 *               mosaicId:
 *                 type: string
 *                 description: Id of the mosaic to be sold.
 *                 example: 129739805D21ECBF
 *               message:
 *                 type: string
 *                 description: Message to attach to the selling transaction.
 *                 example: Selling a painting.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                   description: Hash of the transaction
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 *                 group:
 *                   type: string
 *                   description: Transaction group.
 *                   example: partial
 *                 status:
 *                   type: string
 *                   description: Transaction status.
 *                   example: Success
 *                 cosignHash:
 *                   type: string
 *                   description: Hash of transaction for the buyer to cosign
 *                   example: 5562834C4910EAD0C981BAFDB0EBC010938F1CAC5B5B5FC461DB3FFBF63E25AF
 */
 router.put("/sellMosaicTransactionRoyalties", async (req: Request, res: Response) => {
    const buyerMultisigPublicKey = req.body.buyerMultisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const sellerPublicKey = req.body.sellerPublicKey;
    const mosaicAmount = req.body.mosaicAmount;
    const costCurrency = req.body.costCurrency;
    const royalties = req.body.royalties;
    const mosaicId = req.body.mosaicId;
    const message = req.body.message;
    const length = Object.keys(req.body).length;

    if (!req.body.buyerMultisigPublicKey) return res.status(400).send({ status: "failed", message: "buyerMultisigPublicKey is required" });
    if (!req.body.cosignatoryPrivateKey) return res.status(400).send({ status: "failed", message: "cosignatoryPrivateKey is required" });
    if (!req.body.sellerPublicKey) return res.status(400).send({ status: "failed", message: "sellerPublicKey is required" });
    if (!req.body.mosaicAmount) return res.status(400).send({ status: "failed", message: "mosaicAmount is required" });
    if (!req.body.costCurrency) return res.status(400).send({ status: "failed", message: "costCurrency is required" });
    if (!req.body.royalties) return res.status(400).send({ status: "failed", message: "royalties is required" });
    if (!req.body.mosaicId) return res.status(400).send({ status: "failed", message: "mosaicId is required" });
    if (!req.body.message) return res.status(400).send({ status: "failed", message: "message is required" });
    if (length !== 8) return res.status(400).send({ status: "failed", message: "too many or too little parameters" });

    const writer = new Writer();
    writer.createStream(generator.makeLog("send"));

    writer.addTASK("transactionService.sellMosaicTransactionRoyalties");

    await transactionMultisigService
        .sellMosaicTransactionRoyalties(
            buyerMultisigPublicKey,
            cosignatoryPrivateKey,
            sellerPublicKey,
            mosaicAmount,
            costCurrency,
            royalties,
            mosaicId,
            message,
            writer
        ).then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

export default router;

