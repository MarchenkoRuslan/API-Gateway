import { Writer } from "./writer";

/**
 * Class to handle errors
 */
export class ErrorHandler {
    private error: string;

    /**
     * Getter $error
     * @return {string}
     */
    public get $error(): string {
        return this.error;
    }

    /**
     * Setter $error
     * @param {string} value
     */
    public set $error(value: string) {
        this.error = value;
    }

    /**
     * Check for error
     * @returns true if there was an error
     */
    public checkError(): boolean {
        if (this.$error !== undefined) {
            return true
        }
        return false;
    }

    /**
     * Handle errors
     */
    public handleErrors(writer: Writer, id?: number) {
        if (id === undefined) {
            writer.addTaskFailed(`Exit_after_error_from_blockchain: ${this.$error}`)
        }
        else {
            writer.addTaskFailed(`id: ${id} Exit_after_error_from_blockchain: ${this.$error}`)
        }

    }
}

export const errorHandler = new ErrorHandler();