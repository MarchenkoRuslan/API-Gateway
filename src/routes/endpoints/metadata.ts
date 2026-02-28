import express = require("express");
import { Request, Response } from "express";
import { metadataService } from "../../services/symbol-sdk/metadataService";
import { generator } from "../../helpers/generator";
import { Writer } from "../../helpers/writer";

const router = express.Router();

/**
 * Endpoint: assign Metadata to Account
 */
router.post("/assignMetadataToAccount", (req: Request, res: Response) => {
    const signerPrivateKey = req.body.signerPrivateKey;
    const accountPublicKey = req.body.accountPublicKey;
    const key = req.body.key;
    const value = req.body.value;
    const length = Object.keys(req.body).length

    if (!req.body.signerPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'signerPrivateKey is required',
        });
    }
    if (!req.body.accountPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'accountPublicKey is required',
        });
    }
    if (!req.body.key) {
        return res.status(400).send({
            status: 'failed',
            message: 'key is required',
        });
    }
    if (!req.body.value) {
        return res.status(400).send({
            status: 'failed',
            message: 'value is required',
        });
    }
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    const writer = new Writer();
    writer.createStream(generator.makeLog("metadata"));

    writer.addTASK("metadataService.assignMetadataToAccount");

    metadataService.assignMetadataToAccount(
        signerPrivateKey,
        accountPublicKey,
        key,
        value,
        writer
    )
        .then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

/**
 * Endpoint: update Metadata in Account
 */
router.post("/updateMetadataInAccount", (req: Request, res: Response) => {
    const signerPrivateKey = req.body.signerPrivateKey;
    const accountPublicKey = req.body.accountPublicKey;
    const key = req.body.key;
    const value = req.body.value;
    const length = Object.keys(req.body).length

    if (!req.body.signerPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'signerPrivateKey is required',
        });
    }
    if (!req.body.accountPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'accountPublicKey is required',
        });
    }
    if (!req.body.key) {
        return res.status(400).send({
            status: 'failed',
            message: 'key is required',
        });
    }
    if (!req.body.value) {
        return res.status(400).send({
            status: 'failed',
            message: 'value is required',
        });
    }
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    const writer = new Writer();
    writer.createStream(generator.makeLog("metadata"));

    writer.addTASK("metadataService.updateMetadataInAccount");

    metadataService.updateMetadataInAccount(
        signerPrivateKey,
        accountPublicKey,
        key,
        value,
        writer
    )
        .then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

/**
 * Endpoint: get Metadata assigned to Account
 */
router.get("/getMetadataAccount", (req: Request, res: Response) => {
    const accountAddress = req.body.accountAddress;
    const length = Object.keys(req.body).length

    if (!req.body.accountAddress) {
        return res.status(400).send({
            status: 'failed',
            message: 'accountAddress is required',
        });
    }
    else if (length !== 1) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    metadataService.getMetadataAccount(
        accountAddress
    )
        .then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});


/**
 * Endpoint: assign Metadata to Mosaic
 */
router.post("/assignMetadataToMosaic", (req: Request, res: Response) => {
    const signerPrivateKey = req.body.signerPrivateKey;
    const mosaicIdHex = req.body.mosaicIdHex;
    const key = req.body.key;
    const value = req.body.value;
    const length = Object.keys(req.body).length

    if (!req.body.signerPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'signerPrivateKey is required',
        });
    }
    if (!req.body.mosaicIdHex) {
        return res.status(400).send({
            status: 'failed',
            message: 'mosaicIdHex is required',
        });
    }
    if (!req.body.key) {
        return res.status(400).send({
            status: 'failed',
            message: 'key is required',
        });
    }
    if (!req.body.value) {
        return res.status(400).send({
            status: 'failed',
            message: 'value is required',
        });
    }
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    const writer = new Writer();
    writer.createStream(generator.makeLog("metadata"));

    writer.addTASK("metadataService.assignMetadataToMosaic");

    metadataService.assignMetadataToMosaic(
        signerPrivateKey,
        mosaicIdHex,
        key,
        value,
        writer
    )
        .then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

/**
 * Endpoint: assign Metadata to Mosaic Bonded
 */
router.post("/assignMetadataToMosaicBonded", (req: Request, res: Response) => {
    const signerPrivateKey = req.body.signerPrivateKey;
    const mosaicIdHex = req.body.mosaicIdHex;
    const key = req.body.key;
    const value = req.body.value;
    const length = Object.keys(req.body).length

    if (!req.body.signerPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'signerPrivateKey is required',
        });
    }
    if (!req.body.mosaicIdHex) {
        return res.status(400).send({
            status: 'failed',
            message: 'mosaicIdHex is required',
        });
    }
    if (!req.body.key) {
        return res.status(400).send({
            status: 'failed',
            message: 'key is required',
        });
    }
    if (!req.body.value) {
        return res.status(400).send({
            status: 'failed',
            message: 'value is required',
        });
    }
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    const writer = new Writer();
    writer.createStream(generator.makeLog("metadata"));

    writer.addTASK("metadataService.assignMetadataToMosaicBonded");

    metadataService.assignMetadataToMosaicBonded(
        signerPrivateKey,
        mosaicIdHex,
        key,
        value,
        writer
    )
        .then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

/**
 * Endpoint: assign Metadata to Mosaic Bonded
 */
router.post("/assignMetadataToMosaicMultisig", (req: Request, res: Response) => {
    const multisigPublicKey = req.body.multisigPublicKey;
    const signerPrivateKey = req.body.signerPrivateKey;
    const mosaicIdHex = req.body.mosaicIdHex;
    const key = req.body.key;
    const value = req.body.value;
    const length = Object.keys(req.body).length

    if (!req.body.multisigPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigPublicKey is required',
        });
    }
    if (!req.body.signerPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'signerPrivateKey is required',
        });
    }
    if (!req.body.mosaicIdHex) {
        return res.status(400).send({
            status: 'failed',
            message: 'mosaicIdHex is required',
        });
    }
    if (!req.body.key) {
        return res.status(400).send({
            status: 'failed',
            message: 'key is required',
        });
    }
    if (!req.body.value) {
        return res.status(400).send({
            status: 'failed',
            message: 'value is required',
        });
    }
    else if (length !== 5) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    const writer = new Writer();
    writer.createStream(generator.makeLog("metadata"));

    writer.addTASK("metadataService.assignMetadataToMosaicBonded");

    metadataService.assignMetadataToMosaicBondedMultisig(
        multisigPublicKey,
        signerPrivateKey,
        mosaicIdHex,
        key,
        value,
        writer
    )
        .then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});
/**
 * Endpoint: get Metadata assigned to Mosaic
 */
router.get("/getMetadataMosaic", (req: Request, res: Response) => {
    const mosaicIdHex = req.body.mosaicIdHex;
    const length = Object.keys(req.body).length

    if (!req.body.mosaicIdHex) {
        return res.status(400).send({
            status: 'failed',
            message: 'mosaicIdHex is required',
        });
    }
    else if (length !== 1) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    metadataService.getMetadataMosaic(
        mosaicIdHex
    )
        .then((result) => res.json(result))
        .catch((err) =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

export default router;