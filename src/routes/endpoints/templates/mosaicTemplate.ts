import express = require("express");
import { Request, Response } from "express";
import { Writer } from '../../../helpers/writer';
import {generator} from "../../../helpers/generator";
import { transactionService } from "../../../services/symbol-sdk/transactionService";
import { Constants } from '../../../helpers/constants';
import {namespaceService} from "../../../services/symbol-sdk/namespaceService";
import {mosaicService} from "../../../services/symbol-sdk/mosaicService";
import {metadataService} from "../../../services/symbol-sdk/metadataService";

const networkName = Constants.NETWORK_IDENTIFIER;


const router = express.Router();

/**
 * Endpoint: create mosaic without namespace, attach metadata to it and send it to a user
 */
router.post("/createAndSendWithMetadata/withoutNamespace", (req: Request, res: Response) => {
    const privateKey = req.body.privateKey;
    const amount = req.body.amount;
    const divisibility = req.body.divisibility;
    const duration = req.body.duration;
    const metadata = req.body.metadata; // an array of objects with metadata keys and values
    const recipientAddress = req.body.recipientAddress;
    const length = Object.keys(req.body).length;

    if (!req.body.privateKey) {
        return res.status(400).send({
            status: "failed",
            message: "privateKey is required"
        });
    }
    if (!req.body.metadata || !Array.isArray(req.body.metadata)) {
        return res.status(400).send({
            status: "failed",
            message: "metadata is required (format: [{key, value}, {key, value}])"
        });
    }
    if (!req.body.amount) {
        return res.status(400).send({
            status: "failed",
            message: "amount is required"
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
    writer.createStream(generator.makeLog("MosaicTemplate.createAndSendWithMetadata.withoutNamespace"));
    writer.addTASK("mosaicService.createMosaicBonded");
    mosaicService
        .createMosaicBondedWithoutNamespace(privateKey, amount, divisibility, duration, writer)
        .then(async mosaic => {
            writer.addTASK("Wait for transaction to get confirmed.");
            let transactionStatus: string = "";
            while (transactionStatus !== "confirmed"){
                await transactionService.getTransactionStatus(mosaic.cosignHash).then((status: any) => {
                    transactionStatus = status.group
                }).catch(err =>
                    res.status(400).send({
                        status: "failed",
                        error: `An Unexpected Error Occurred: ` + err.message
                    })
                );;
            }
            writer.addText("Transaction has been confirmed.");

            writer.addTASK("Get mosaic ID from transaction's confirmed information.");
            transactionService.getConfirmedTransactionInfo(mosaic.cosignHash).then((info: any) => {
                const mosaicId = info.transaction.transactions[0].transaction.id

                writer.addTASK("metadataService.assignMetadataToMosaicBonded");
                metadata.forEach((metaPiece: any)=> {
                    metadataService.assignMetadataToMosaicBonded(
                        privateKey,
                        mosaicId,
                        metaPiece.key,
                        metaPiece.value,
                        writer
                    ).then(async ({hash}) => {
                        writer.addTASK("Wait for transaction to get confirmed.");
                        let metadataTransactionStatus: string = "";
                        while (metadataTransactionStatus !== "confirmed") {
                            await transactionService.getTransactionStatus(hash).then((status: any) => {
                                metadataTransactionStatus = status.group
                            });
                        }
                    }).catch(err =>
                        res.status(400).send({
                            status: "failed",
                            error: `An Unexpected Error Occurred: ` + err.message
                        })
                    );;
                });
                    writer.addTASK("transactionService.sendMosaic");
                    transactionService
                        .sendTransactionMosaic(
                            privateKey,
                            recipientAddress,
                            amount,
                            mosaicId,
                            "mosaic is sent",
                            writer
                        )
                        .then(async ({hash}) => {
                            writer.addTASK("Wait for transaction to get confirmed.");
                            let sendTransactionStatus: string = "";
                            while (sendTransactionStatus !== "confirmed") {
                                await transactionService.getTransactionStatus(hash).then((status: any) => {
                                    sendTransactionStatus = status.group
                                }).catch(err =>
                                    res.status(400).send({
                                        status: "failed",
                                        error: `An Unexpected Error Occurred: ` + err.message
                                    })
                                );
                            }
                            transactionService.getTransactionStatus(hash).then((status: any) => {
                                res.json({
                                    group: status.group,
                                    code: status.code,
                                    lastTransactionHash: status.hash,
                                    mosaicId
                                });
                            }).catch(err =>
                                res.status(400).send({
                                    status: "failed",
                                    error: `An Unexpected Error Occurred: ` + err.message
                                })
                            );
                        })
                        .catch(err =>
                            res.status(400).send({
                                status: "failed",
                                error: `An Unexpected Error Occurred: ` + err.message
                            })
                        );
                    })
                    .catch((err) =>
                        res.status(400).send({
                            status: "failed",
                            error: `An Unexpected Error Occurred: ` + err.message
                        }));
         })
         .catch(err =>
             res.status(400).send({
                 status: "failed",
                 error: `An Unexpected Error Occurred: ` + err.message
             }));
});

router.post("/createAndSendWithMetadata/withNamespace", async (req: Request, res: Response) => {
    const privateKey = req.body.privateKey;
    const amount = req.body.amount;
    const divisibility = req.body.divisibility;
    const duration = req.body.duration;
    const metadata = req.body.metadata; // an array of objects with metadata keys and values
    const namespace = req.body.namespace;
    const subnamespace = req.body.subnamespace;
    const recipientAddress = req.body.recipientAddress;
    const length = Object.keys(req.body).length;

    if (!req.body.privateKey) {
        return res.status(400).send({
            status: "failed",
            message: "privateKey is required"
        });
    }
    if (!req.body.metadata || !Array.isArray(req.body.metadata)) {
        return res.status(400).send({
            status: "failed",
            message: "metadata is required (format: [{key, value}, {key, value}])"
        });
    }
    if (!req.body.amount) {
        return res.status(400).send({
            status: "failed",
            message: "amount is required"
        });
    }
    if (!req.body.namespace || req.body.namespace==="") {
        return res.status(400).send({
            status: "failed",
            message: "namespace is required (format: namespace.subnamespace)"
        });
    }
    if (!req.body.subnamespace) {
        return res.status(400).send({
            status: "failed",
            message: "subnamespace is required (format: namespace.subnamespace)"
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
    } else if (length !== 8) {
        return res.status(400).send({
            status: "failed",
            message: "too much parameters"
        });
    }

    const writer = new Writer();
    writer.createStream(generator.makeLog("MosaicTemplate.createAndSendWithMetadata.withNamespace"));
   // writer.addTASK("namespaceService.createNamespace");

    // TODO: finish the namespace part of the function
    // patikrinti ar yra toks namespace, jei nera - sukurti
    // sukurti subnamespace jei jis nera tuscias
    await namespaceService.getNamespaceInfo(namespace).then(r => {
        if (subnamespace.trim()!==""){
            writer.addTASK("namespaceService.createSubNamespace");
            namespaceService.createSubNamespace(privateKey, namespace.toLowerCase(), subnamespace.toLowerCase(), writer)
                .then(async subTransaction => {
                    writer.addTASK("Wait for transaction to get confirmed.");
                    let subNamespaceTransactionStatus: string = "";
                    while (subNamespaceTransactionStatus !== "confirmed") {
                        await transactionService.getTransactionStatus(subTransaction.hash).then((status: any) => {
                            subNamespaceTransactionStatus = status.group
                        }).catch(e =>
                            res.status(400).send({
                                status: "failed",
                                error: `An Unexpected Error Occurred: ` + e.message
                            })
                        );
                    }
                })
                .catch(e =>
                    res.status(400).send({
                        status: "failed",
                        error: `An Unexpected Error Occurred: ` + e.message
                    })
                );
        }
    }).catch(err => {
        writer.addTASK("namespaceService.createNamespace");
        namespaceService.createNamespace(privateKey, namespace, duration, writer).then(async (namespaceTransaction) => {
            writer.addTASK("Wait for transaction to get confirmed.");
            let namespaceTransactionStatus: string = "";
            while (namespaceTransactionStatus !== "confirmed") {
                await transactionService.getTransactionStatus(namespaceTransaction.hash).then((status: any) => {
                    namespaceTransactionStatus = status.group
                }).catch(e =>
                    res.status(400).send({
                        status: "failed",
                        error: `An Unexpected Error Occurred: ` + e.message
                    })
                );
            }
            if (subnamespace.trim()!==""){
                writer.addTASK("namespaceService.createSubNamespace");
                namespaceService.createSubNamespace(privateKey, namespace.toLowerCase(), subnamespace.toLowerCase(), writer)
                    .then(async subTransaction => {
                        writer.addTASK("Wait for transaction to get confirmed.");
                        let subNamespaceTransactionStatus: string = "";
                        while (subNamespaceTransactionStatus !== "confirmed") {
                            await transactionService.getTransactionStatus(subTransaction.hash).then((status: any) => {
                                subNamespaceTransactionStatus = status.group
                            }).catch(e =>
                                res.status(400).send({
                                    status: "failed",
                                    error: `An Unexpected Error Occurred: ` + e.message
                                })
                            );
                        }
                    })
                    .catch(e =>
                        res.status(400).send({
                            status: "failed",
                            error: `An Unexpected Error Occurred: ` + e.message
                        })
                    );
            }
        }).catch(e =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + e.message
            })
        );
    });

    const namespaceString = namespace + "." + subnamespace;
    writer.addTASK("mosaicService.createMosaicBonded");
    mosaicService
        .createMosaicBonded(privateKey, namespaceString, amount, divisibility, duration, writer)
        .then(async mosaic => {
            writer.addTASK("Wait for transaction to get confirmed.");
            let transactionStatus: string = "";
            while (transactionStatus !== "confirmed"){
                await transactionService.getTransactionStatus(mosaic.cosignHash).then((status: any) => {
                    transactionStatus = status.group
                });
            }
            writer.addText("Transaction has been confirmed.");

            writer.addTASK("Get mosaic ID from transaction's confirmed information.");
            transactionService.getConfirmedTransactionInfo(mosaic.cosignHash).then((info: any) => {
                const mosaicId = info.transaction.transactions[0].transaction.id

                writer.addTASK("metadataService.assignMetadataToMosaicBonded");
                metadata.forEach((metaPiece: any)=> {
                    metadataService.assignMetadataToMosaicBonded(
                        privateKey,
                        mosaicId,
                        metaPiece.key,
                        metaPiece.value,
                        writer
                    ).then(async ({hash}) => {
                        writer.addTASK("Wait for transaction to get confirmed.");
                        let metadataTransactionStatus: string = "";
                        while (metadataTransactionStatus !== "confirmed") {
                            await transactionService.getTransactionStatus(hash).then((status: any) => {
                                metadataTransactionStatus = status.group
                            }).catch(err =>
                                res.status(400).send({
                                    status: "failed",
                                    error: `An Unexpected Error Occurred: ` + err.message
                                })
                            );
                        }
                    });
                });
                writer.addTASK("transactionService.sendMosaic");
                transactionService
                    .sendTransactionMosaic(
                        privateKey,
                        recipientAddress,
                        amount,
                        mosaicId,
                        "mosaic is sent",
                        writer
                    )
                    .then(async ({hash}) => {
                        writer.addTASK("Wait for transaction to get confirmed.");
                        let sendTransactionStatus: string = "";
                        while (sendTransactionStatus !== "confirmed") {
                            await transactionService.getTransactionStatus(hash).then((status: any) => {
                                sendTransactionStatus = status.group
                            }).catch(err =>
                                res.status(400).send({
                                    status: "failed",
                                    error: `An Unexpected Error Occurred: ` + err.message
                                })
                            );
                        }
                        transactionService.getTransactionStatus(hash).then((status: any) => {
                            res.json({
                                group: status.group,
                                code: status.code,
                                lastTransactionHash: status.hash,
                                mosaicId
                            });
                        }).catch(err =>
                            res.status(400).send({
                                status: "failed",
                                error: `An Unexpected Error Occurred: ` + err.message
                            })
                        );
                    })
                    .catch(err =>
                        res.status(400).send({
                            status: "failed",
                            error: `An Unexpected Error Occurred: ` + err.message
                        })
                    );
            })
                .catch((err) =>
                    res.status(400).send({
                        status: "failed",
                        error: `An Unexpected Error Occurred: ` + err.message
                    }));
        })
        .catch(err =>
            res.status(400).send({
                status: "failed",
                error: `An Unexpected Error Occurred: ` + err.message
            }));
});

export default router;