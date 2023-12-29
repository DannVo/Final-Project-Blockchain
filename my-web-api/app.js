// app.js
const express = require('express');
const bodyParser = require('body-parser');
const { Wallets, Gateway } = require('fabric-network');
const path = require('path');
const helper = require('./helper');
const ccpPath = path.resolve('\\\\wsl.localhost\\Ubuntu-20.04\\home\\anthonyvo\\go\\src\\github.com\\fabric\\fabric-samples\\test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get('/api/all-products', async (req, res) => {
    try {
        const ccp = helper.buildCCPOrg1();
        const wallet = await helper.buildWallet(Wallets, './wallet');
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'danh',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('basic');

        const result = await contract.evaluateTransaction('GetAllAssets');
        res.json(JSON.parse(result.toString()));
        await gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/product/detail/:assetId', async (req, res) => {
    try {
        const assetId = req.params.assetId;
        const ccp = helper.buildCCPOrg1();
        const wallet = await helper.buildWallet(Wallets, './wallet');
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'danh',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('basic');

        const result = await contract.evaluateTransaction('ReadAsset', assetId);
        res.json(JSON.parse(result.toString()));
        await gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/new/product', async (req, res) => {
    try {
        const { assetId, color, size, owner, appraisedValue } = req.body;
        const ccp = helper.buildCCPOrg1();
        const wallet = await helper.buildWallet(Wallets, './wallet');
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'danh',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('basic');

        await contract.submitTransaction('CreateAsset', assetId, color, size, owner, appraisedValue);
        res.json({ success: true, message: 'Asset created successfully' });
        await gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
