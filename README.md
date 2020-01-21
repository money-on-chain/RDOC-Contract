# Getting Started

## Install dependencies

- Use nodejs v8.12: `nvm install 8.12 && nvm alias default 8.12`
- Install local dependencies: `npm install`

## Node

You need a node to run contracts. Ganache cli for developing purpose

1. Ganache-cli

- Globally:

```sh
npm install -g ganache-cli;
ganache-cli
```

- Using Docker:

```sh
docker pull trufflesuite/ganache-cli;
docker run -d -p 8545:8545 trufflesuite/ganache-cli:latest
```

2. Rsk Local Node

- With Docker:
  See this repo: https://github.com/rsksmart/artifacts/tree/master/Dockerfiles/RSK-Node

## Tests

**Node**

First run test node example:

- run test node: `npm run ganache-cli`

**Tests**


- run: `npm run test`

**Tests With Coverage**

- `npm run coverage`
- browse: [./coverage/index.html](./coverage/index.html)

## Deploy

(Truffle suit)[https://github.com/trufflesuite/truffle] is recommended to compile and deploy the contracts.
 
1.  Edit truffle.js and change add network changes and point to your
    ganache cli or rsk node.
    
2. Edit migrations/config/config.json and make changes

3. Run `npm run truffle-compile` to compile the code

4. Run `npm run migrate-development` to deploy the contracts
 




