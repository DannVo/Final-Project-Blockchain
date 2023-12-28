// // caActions.js

// const { Wallets } = require('fabric-network');
// const FabricCAServices = require('fabric-ca-client');
// const path = require('path');
// const fs = require('fs');

// async function registerAndEnrollUser(caInfo, walletPath, adminEnrollmentID, adminEnrollmentSecret, enrollmentID, enrollmentSecret, mspId) {
//   try {
//     const wallet = await Wallets.newFileSystemWallet(walletPath);

//     // Check if the user is already enrolled
//     const userIdentity = await wallet.get(enrollmentID);
//     if (userIdentity) {
//       console.log(`An identity for the user ${enrollmentID} already exists in the wallet`);
//       return;
//     }

//     // Create a new CA client for interacting with the CA
//     const caTLSCACerts = caInfo.tlsCACerts.pem;
//     const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

//     // Enroll the admin user
//     const enrollment = await ca.enroll({ enrollmentID: adminEnrollmentID, enrollmentSecret: adminEnrollmentSecret });
//     const x509Identity = {
//       credentials: {
//         certificate: enrollment.certificate,
//         privateKey: enrollment.key.toBytes(),
//       },
//       mspId: mspId,
//       type: 'X.509',
//     };
//     await wallet.put(adminEnrollmentID, x509Identity);

//     // Set the user context to the admin user
//     const adminIdentity = await wallet.get(adminEnrollmentID);
//     const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
//     const adminUser = await provider.getUserContext(adminIdentity, adminEnrollmentID);

//     // Register the user
//     const registrationRequest = {
//       enrollmentID,
//       enrollmentSecret,
//       maxEnrollments: -1,
//       role: 'client',
//       affiliation: 'org1.department1', // Adjust affiliation as needed
//     };
//     const secret = await ca.register(registrationRequest, adminUser);

//     // Enroll the user and import the new identity into the wallet
//     const userEnrollment = await ca.enroll({ enrollmentID, enrollmentSecret: secret });
//     const userX509Identity = {
//       credentials: {
//         certificate: userEnrollment.certificate,
//         privateKey: userEnrollment.key.toBytes(),
//       },
//       mspId,
//       type: 'X.509',
//     };
//     await wallet.put(enrollmentID, userX509Identity);

//     console.log(`Successfully registered and enrolled user ${enrollmentID} and imported it into the wallet`);
//   } catch (error) {
//     console.error(`Failed to register and enroll user ${enrollmentID}: ${error}`);
//     throw error;
//   }
// }

// module.exports = { registerAndEnrollUser };

// Certificate Authority - Actions
// node.js includes
const path = require('path')
// own helper functions
const helper = require('./helper')
// fabric includes
const FabricCAServices = require('fabric-ca-client');
const {Wallets} = require('fabric-network');
// CA admin credentions based on test-network
const adminUserId = 'admin';
const adminUserPasswd = 'adminpw';
// wallet path
const walletPath = path.join(__dirname, 'wallet');
// Create a new CA client for interacting with the CA
// @param (+) FabricCAServices
// @param (*> ccp
// @param (*) caHostName
// */
function buildCAClient (FabricCAServices, ccp, caHostName) {
    const caInfo = ccp.certificateAuthorities[caHostName]
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const caClient = new FabricCAServices(caInfo.url,{trustedRoots: caTLSCACerts,
    verify: false}, caInfo.caName);
    console.log(`Build a CA Client named ${caInfo.caName}`);
    return caClient;
}

// Enroll an Admin user
// @param (*) caClient
// @param (#) wallet
// @param (*) orgMspId
// */

async function enrollAdmin (caClient, wallet, orgMspId){
    try {
        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get(adminUserId);
        if (identity) {
            console.log('An identity for the admin user already exists in the wallet');
            return;
        }
        const enrollment = await caClient.enroll({enrollmentID: adminUserId,
            enrollmentSecret: adminUserPasswd });
        const x509Identity ={
            credentials: {
                certificate: enrollment.certificate,
                privatekey: enrollment.key.toBytes(),
                
            },
            mspId: orgMspId,
            type: 'X.509',
        }

        await wallet.put(adminUserId, x509Identity);
        console. log('Successfully enrolled admin user and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user : ${error}`);

    }
};

async function registerAndEnrollUser (caClient, wallet, orgMspId, userId, affiliation){

    try {

        // Check to see if we've already enrolled the user
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log("An identity for the user $fuserId) already exists in the wallet ");
            return;

        }
        // Must use an admin to register a new user
        const adminIdentity = await wallet.get(adminUserId);
        if (!adminIdentity) {
            console.log('Enroll the admin user before retrying');
            console.log('An identity for the admin user does not exist in the wallet');
            return;

        }
        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserId);
        // Register the user, enroll the user, and import the new identity into the
        // wallet.
        // if affiliation is specified by client, the affiliation value must be
        // configured in CA
        const secret = await caClient.register({
        affiliation: affiliation,
        enrollmentID: userId,
        role: 'client'
        }, adminUser);
        
        const enrollment = await caClient.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret

        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),

            },
            mspId: orgMspId,
            type: 'X.509',
        };
        
        console.log(x509Identity)
        await wallet.put(userId, x509Identity);
        console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);
    }catch(error){
        console.log(`Failed to regiter user: ${error}`);
    }
}

async function getAdmin(){
    let ccp = helper.buildCCPOrg1()

    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await helper.buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, 'Org1MSP');
}

async function getUser(org1UserId) {
    let ccp = helper.buildCCPOrg1()

    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com')
    const wallet = await helper.buildWallet(Wallets, walletPath)
    await registerAndEnrollUser(caClient, wallet, 'Org1MSP', org1UserId, 'org1.department1')
}

let args = process.argv
if(args[2] === 'admin'){
    getAdmin()
}else if(args[2] === 'user'){
    let org1UserId = args[3]
    getUser(org1UserId)

}else{
    console.log('...')
}
