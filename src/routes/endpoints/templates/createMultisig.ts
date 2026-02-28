import express = require("express");
import {Request, Response} from "express";
import {Writer} from '../../../helpers/writer';
import {generator} from "../../../helpers/generator";
import {accountService} from "../../../services/symbol-sdk/accountService";
import {transactionService} from "../../../services/symbol-sdk/transactionService";
import {createMultisigService} from "../../../services/symbol-sdk/multisig/createMultisigService";
import {Account} from "symbol-sdk";
import {Constants} from '../../../helpers/constants';
import {transactionMultisigService} from "../../../services/symbol-sdk/multisig/transactionMultisigService";
import {getMultisigService} from "../../../services/symbol-sdk/multisig/getMultisigService";

const networkName = Constants.NETWORK_IDENTIFIER;


const router = express.Router();

/**
 * Endpoint: create multisig account from scratch
 * Creates a multisig account with provided number of cosignatories,
 * minimal approval number
 * and minimal removal number
 */

// router.post("/fromScratch", (req: Request, res: Response) => {
//     const coSignsNumber = Number(req.body.coSignsNumber);
//     const minApproval = req.body.minApproval;
//     const minRemoval = req.body.minRemoval;
//     const length = Object.keys(req.body).length

//     if (!req.body.coSignsNumber) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'coSignsNumber is required',
//         });
//     }
//     if (!req.body.minApproval) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'minApproval is required',
//         });
//     }
//     if (!req.body.minRemoval) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'minRemoval is required',
//         });
//     }
//     else if (length !== 3) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'too many parameters',
//         })
//     }
//     const writer = new Writer();
//     writer.createStream(generator.makeLog());

//     writer.addTASK("createMultisigTemplate.createFromScratch");
//     writer.addTASK("create " + coSignsNumber + " Accounts");
//         accountService.createAccounts(coSignsNumber+1)
//             .then((accounts: any[]) => {
//                 writer.addText("Accounts have been created.")
//                 writer.addTASK("Send currency to future multisig account.");
//                 // transaction may send less currency, or send 0, if the fees are deleted
//                 transactionService.sendTransactionWithMosaicId(Constants.NETWORK_NEMESIS_PRIVATE_KEY,
//                    accounts[0].address.address,
//                    Constants.NETWORK_MINIMUM_LOCK_AMOUNT,
//                    Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING,
//                    "Sending currency for future multisig",
//                    writer).then(async (transaction: any) => {
//                        writer.addText("Transaction has been sent.");
//                        await transactionService.waitForTransactionStatus(transaction.hash, "confirmed", writer);
//                        writer.addText("Transaction has been confirmed.");
//                        writer.addTASK("Connect accounts to multisig.");
//                        try {
//                            const multisigAccount = Account.createFromPrivateKey(accounts[0].privateKey, networkName);
//                            const cosignatoriesList: Account[] = [];
//                            for (let i = 1; i < accounts.length; i++) {
//                                await cosignatoriesList.push(Account.createFromPrivateKey(accounts[i].privateKey, networkName));
//                            }
//                            createMultisigService.convertToMultisig(multisigAccount, cosignatoriesList, minApproval, minRemoval, writer)
//                                .then(async (multisig) => {
//                                    await transactionService.waitForTransactionStatus(multisig.hash, "partial", writer);
//                                    writer.addText("Multisig has been formed.");
//                                    writer.addTASK("Cosign multisig creation transaction.");
//                                    for (const cosignatory of cosignatoriesList) {
//                                        await transactionMultisigService.coSignTransaction(cosignatory.privateKey, multisig.cosignHash, writer)
//                                            .catch((err) => res.status(400).send({
//                                                status: "failed",
//                                                error: `An Unexpected Error Occurred: ` + err.message
//                                            }));
//                                    }
//                                    writer.addText("Transaction has been cosigned.");
//                                    await transactionService.waitForTransactionStatus(multisig.hash, "confirmed", writer);
//                                    writer.addText("Transaction has been confirmed.");
//                                    writer.addTASK("Provide multisig information");
//                                    const cosignatoryAccounts: any[] = [];
//                                    cosignatoriesList.forEach((cosignatory) =>{
//                                        cosignatoryAccounts.push({
//                                            address: cosignatory.address,
//                                            privateKey: cosignatory.privateKey,
//                                            publicKey: cosignatory.publicKey
//                                        })
//                                    })
//                                    getMultisigService.getMultisigInfo(accounts[0].address.address)
//                                        .then(({version}) => res.json({
//                                            version,
//                                            account: accounts[0],
//                                            minApproval,
//                                            minRemoval,
//                                            cosignatoryAccounts
//                                        }))
//                                        .catch((err) => res.status(400).send({
//                                            status: "failed",
//                                            error: `Error occurred during multisig data retrieving: ` + err.message
//                                        }));
//                                })
//                                .catch((err) => res.json({
//                                    status: "failed",
//                                    error: `An Error occurred during multisig creation: ` + err.message
//                                }));
//                        } catch (error) {
//                            writer.addERROR(error.message);
//                            res.status(400).send({
//                                status: "failed",
//                                error: `An Unexpected Error Occurred: ` + error.message
//                            })
//                        }
//                    }).catch((err) => res.status(400).json({
//                    status: "failed",
//                    error: `An Unexpected Error Occurred During Send Transaction: ` + err.message
//                }));

