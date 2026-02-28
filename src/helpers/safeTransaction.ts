import {
    Transaction
} from "symbol-sdk";

/**
 * Class to create safe transaction after confirmation in blockchain
 */
export class SafeTransaction {

    /**
     * 
     * @param block Current blockchain height
     * @param transaction Transaction to check
     */
    constructor(public readonly block: number, public readonly transaction?: Transaction) { }

    /**
     * @returns The difference between current height and when transaction was announced
     */
    public amountOfBlocksAfterBeingIncluded(): number {
        return this.block - this.transaction.transactionInfo.height.compact();
    }

    /**
     * @returns Safety of the transaction by checking how long is it confirmed
     */
    public transactionSafety(): TransactionSafety {

        let amountOfBlocks = 1;

        if (this.transaction) { // if transaction is given call amountOfBlocksAfterBeingIncluded()
            amountOfBlocks = this.amountOfBlocksAfterBeingIncluded();
        }
        else { // if transaction is not given, this.blocks is the actual amountofBlocks after the transaction was announced
            amountOfBlocks = this.block;
        }

        // Measure safety of the transaction
        if (amountOfBlocks < 0) {
            // throw new Error("It should not have happened");
            return TransactionSafety.NONE;
        } else if (amountOfBlocks < 4) {
            return TransactionSafety.LOW;
        } else if (amountOfBlocks >= 4 && amountOfBlocks < 15) {
            return TransactionSafety.MEDIUM;
        } else if (amountOfBlocks >= 15 && amountOfBlocks < 25) {
            return TransactionSafety.HIGH;
        } else if (amountOfBlocks >= 25 && amountOfBlocks < 40) {
            return TransactionSafety.VERY_HIGH;
        } else if (amountOfBlocks > 40) {
            return TransactionSafety.SETTLED;
        }
        return TransactionSafety.VERY_LOW;
    }
}

/**
 * Enum for transaction safety
 */
export enum TransactionSafety {
    NONE = "NONE",
    VERY_LOW = "VERY LOW",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    VERY_HIGH = "VERY HIGH",
    SETTLED = "SETTLED"
}