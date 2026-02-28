import { Router } from "express";
//
// import Blockchain from "./endpoints/coartSpec/blockchain"
// import Account from "./endpoints/account";
// import Mosaic from "./endpoints/mosaic";
// import Namespace from "./endpoints/namespace";
// import Transaction from "./endpoints/coartSpec/transaction";
// import Timestamp from "./endpoints/timestamp";
// import Nip13 from "./endpoints/nip13";
// import Restriction from "./endpoints/restriction";
import Metadata from "./endpoints/metadata";
//
// import CreateMultisig from "./endpoints/multisig/createMultisig";
// import GetMultisigService from "./endpoints/multisig/getMultisigService";
// import ModifyMultisig from "./endpoints/multisig/modifyMultisig";
// import MosaicMultisig from "./endpoints/multisig/mosaicMultisig";
// import NamespaceMultisig from "./endpoints/multisig/namespaceMultisig";
// import TimestampMultisig from "./endpoints/multisig/timestampMultisig";
// import TransactionMultisig from "./endpoints/multisig/transactionMultisig";
//
// import Scripts from "./endpoints/scripts";
//
// import CreateMultisigTemplate from "./endpoints/templates/createMultisig"
// import MosaicTemplate from "./endpoints/templates/mosaicTemplate"
//



import Blockchain from "./endpoints/coartSpec/blockchain"
import Account from "./endpoints/coartSpec/account";
import Transaction from "./endpoints/coartSpec/transaction";
import TransactionMultisig from "./endpoints/multisig/transactionMultisig";
import Multisig from "./endpoints/coartSpec/multisig";
import NFT from "./endpoints/coartSpec/NFT";
import Selling from "./endpoints/coartSpec/Selling";


import KeyGenerator from "./endpoints/hd-wallets/keyGenerator";
import WalletCreator from "./endpoints/hd-wallets/walletCreator";
import HdAccounts from "./endpoints/hd-wallets/hdAccounts";

const router = Router();

/**
 * Endpoint roots
 */

// COART specific endpoints
router.use("/blockchain", Blockchain)
router.use("/account", Account);
router.use("/transaction", Transaction);
router.use("/transactionMultisig", TransactionMultisig);
router.use("/multisig", Multisig);
router.use("/nft", NFT);

router.use("/hd-wallets/generate", KeyGenerator);
router.use("/hd-wallets/create", WalletCreator);
router.use("/hd-wallets/hdAccounts", HdAccounts);

router.use("/selling", Selling);

// router.use("/blockchain", Blockchain)
// router.use("/account", Account);
// router.use("/namespace", Namespace);
// router.use("/mosaic", Mosaic);
// router.use("/transaction", Transaction);
// router.use("/timestamp", Timestamp);
// router.use("/nip13", Nip13);
// router.use("/restriction", Restriction);
router.use("/metadata", Metadata);

/*router.use("/multisig/create", CreateMultisig);
router.use("/multisig/get", GetMultisigService);
router.use("/multisig/modify", ModifyMultisig);
router.use("/multisig/mosaic", MosaicMultisig);
router.use("/multisig/namespace", NamespaceMultisig);
router.use("/multisig/timestamp", TimestampMultisig);
router.use("/multisig/transaction", TransactionMultisig);*/

// router.use("/scripts", Scripts);

/*router.use("/templates/createMultisig", CreateMultisigTemplate);
router.use("/templates/mosaic", MosaicTemplate);*/

export default router;