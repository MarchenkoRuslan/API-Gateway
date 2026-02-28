import express = require("express");
import { Request, Response } from "express";
import { modifyMultisigService } from "../../../services/symbol-sdk/multisig/modifyMultisigService";
import { generator } from '../../../helpers/generator';
import { Writer } from '../../../helpers/writer';

const router = express.Router();

/**
 * Endpoint: Modifying A Multisig Account Complete
 */
router.put("/complete", (req: Request, res: Response) => {
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const multisigAccountPublicKey = req.body.multisigAccountPublicKey;
    const approval = req.body.approval;
    const removal = req.body.removal;
    let newCosignatoryPublicKey = req.body.newCosignatoryPublicKey;
    let cosignatoryToRemovePublicKey = req.body.cosignatoryToRemovePublicKey;
    const length = Object.keys(req.body).length;

    if (!req.body.cosignatoryPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'cosignatoryPrivateKey is required',
        });
    }
    if (!req.body.multisigAccountPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigAccountPublicKey is required',
        });
    }
    if (!req.body.approval) {
        return res.status(400).send({
            status: 'failed',
            message: 'approval is required',
        });
    }
    if (!req.body.removal) {
        return res.status(400).send({
            status: 'failed',
            message: 'removal is required',
        });
    }
    if (!req.body.newCosignatoryPublicKey) {
        if (req.body.newCosignatoryPublicKey === "0" || req.body.newCosignatoryPublicKey === "") {
            newCosignatoryPublicKey = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'newCosignatoryPublicKey is required',
            });
        }
    }
    if (!req.body.cosignatoryToRemovePublicKey) {
        if (req.body.cosignatoryToRemovePublicKey === "0" || req.body.cosignatoryToRemovePublicKey === "") {
            cosignatoryToRemovePublicKey = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'cosignatoryToRemovePublicKey is required',
            });
        }
    }
    else if (length !== 6) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        })
    }
    const writer = new Writer();
    writer.createStream(generator.makeLog());

    writer.addTASK("modifyMultisigService.modifyMultisigComplete");
    modifyMultisigService.modifyMultisigComplete(multisigAccountPublicKey, cosignatoryPrivateKey, approval, removal, newCosignatoryPublicKey, cosignatoryToRemovePublicKey, writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));

});

/**
 * Endpoint: Modifying A Multisig Account Bonded
 */
router.put("/bonded", (req: Request, res: Response) => {
    const cosignatoryPrivateKey = req.body.cosignatoryPrivateKey;
    const multisigAccountPublicKey = req.body.multisigAccountPublicKey;
    const approval = req.body.approval;
    const removal = req.body.removal;
    let newCosignatoryPublicKey = req.body.newCosignatoryPublicKey;
    let cosignatoryToRemovePublicKey = req.body.cosignatoryToRemovePublicKey;
    const length = Object.keys(req.body).length;

    if (!req.body.cosignatoryPrivateKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'cosignatoryPrivateKey is required',
        });
    }
    if (!req.body.multisigAccountPublicKey) {
        return res.status(400).send({
            status: 'failed',
            message: 'multisigAccountPublicKey is required',
        });
    }
    if (!req.body.approval) {
        return res.status(400).send({
            status: 'failed',
            message: 'approval is required',
        });
    }
    if (!req.body.removal) {
        return res.status(400).send({
            status: 'failed',
            message: 'removal is required',
        });
    }
    if (!req.body.newCosignatoryPublicKey) {
        if (req.body.newCosignatoryPublicKey === 0 || req.body.newCosignatoryPublicKey === "") {
            newCosignatoryPublicKey = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'newCosignatoryPublicKey is required',
            });
        }
    }
    if (!req.body.cosignatoryToRemovePublicKey) {
        if (req.body.cosignatoryToRemovePublicKey === 0 || req.body.cosignatoryToRemovePublicKey === "") {
            cosignatoryToRemovePublicKey = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'cosignatoryToRemovePublicKey is required',
            });
        }
    }
    else if (length !== 6) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        })
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog());
    writer.addTASK("modifyMultisigService.modifyMultisiglBonded");
    modifyMultisigService.modifyMultisigBonded(multisigAccountPublicKey, cosignatoryPrivateKey, approval, removal, newCosignatoryPublicKey, cosignatoryToRemovePublicKey, writer)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));
});

export default router;