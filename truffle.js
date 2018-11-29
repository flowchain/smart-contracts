var HDWalletProvider = require("truffle-hdwallet-provider");
var fs = require('fs');

var secrets = fs.readFileSync('secrets.json', 'utf8');

try {
  var obj = JSON.parse(secrets);
} catch (error) {
  console.log('Invalid data in secrets.json.');
}

var mnemonic = obj.mnemonic;

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },  
  networks: {
    development: {
      host: 'localhost',
      port: 9545,
      network_id: '*'
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io'),
      network_id: '3',
      gas: 1251680,
      gasPrice: 4000000000
    },
    kovan: {
      provider: new HDWalletProvider(mnemonic, 'https://kovan.infura.io/'),
      network_id: '4'
    },
    mainnet: {
      provider: new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/'),
      network_id: 1, // Main net
      gas: 1251680,
      gasPrice: 6000000000 // 6 Gwei
    }
  }
}
