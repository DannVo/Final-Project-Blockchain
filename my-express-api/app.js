// app.js

const { Wallets, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const { registerAndEnrollUser } = require('./caActions');
const { queryAllAssets } = require('./ledgerActions');

async function main() {
  try {
    const ccpPath = path.resolve(__dirname, 'connection.json');
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);

    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const walletPath = path.join(process.cwd(), 'wallet');
    const mspId = 'Org1MSP'; // Adjust as needed
    const enrollmentID = 'user1';
    const enrollmentSecret = 'user1pw';

    // Register and enroll user
    await registerAndEnrollUser(caInfo, walletPath, enrollmentID, enrollmentSecret, mspId);

    // Use the registered and enrolled user to interact with the ledger
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get(enrollmentID);
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: enrollmentID,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('basic');

    // Query all assets
    const allAssets = await queryAllAssets(contract);
    console.log(`All Assets: ${allAssets}`);

    await gateway.disconnect();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();
