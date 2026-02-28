import express = require("express");
import { Request, Response } from "express";
import { keyGeneratorService } from "../../../services/hd-wallets/keyGeneratorService"

const router = express.Router();

/**
 * @swagger
 * /hd-wallets/generate/passPhrase:
 *   get:
 *     summary: Generates a random passphrase
 *     description: |
 *       Generates a passphrase of the provided byte length and language
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 description: language of the passphrase.
 *                 example: "english"
 *               strength:
 *                 type: integer
 *                 description: Passphrase to generate strength in bytes. Recommended number - 256.
 *                 example: "256"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pass_phrase:
 *                   type: string
 *                   description: Generated passphrase.
 *                   example: "organ inform bracket crowd silent foil yellow person always deal thank simple village stage real fatigue pistol only chronic pattern stadium document bean chief"
 *                 used_language:
 *                   type: string
 *                   description: Used language of the passphrase.
 *                   example: "english"
 *                 used_strength:
 *                   type: integer
 *                   description: Used strength of the passphrase.
 *                   example: "256"
 */
router.get("/passPhrase", (req: Request, res: Response) => {
    let language = req.body.language;
    let strength = req.body.strength;
    const length = Object.keys(req.body).length

    if (!req.body.language) {
        if (req.body.language === "0" || req.body.language === "") {
            language = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'language is required',
            });
        }
    }
    if (!req.body.strength) {
        if (req.body.strength === "0" || req.body.strength === "") {
            strength = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'strength is required',
            });
        }
    }
    else if (length !== 2) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    res.send({
        pass_phrase: keyGeneratorService.generatePassPhrase(language, strength).plain,
        used_language: language,
        used_strength: strength
    });

});

/**
 * @swagger
 * /hd-wallets/generate/seedHex:
 *   get:
 *     summary: Generates a secure seed in hexadecimal form.
 *     description: |
 *       Generates a secure seed in hexadecimal form from a provided or generated passphrase and password.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password. This should be provided, if not - the default is to be used.
 *                 example: "password"
 *               passPhrase:
 *                 type: string
 *                 description: Passphrase. If it is left empty - it is generated, if not - the provided one is used.
 *                 example: "unusual soft airport hat antique clarify punch crumble cliff sense idea relief begin flip title power chicken knife eight become tiger nerve broom survey"
 *               language:
 *                 type: string
 *                 description: language of the passphrase. Can be left empty.
 *                 example: ""
 *               strength:
 *                 type: string
 *                 description: Passphrase strength in bytes. Can be left empty
 *                 example: ""
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pass_phrase:
 *                   type: string
 *                   description: Generated or used passphrase.
 *                   example: "unusual soft airport hat antique clarify punch crumble cliff sense idea relief begin flip title power chicken knife eight become tiger nerve broom survey"
 *                 used_password:
 *                   type: string
 *                   description: Used password of generation.
 *                   example: "password"
 *                 secure_seed_hex:
 *                   type: string
 *                   description: Secure generated seed in hexadecimal form.
 *                   example: "43ca9f02fc411576c646c2299e72a883c6189685b2b5d460f994aee46362d73556413e11e225391e5ce879b4c93a30d0df0569f3f8e8c83ec762aa8ef2d60954"
 */
router.get("/seedHex", (req: Request, res: Response) => {
    let password = req.body.password;
    let passPhrase = req.body.passPhrase;
    let language = req.body.language;
    let strength = req.body.strength;
    const length = Object.keys(req.body).length

    if (!req.body.password) {
        if (req.body.password === "0" || req.body.password === "") {
            password = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'password is required',
            });
        }
    }
    if (!req.body.passPhrase) {
        if (req.body.passPhrase === "0" || req.body.passPhrase === "") {
            passPhrase = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'passPhrase is required',
            });
        }
    }
    if (!req.body.language) {
        if (req.body.language === "0" || req.body.language === "") {
            language = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'language is required',
            });
        }
    }
    if (!req.body.strength) {
        if (req.body.strength === "0" || req.body.strength === "") {
            strength = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'strength is required',
            });
        }
    }
    else if (length !== 4) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    res.send(keyGeneratorService.generateSeedHex(password, passPhrase, language, strength));
});


/**
 * @swagger
 * /hd-wallets/generate/extendedKey:
 *   get:
 *     summary: Generates an extended key for a passphrase.
 *     description: |
 *       Generates a an extended key for a passphrase.
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passPhrase:
 *                 type: string
 *                 description: Passphrase. If it is left empty - it is generated, if not - the provided one is used.
 *                 example: "unusual soft airport hat antique clarify punch crumble cliff sense idea relief begin flip title power chicken knife eight become tiger nerve broom survey"
 *               language:
 *                 type: string
 *                 description: language of the passphrase. Can be left empty.
 *                 example: ""
 *               strength:
 *                 type: string
 *                 description: Passphrase strength in bytes. Should be left empty
 *                 example: ""
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pass_phrase:
 *                   type: string
 *                   description: Generated or used passphrase.
 *                   example: "unusual soft airport hat antique clarify punch crumble cliff sense idea relief begin flip title power chicken knife eight become tiger nerve broom survey"
 *                 extened_key:
 *                   type: string
 *                   description: Generated extened passphrase key.
 *                   example: "2e87abf88ada3b6bc1e6fc21da88b188f1efc24975c0db40b9ae684a3a7f6df2b339ba6dfc1c6dfa6f1fa61e2a40119085a2b6bcc53b153ba6af1aaa1770001c"
 */
router.get("/extendedKey", (req: Request, res: Response) => {
    let passPhrase = req.body.passPhrase;
    let language = req.body.language;
    let strength = req.body.strength;
    const length = Object.keys(req.body).length

    if (!req.body.passPhrase) {
        if (req.body.passPhrase === "0" || req.body.passPhrase === "") {
            passPhrase = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'passPhrase is required',
            });
        }
    }
    if (!req.body.language) {
        if (req.body.language === "0" || req.body.language === "") {
            language = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'language is required',
            });
        }
    }
    if (!req.body.strength) {
        if (req.body.strength === "0" || req.body.strength === "") {
            strength = undefined;
        }
        else {
            return res.status(400).send({
                status: 'failed',
                message: 'strength is required',
            });
        }
    }
    else if (length !== 3) {
        return res.status(400).send({
            status: 'failed',
            message: 'too much parameters',
        });
    }
    res.send(keyGeneratorService.generateExtendedKey(passPhrase, language, strength));
});

export default router;