//             }).then().catch((err) => res.status(400).json({
//                 status: "failed",
//                 error: `An Unexpected Error Occurred During Account Generation: ` + err.message
//             }));
// });


/**
 * Endpoint: create multisig account from provided cosignatories
 * Creates a multisig account with provided number of cosignatories adding them to multisig
 */

// router.post("/fromProvidedCosignatories", (req: Request, res: Response) => {
//     const cosignatoriesPrivateKeysList = req.body.cosignatoriesPrivateKeysList;
//     const minApproval = req.body.minApproval;
//     const minRemoval = req.body.minRemoval;
//     const length = Object.keys(req.body).length

//     if (!req.body.cosignatoriesPrivateKeysList) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'cosignatoriesPrivateKeysList is required',
//         });
//     }
//     if (!req.body.minApproval) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'minApproval is required',
//         });
//     }
//     if (!req.body.minRemoval) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'minRemoval is required',
//         });
//     }
//     else if (length !== 3) {
//         return res.status(400).send({
//             status: 'failed',
//             message: 'too many parameters',
//         })
//     }
//     const writer = new Writer();
//     writer.createStream(generator.makeLog());

//     writer.addTASK("createMultisigTemplate.createFromProvidedCosignatories");
//     writer.addTASK("create an account for multisig.");
//     accountService.createAccount("multisig")
//         .then((account: any) => {
//             writer.addText("Account has been created.")
//             writer.addTASK("Send currency to future multisig account.");
//             // transaction may send less currency, or send 0, if the fees are deleted
//             transactionService.sendTransactionWithMosaicId(Constants.NETWORK_NEMESIS_PRIVATE_KEY,
//                 account.address.address,
//                 Constants.NETWORK_MINIMUM_LOCK_AMOUNT,
//                 Constants.NETWORK_CURRENCY_MOSAIC_ID_STRING,
//                 "Sending currency for future multisig",
//                 writer).then(async (transaction: any) => {
//                 writer.addText("Transaction has been sent.");
//                 await transactionService.waitForTransactionStatus(transaction.hash, "confirmed", writer);
//                 writer.addText("Transaction has been confirmed.");
//                 writer.addTASK("Connect accounts to multisig.");
//                 try {
//                     const multisigAccount = Account.createFromPrivateKey(account.privateKey, networkName);
//                     const cosignatoriesList: Account[] = [];
//                     cosignatoriesPrivateKeysList.forEach(async (cosignatory: string) => {
//                         await cosignatoriesList.push(Account.createFromPrivateKey(cosignatory, networkName));
//                     });
//                     createMultisigService.convertToMultisig(multisigAccount, cosignatoriesList, minApproval, minRemoval, writer)
//                         .then(async (multisig: any) => {
//                             await transactionService.waitForTransactionStatus(multisig.hash, "partial", writer);
//                             writer.addText("Multisig has been formed.");
//                             writer.addTASK("Cosign multisig creation transaction.");
//                             for (const cosignatory of cosignatoriesList) {
//                                 await transactionMultisigService.coSignTransaction(cosignatory.privateKey, multisig.cosignHash, writer)
//                                     .catch((err) => res.status(400).send({
//                                         status: "failed",
//                                         error: `An Unexpected Error Occurred: ` + err.message
//                                     }));
//                             }
//                             writer.addText("Transaction has been cosigned.");
//                             await transactionService.waitForTransactionStatus(multisig.hash, "confirmed", writer);
//                             writer.addText("Transaction has been confirmed.");
//                             writer.addTASK("Provide multisig information");
//                             const cosignatoryAccounts: any[] = [];
//                             cosignatoriesList.forEach((cosignatory) =>{
//                                 cosignatoryAccounts.push({
//                                     address: cosignatory.address,
//                                     privateKey: cosignatory.privateKey,
//                                     publicKey: cosignatory.publicKey
//                                 })
//                             })
//                             getMultisigService.getMultisigInfo(account.address.address)
//                                 .then(({version}) => res.json({
//                                     version,
//                                     account,
//                                     minApproval,
//                                     minRemoval,
//                                     cosignatoryAccounts
//                                 }))
//                                 .catch((err) => res.status(400).send({
//                                     status: "failed",
//                                     error: `Error occurred during multisig data retrieving: ` + err.message
//                                 }));
//                         })
//                         .catch((err) => res.json({
//                             status: "failed",
//                             error: `An Error occurred during multisig creation: ` + err.message
//                         }));
//                 } catch (error) {
//                     writer.addERROR(error.message);
//                     res.status(400).send({
//                         status: "failed",
//                         error: `An Unexpected Error Occurred: ` + error.message
//                     })
//                 }
//             }).catch((err) => res.status(400).json({
//                 status: "failed",
//                 error: `An Unexpected Error Occurred During Send Transaction: ` + err.message
//             }));

//         }).catch((err) => res.status(400).json({
//         status: "failed",
//         error: `An Unexpected Error Occurred During Account Generation: ` + err.message
//     }));
// });

export default router;