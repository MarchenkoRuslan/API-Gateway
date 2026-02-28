import express = require("express");
import { Request, Response } from "express";
import { getMultisigService } from "../../../services/symbol-sdk/multisig/getMultisigService";

const router = express.Router();

/**
 * Endpoint: get multisig account inforamtion
 */
router.get("/getInfo", (req: Request, res: Response) => {
    const address = req.body.address;
    const length = Object.keys(req.body).length;

    if (!req.body.address) {
        return res.status(400).send({
            status: 'failed',
            message: 'address is required',
        });
    }
    else if (length !== 1) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        })
    }

    getMultisigService.getMultisigInfo(address)
        .then((result) => res.json(result))
        .catch((err) => res.status(400).send({
            status: "failed",
            error: `An Unexpected Error Occurred: ` + err.message
        }));

});

export default router;