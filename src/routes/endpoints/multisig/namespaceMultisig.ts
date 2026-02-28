import express = require("express");
import { Request, Response } from "express";
import { namespaceMultisigService } from "../../../services/symbol-sdk/multisig/namespaceMultisigService";
import { generator } from '../../../helpers/generator';
import { Writer } from '../../../helpers/writer';

const router = express.Router();

/**
 * Endpoint: getAndCreate namespace with multisig
 */
router.post("/create", (req: Request, res: Response) => {

    const multisigPublicKey = req.body.multisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const namespaceName = req.body.namespaceName;
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
            message: 'namespaceName is required',
        });
    }
    if (!req.body.duration) {
        return res.status(400).send({
            status: 'failed',
            message: 'duration is required',
        });
    }
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog());

    writer.addTASK("namespaceMultisigService.createNamespace");
    namespaceMultisigService.createNamespace(multisigPublicKey, cosignatoryPrivateKey, namespaceName.toLowerCase(), duration, writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});

/**
 * Endpoint: Create Sub namespace with multisig
 */
router.post("/createSub", (req: Request, res: Response) => {

    const multisigPublicKey = req.body.multisigPublicKey;
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const rootNamespaceName = req.body.rootNamespaceName;
    const subNamespaceName = req.body.subNamespaceName;
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
    if (!req.body.rootNamespaceName) {
        return res.status(400).send({
            status: 'failed',
            message: 'rootNamespaceName is required',
        });
    }
    if (!req.body.subNamespaceName) {
        return res.status(400).send({
            status: 'failed',
            message: 'subNamespaceName is required',
        });
    }
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog());

    writer.addTASK("namespaceMultisigService.createSubNamespace");
    namespaceMultisigService.createSubNamespace(multisigPublicKey, cosignatoryPrivateKey, rootNamespaceName.toLowerCase(), subNamespaceName.toLowerCase(), writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});

export default router;