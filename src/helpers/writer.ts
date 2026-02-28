import { generator } from './generator';
import { WriteStream } from 'fs';

/**
 * Class to write to file
 */
export class Writer {
    private stream: WriteStream;
    private fs = require('fs');
    private name: string;

    /**
     * Getter $name
     * @return {string}
     */
    public get $name(): string {
        return this.name;
    }

    /**
     * Setter $name
     * @param {string} value
     */
    public set $name(value: string) {
        this.name = value;
    }


    /**
     * Create stream to write to file
     * @param filePath path to which file to write
     */
    public createStream(filePath: string) {
        this.stream = this.fs.createWriteStream(filePath, { flags: 'a' });
        this.$name = filePath;
    }

    /**
     * Append ERROR message to file with current time
     * @param text Text to write to file
     */
    public addERROR(text: string) {
        this.stream.write("\n" + generator.getDate() + " ERROR: " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
        this.addLine();
    }

    /**
     * Append TASK message to file with current time
     * @param text Text to write to file
     */
    public addTASK(text: string) {
        this.stream.write("\n" + generator.getDate() + " TASK: " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
        this.addLine();
    }

    /**
     * Append TASKFAILED message to file with current time
     * @param text Text to write to file
     */
    public addTaskFailed(text: string) {
        this.stream.write("\n" + generator.getDate() + " TASK_FAILED ERROR: " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
        this.addLine();
    }

    /**
     * Append TASK FINISHED message to file with current time
     * @param text Text to write to file
     */
    public addTaskFinished(text: string) {
        this.addLine();
        this.stream.write("\n" + generator.getDate() + " TASK_FINISHED: " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
        this.addLine();
    }

    /**
     * Append ACTION message to file with current time
     * @param text Text to write to file
     */
    public addACTION(text: string) {
        this.stream.write("\n" + generator.getDate() + " ACTION: " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
    }


    /**
     * Append DONE message to file with current time
     * @param text Text to write to file
     */
    public addDONE(text: string) {
        this.stream.write("\n" + generator.getDate() + " DONE: " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
    }

    /**
     * Append NEXT message to file with current time
     * @param text Text to write to file
     */
    public addNEXT(text: string) {
        this.stream.write("\n" + generator.getDate() + " NEXT: " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
        this.addLine();
    }

    /**
     * Append line to file (Example: ---------------- )
     */
    public addLine() {
        this.stream.write("\n-------------------------------------------------------", (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
    }

    /**
     * Append text to file with current time
     * @param text Text to write to file
     */
    public addText(text: string) {
        this.stream.write("\n" + generator.getDate() + " " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
    }

    /**
     * Append text and 2 lines to file with current time
     * @param text Text to write to file
     */
    public addTextAndLines(text: string) {
        this.addLine();
        this.stream.write("\n" + generator.getDate() + " " + text, (err: Error) => {
            if (err) {
                console.log('error', err.message);
            }
        });
        this.addLine();
    }
}
export const writer = new Writer();