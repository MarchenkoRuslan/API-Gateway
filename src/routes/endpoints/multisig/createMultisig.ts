import express = require("express");
import { Request, Response } from "express";
import { createMultisigService } from "../../../services/symbol-sdk/multisig/createMultisigService";
import { generator } from '../../../helpers/generator';
import { Writer } from '../../../helpers/writer';
import { Constants } from '../../../helpers/constants';
import { Account } from "symbol-sdk";
import { blockchainService } from "../../../services/symbol-sdk/blockchainService";

const networkName = Constants.NETWORK_IDENTIFIER;

const router = express.Router();

/**
 * Endpoint: convert account to multisig account
 */
router.put("/convertToMultisig", async (req: Request, res: Response) => {
  const multisigPrivateKey = req.body.multisigPrivateKey;
  const cosignatoriesPrivateKeysList = req.body.cosignatoriesPrivateKeysList;
  const minApproval = req.body.minApproval;
  const minRemoval = req.body.minRemoval;
  const length = Object.keys(req.body).length

  if (!req.body.multisigPrivateKey) {
    return res.status(400).send({
      status: 'failed',
      message: 'multisigPrivateKey is required',
    });
  }
  if (!req.body.cosignatoriesPrivateKeysList) {
    return res.status(400).send({
      status: 'failed',
      message: 'cosignatoriesPrivateKeysList is required',
    });
  }
  if (!req.body.minApproval) {
    return res.status(400).send({
      status: 'failed',
      message: 'minApproval is required',
    });
  }
  if (!req.body.minRemoval) {
    return res.status(400).send({
      status: 'failed',
      message: 'minRemoval is required',
    });
  }
  else if (length !== 4) {
    return res.status(400).send({
      status: 'failed',
      message: 'too much parameters',
    })
  }
  const writer = new Writer();
  writer.createStream(generator.makeLog());

  writer.addTASK("createMultisigService.convertToMultisig");
  try {
    const medianFeeMultiplier = await blockchainService.getMedianFeeMultiplier();
    const multisigAccount = Account.createFromPrivateKey(multisigPrivateKey, networkName);
    const cosignatoriesList: Account[] = [];
    for (let id = 0; id < Object.keys(req.body.cosignatoriesPrivateKeysList).length; id++) {
      cosignatoriesList.push(Account.createFromPrivateKey(cosignatoriesPrivateKeysList[id], networkName));
    }
    createMultisigService.convertToMultisig(multisigAccount, cosignatoriesList, minApproval, minRemoval, writer, medianFeeMultiplier)
      .then((result) => res.json(result))
      .catch((err) => res.json({
        status: "failed",
        error: `An Unexpected Error Occurred: ` + err.message
      }));
  } catch (error) {
    writer.addERROR(error.message);
    res.status(400).send({
      status: "failed",
      error: `An Unexpected Error Occurred: ` + error.message
    })
  }

});

export default router;