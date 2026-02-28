# General information

Express JS with Symbol-sdk - v0.23.0


```
    Branch: CoArt-dev
```


```
    Port: 4000
```
Can be changed in .env

OS: Linux (ubuntu 18.04)


## Deployment by using Docker



## Docker building and lauching sequence


0. Prerequirements:
    1. Sudo rights and permissions
    2. Docker Engine from - 
    https://docs.docker.com/engine/
    3. Docker Compose from - 
    https://docs.docker.com/compose/install/
    4. Adjust _docker-compose.yml_ file with different values of environment variables if needed. Verify open port value.


### Run docker compose

configuration for Symbol Testnet
```
docker compose -f docker-compose-testnet.yml up -d
```

### OR Run Docker build and compose separately 

1.  Build Docker image: 

```
docker build -t coart/public-test:latest .
```

2. Start Docker image:

```
sudo docker-compose up -d
```

### Read logs from inside docker container:

Find built and relevant container ID from running processes list:

```
sudo docker ps
```

Get into inside container interactively: 

```
docker exec -it <ContainerID> /bin/sh
```

And read logs from /usr/app/src/files/logs directory


## Deployment manualy

### Prerequisites

```
sudo apt update
sudo apt upgrade
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

sudo apt install npm
sudo reboot
```

#### Node installation (Node 20 recommended, as in Dockerfile)

```
nvm install 20
nvm use 20
```

### Git cloning

Enter git clone and the repository URL at your command line:

```
git clone https://superhow@dev.azure.com/superhow/coartNFT/_git/APIgateway.CoART
```

### Typescript compiler installation

```
npm install typescript --save -D
```

### Installing

A step by step series of installing express.js application

After cloning the project, follow these steps:

```
 npm i
 npm start
```

npm start runs express JS in DEV mode. It means it will restart after changes in source files.

### Usage

After deploying node.js server, you can access to server through 4000 port (default).

### Run express js in background (DEV mode)

To run express js in background run command:

```
nohup npm start &
```

This will start node js in background mode. It returns PID.
It creats output file 'nohup.out' and appends to it.

npm start runs express JS in DEV mode. It means it will restart after changes in source files.




##Logs are not updated yet!
### Server Logs

You can find logs of server process by running command:

```
forever logs
```

See the logfile path and name, copy it and open in it with cat, less or nano. It should look like this:

```
cat /home/<user>/.forever/H4H2.log
```

### Express JS Logs

You can find all logs of transactions in:

```
/<project_folder>/src/files/logs
```

You can find all created mosaics in:

```
/<project_folder>y/src/files/mosaics
```

You can find all create multisigs in:

```
/<project_folder>/src/files/multisigs
```

### Health

- `GET /health` — returns `{ "status": "ok" }`. Use for liveness/healthcheck (e.g. Railway).

### Deploy to Railway

1. Connect the API-Gateway repository to Railway.
2. Use the provided Dockerfile or Nixpacks (Node.js).
3. Set environment variables from `.env.example` (PORT is set by Railway).
4. Healthcheck: `GET /health`.

### Endpoints

Server endpoints starts with

```
http://localhost:4000/api/
```

These endpoints are already developed:

Endpoints:

1.  /account **_Endpoints to make transactions with blockchain account_**

        - /account/create

    > _Create Account by generating Private / Public key pairs and address. Account is not yet active on blockchain_ 

        - /account/getBalance

    > _Get Account balance by its address - owned mosaic ids and amounta_

        - /account/getTransactions

    > _Get Account transactions (history)_

    

2.  /blockchain **_Endpoints to get information about blockchain_**
    
        - /blockchain/getHeight

    > _Get current block height_

3.  /nft **_Endpoints to make transactions with blockchain NFTs (mosaics)_**

        - /nft/create

    > _Create nft (mosaic with metadata) and send to provided owner address_

        - /nft/create/fromMultisig

    > _Create NFT when creator is of multisig type and send to the provided owner address_

        - /nft/getInfo

    > _Get NFT information by given NFT ID (mosaic metadata)

        - /nft/updateMetadata

    > _Update the metadata of given NFT (mosaic) ID_


