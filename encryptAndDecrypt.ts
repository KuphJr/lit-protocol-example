import * as LitJsSdk from '@lit-protocol/lit-node-client'
import { Wallet } from 'ethers'
import { generateNonce } from 'siwe'
;(async () => {
  const sponsorWallet = Wallet.createRandom()

  // This wallet private key will be passed to Chainlink Functions via secrets: https://docs.chain.link/chainlink-functions/resources/secrets
  const chainlinkFunctionsWallet = new Wallet(
    process.env['CHAINLINK_FUNCTIONS_WALLET_PRIVATE_KEY'] as string,
  )

  const signedMessage = `localhost wants you to sign in with your Ethereum account:\n${
    sponsorWallet.address
  }\n\nTHIS_PART_CAN_BE_ANY_RANDOM_STRING\n\nURI: https://localhost/login\nVersion: 1\nChain ID: 80001\nNonce: ${generateNonce()}\nIssued At: ${new Date().toISOString()}`

  const authSig = {
    sig: await sponsorWallet.signMessage(signedMessage),
    derivedVia: 'web3.eth.personal.sign',
    signedMessage: signedMessage,
    address: sponsorWallet.address,
  }
  const { symmetricKey, encryptedString, encryptedData } = await LitJsSdk.encryptString(
    JSON.stringify({ hello: 'world' }),
  )

  const litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
    litNetwork: 'serrano',
    debug: false,
  })
  await litNodeClient.connect()

  const evmContractConditions = [
    {
      contractAddress: '0x7A5A705F53c2513f71F1Ba13eD2f5486b69DEe3A',
      functionName: 'isAllowedToDecrypt',
      functionParams: [':userAddress'],
      functionAbi: {
        inputs: [
          {
            internalType: 'address',
            name: 'decryptor',
            type: 'address',
          },
        ],
        name: 'isAllowedToDecrypt',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      chain: 'mumbai',
      returnValueTest: {
        key: '',
        comparator: '=',
        value: 'true',
      },
    },
  ]

  const encryptedSymmetricKey = await litNodeClient.saveEncryptionKey({
    evmContractConditions,
    chain: 'mumbai',
    authSig,
    symmetricKey,
  })

  const decryptRequestSignedMessage = `localhost wants you to sign in with your Ethereum account:\n${
    chainlinkFunctionsWallet.address
  }\n\nRANDOM\n\nURI: https://localhost/login\nVersion: 1\nChain ID: 80001\nNonce: ${generateNonce()}\nIssued At: ${new Date().toISOString()}`

  const decryptAuthSig = {
    sig: await chainlinkFunctionsWallet.signMessage(decryptRequestSignedMessage),
    derivedVia: 'web3.eth.personal.sign',
    signedMessage: decryptRequestSignedMessage,
    address: chainlinkFunctionsWallet.address,
  }

  const decryptionKey = await litNodeClient.getEncryptionKey({
    evmContractConditions,
    toDecrypt: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16'),
    chain: 'mumbai',
    authSig: decryptAuthSig,
  })

  const decryptedString = await LitJsSdk.decryptString(encryptedString, decryptionKey)

  console.log(decryptedString)
})()
