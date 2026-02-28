/**
 * Class to generate file names or date
 */
export class Generator {
  /**
   * @returns File path - ./src/files/logs/ + current date + random id + .log
   */
  public makeLog(actionName?: string) {
    if (!actionName) {
      return (
        "./src/files/logs/" + this.getDate() + "-" + this.makeId(5) + ".log"
      );
    } else {
      return (
        "./src/files/logs/" +
        this.getDate() +
        "-" +
        actionName +
        "-" +
        this.makeId(5) +
        ".log"
      );
    }
  }

  /**
   * @returns File path - ./src/files/multisigs/ + current date + random id + .txt
   */
  public makeMultisigFile() {
    const result =
      "./src/files/multisigs/" + this.getDate() + "-" + this.makeId(5) + ".txt";

    return result;
  }

  /**
   * @returns File path - ./src/files/mosaics/ + current date + random id + .txt
   */
  public makeMosaicFile() {
    const result =
      "./src/files/mosaics/" + this.getDate() + "-" + this.makeId(5) + ".txt";

    return result;
  }

  /**
   *
   * @param length id length
   * @returns random it
   */
  public makeId(length: number) {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public makeIdNoCaps(length: number) {
    let result = "";
    const characters =
      "abcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }


  /**
   * @returns current date (Example: 2019-11-28T15_31_21_123)
   */
  public getDate() {
    const today = new Date();
    const milisec = String(today.getMilliseconds()).padStart(3, "0");
    const sec = String(today.getSeconds()).padStart(2, "0");
    const mi = String(today.getMinutes()).padStart(2, "0");
    const hh = String(today.getHours()).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
    const yyyy = today.getFullYear();

    const result =
      yyyy +
      "-" +
      mm +
      "-" +
      dd +
      "T" +
      hh +
      "_" +
      mi +
      "_" +
      sec +
      "_" +
      milisec;
    return result;
  }
}
export const generator = new Generator();
