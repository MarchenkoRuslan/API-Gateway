import express = require("express");
import { Request, Response } from "express";
import { mosaicMultisigService } from "../../../services/symbol-sdk/multisig/mosaicMultisigService";
import { generator } from '../../../helpers/generator';
import { Writer } from '../../../helpers/writer';

const router = express.Router();

/**
 * Endpoint: create mosaic
 */
router.post("/create", (req: Request, res: Response) => {

    const multisigPublicKey = req.body.multisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const namespaceName = req.body.namespaceName;
    const amount = req.body.amount;
    const divisibility = req.body.divisibility;
    const duration = req.body.duration;
    const length = Object.keys(req.body).length

    if (!req.body.multisigPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigPublicKey is required',
        });
    }
    if (!req.body.cosignatoryPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'cosignatoryPrivateKey is required',
        });
    }
    if (!req.body.namespaceName) {
        return res.status(400).send({
            status: 'failed',
            message: 'namespaceName is required (format: namespace.subnamespace)',
        });
    }
    if (!req.body.amount) {
        return res.status(400).send({
            status: 'failed',
            message: 'amount is required',
        });
    }
    if (!req.body.divisibility) {
        return res.status(400).send({
            status: "failed",
            message: "divisibility is required"
        });
    }
    if (!req.body.duration) {
        return res.status(400).send({
            status: "failed",
            message: "duration is required"
        });
    } else if (length !== 6) {
        return res.status(400).send({
            status: "failed",
            message: "too much parameters"
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog());

    writer.addTASK("mosaicMultisigService.createMosaic");
    mosaicMultisigService.createMosaic(multisigPublicKey, cosignatoryPrivateKey, namespaceName.toLowerCase(), amount, divisibility, duration, writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});

/**
 * Endpoint: create mosaic
 */
router.post("/createWithoutNamespace", (req: Request, res: Response) => {

    const multisigPublicKey = req.body.multisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const amount = req.body.amount;
    const divisibility = req.body.divisibility;
    const duration = req.body.duration;
    const length = Object.keys(req.body).length

    if (!req.body.multisigPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigPublicKey is required',
        });
    }
    if (!req.body.cosignatoryPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'cosignatoryPrivateKey is required',
        });
    }
    if (!req.body.amount) {
        return res.status(400).send({
            status: 'failed',
            message: 'amount is required',
        });
    }
    if (!req.body.divisibility) {
        return res.status(400).send({
            status: "failed",
            message: "divisibility is required"
        });
    }
    if (!req.body.duration) {
        return res.status(400).send({
            status: "failed",
            message: "duration is required"
        });
    } else if (length !== 5) {
        return res.status(400).send({
            status: "failed",
            message: "too much parameters"
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog());

    writer.addTASK("mosaicMultisigService.createMosaicWithoutNamespace");
    mosaicMultisigService.createMosaicWithoutNamespace(multisigPublicKey, cosignatoryPrivateKey, amount, divisibility, duration, writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});

/**
 * Endpoint: increase supply with multisig
 */
router.put("/increase", (req: Request, res: Response) => {

    const multisigPublicKey = req.body.multisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const mosaicId = req.body.mosaicId;
    const amount = req.body.amount;
    const mosaicDivisibility = req.body.mosaicDivisibility;
    const length = Object.keys(req.body).length

    if (!req.body.multisigPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigPublicKey is required',
        });
    }
    if (!req.body.cosignatoryPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'cosignatoryPrivateKey is required',
        });
    }
    if (!req.body.mosaicId) {
        return res.status(400).send({
            status: 'failed',
            message: 'mosaicId is required',
        });
    }
    if (!req.body.amount) {
        return res.status(400).send({
            status: 'failed',
            message: 'amount is required',
        });
    }
    if (!req.body.mosaicDivisibility) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicDivisibility is required"
        });
    }
    else if (length !== 5) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog());

    writer.addTASK("mosaicMultisigService.increaseSupply");
    mosaicMultisigService.increaseSupply(multisigPublicKey, cosignatoryPrivateKey, mosaicId, amount, mosaicDivisibility, writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});

/**
 * Endpoint: decrease supply with multisig
 */
router.put("/decrease", (req: Request, res: Response) => {

    const multisigPublicKey = req.body.multisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const mosaicId = req.body.mosaicId;
    const amount = req.body.amount;
    const mosaicDivisibility = req.body.mosaicDivisibility;
    const length = Object.keys(req.body).length

    if (!req.body.multisigPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigPublicKey is required',
        });
    }
    if (!req.body.cosignatoryPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'cosignatoryPrivateKey is required',
        });
    }
    if (!req.body.mosaicId) {
        return res.status(400).send({
            status: 'failed',
            message: 'mosaicId is required',
        });
    }
    if (!req.body.amount) {
        return res.status(400).send({
            status: 'failed',
            message: 'amount is required',
        });
    }
    if (!req.body.mosaicDivisibility) {
        return res.status(400).send({
            status: "failed",
            message: "mosaicDivisibility is required"
        });
    }
    else if (length !== 5) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog());

    writer.addTASK("mosaicMultisigService.decreaseSupply");
    mosaicMultisigService.decreaseSupply(multisigPublicKey, cosignatoryPrivateKey, mosaicId, amount, mosaicDivisibility, writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});

export default router;