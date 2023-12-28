// node.js includes
const helper = require('./helper')
const path = require('path')
// fabric includes
const {Gateway, Wallets } = require('fabric-network');
const walletPath = path.join(__dirname, 'wallet');
// some vars
const org1UserId = 'roland';
const channelName = 'channell';
const chaincodeName = 'basic';
async function main () {
    try {
        // build CCP
        const ccp = helper.buildCCPOrg1();
        // setup the wallet to hold the credentials of the application user
        const wallet = await helper.buildWallet(Wallets, walletPath);
        
        const gateway = new Gateway();
        
        await gateway.connect(ccp, {
            wallet,
            identity: org1UserId,
            discovery: {enabled: true, asLocalhost: true} // using aslocalhost as this

        });
        const network = await gateway.getNetwork(channelName);
        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        let args = process.argv
        if(args[2] === 'GetAllAssets'){
            let result = await contract.evaluateTransaction('GetAllAssets');
            console.log(`${helper.prettyJSONString(result.toString())}`);
        } else if(args[2] === 'ReadAsset'){
            let asset = args[3]
            result = await contract.evaluateTransaction('ReadAsset', asset);
            console.log(`${helper.prettyJSONString(result.toString())}`);
            
        } else if (args[2] === 'CreateAsset'){
            let r = await contract.submitTransaction('CreateAsset', 'asset14',    '5', 'Snorre3', '1300');
            console.log('*** Result: committed', r.toString());

        }else {
            console.log("...")

        }
        // disconnect form the network
        gateway.disconnect();
    }catch(e){
        throw new Error(e)

    }
}

main()