4. /multisig **_Endpoints to create, update or view multisig accounts_**

       - /multisig/create/fromProvidedCosignatories
       
    > _Create account and convert to multisig with provided private keys as cosignatories_
    
       - /multisig/create/fromProvidedCosignatories/fromMultisig
       
    > _Create account sending currency from multisig and convert to multisig with provided private keys as cosignatories_

        - /multisig/modify
       
    > _Modify multisig account details by providing private keys of multisig account cosignatories_

        - /multisig/getInfo/:address
       
    > _Get multisig details by providing address_

5. /selling **_Endpoints for selling mosaics (NFTs)_**

        - /selling/sellMosaicTransactionComplete

    > _Sell mosaic by forming an aggregate complete transaction_
    
        - /selling/multisigSellMosaicTransactionBonded
        
    > _Sell mosaic by forming an aggregate bonded transaction when buyer is of multisig type_

        - /selling/sellMosaicTransactionBonded
        
    > _Sell mosaic by forming an aggregate bonded transaction_

6.  /transaction **_Endpoints to make transactions_**

        - /transaction/send

    > _Create transaction sending mosaic by namespace name and announce it_

        - /transaction/cosign

    > _Co-sign the transaction that was announced to the network as partial_

        - /transaction/sendMosaic

    > _Create transaction sending mosaic by mosaicId and announce it_
    
        - /transaction/sendJSON

    > _Create transaction sending mosaic by namespace name and announce it where sent message is in JSON format_
    
        - /transaction/getStatus

    > _Get status of transaction (unconfirmed, confirmed, partial, failed)_

        - /transaction/getConfirmedInfo

    > _Get information of confirmed transaction (Inner transations, mosaics, amount)_

        - /transaction/demo/encrypt

    > _Create a token to be used for /transaction/sendEncrypted endpoint. Token is encrypted object, having properties: senderPrivateKey/recipientAddress/amount/namespaceName/message (as in /transaction/send endpoints). Encryption parameters: ENCRYPTION_KEY - from .env, ALGORITHM - aes-256-gcm, initialization vector (IV) length - 12, input encoding - utf-8, output format - hexadecimal string, with parts concatenated and separated by ":" (order - iv -> tag -> encrypted data) 
    (e.g. `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}` 
    (e.g. 132d908a5f01187950fd41be:c5af6b1c25738ff3e7d9bc49b07f7bbe:b44cde8edce744f6355b476f4034da4188bb57e99bd3f82c5f504b88a239dba10f71534cc738d1742548d3bb0e8d1825d6817e01d7db8438268c254c7a3b635ec63df80d4fe56bac1942136dbadec5d7eddd538c36ca2b67ee739da0c0ff931eafa34cadf3211b9688f58f0ba7f8c19225138dac96c6f1082bcafd528a0168c308b1a38ee24c793a557dcb35f16e6f374c4ece0c5f780f1c39193e715236ba9c3ce49a4abcc4902face7a3bc8f60f21cb275bdb8be50a329df079e280adc0964444d702066426a4c1a64472b10936607fbfae855d1e19b40f2e341e34067))_

        - /transaction/sendEncrypted

    > _Create transaction sending mosaic by namespace name and announce it. The request expects a single encrypted token (body) (self-created or from /transaction/demo/encrypt endpoint)_ 
    
    6.  /hd-wallets **_Endpoints to make wallets_**

        - /hd-wallets/create/wallet

    > _Generate Symbol wallet from passphrase, language and strength_

        - /hd-wallets/generate/passPhrase

    > _Generate Symbol passphrase from language and strength_

        - /hd-wallets/generate/seedHex

    > _Generate Symbol seed in hexadecimal format_
    
        - /hd-wallets/generate/extendedKey

    > _Generate extended Symbol key_

        - /hd-wallets/hdAccounts/getChild

    > _Returns HD-Wallet's child account_
