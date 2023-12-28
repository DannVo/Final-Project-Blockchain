const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function registerUser() {
  try {
    // Load the connection profile
    const ccpPath = path.resolve(__dirname, 'connection.json');
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user
    const identity = await wallet.get('user1');
    if (identity) {
      console.log('An identity for the user "user1" already exists in the wallet');
      return;
    }

    // Create a new CA client for interacting with the CA
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    // Register the user, enroll the user, and import the new identity into the wallet
    const enrollment = await ca.enroll({ enrollmentID: 'user1', enrollmentSecret: 'user1pw' });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };
    await wallet.put('user1', x509Identity);

    console.log('Successfully registered and enrolled user "user1" and imported it into the wallet');
  } catch (error) {
    console.error(`Failed to register user "user1": ${error}`);
    throw error;
  }
}

// Run the function to register the user
registerUser();
