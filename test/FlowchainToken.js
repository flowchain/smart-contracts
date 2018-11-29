var EarlyTokenSale = artifacts.require("EarlyTokenSale");
var FlowchainToken = artifacts.require("FlowchainToken");

var ownerAccount;           // The default owner account. Should be accounts[0]

var token;                  // The constructor promise of token contract
var tokenInstance;          // The token contract instance
var tokenContractAddress;   // The token contract address
var mintableAddress;        // Should be accounts[1]

var sale;                   // The constructor promise of sale contract
var saleInstance;           // The sale contract instance
var saleContractAddress;    // The sale contract address

// The multisig wallet cannot be updated
var multiSigWallet = '0x200ded34ca88a73f8d51bfbe873991108fbb618a';

// Use me in localhost
var network = 'development';

contract('FlowchainToken', function(accounts,) {
  var BN = require('bn.js');
  var decimals = '000000000000000000';

  // Ropsten Test Net
  if (network !== 'development') {
    accounts[1] = accounts[0];
    accounts[2] = '0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef';
  }

  it('should instantiate a token contract', function() {
    token = FlowchainToken.new();
    // Wait for the token contract.
    // The amount of total supply gives to the creator. The contract calls transfer
    // from the address 0x0, therefore, we have to wait until the instantiatation finish.
    return token.then(function(instance) {
      tokenInstance = instance;
      tokenContractAddress = instance.address;
      assert.equal(typeof tokenContractAddress, 'string');
    });
  });

  it('should return a balance of 0 after instantiatation', function() {
    return tokenInstance.balanceOf(tokenContractAddress).then(function(balance) {
      assert.equal(balance, 0);
    });
  }); 

  it('should return the address of token creator', function() {
    return tokenInstance.getCreator().then(function(address) {
      ownerAccount = address;
      // Ropsten Test Net
      if (network !== 'development') {      
        accounts[1] = ownerAccount;
      }
      assert.equal(address, accounts[0]);
    });
  });  

  it('should return the original mintable address', function() {
    return tokenInstance.getMintableAddress().then(function(address) {
      mintableAddress = address;
      assert.equal(typeof address, 'string');
    });
  });     

  it('should instantiate a sale contract', function() {
    sale = EarlyTokenSale.new(tokenContractAddress);
    // Wait for the sale contract.
    return sale.then(function(instance) {
      saleInstance = instance;
      saleContractAddress = instance.address;
      assert.equal(typeof saleContractAddress, 'string');
    });
  });  

  it('should set a new mintable address', function() {
    return tokenInstance.setupMintableAddress(saleContractAddress).then(function(tx) {
      // Check if the transaction is success
      assert.equal(tx.receipt.status, 1);
    });
  });  

  it('should return the new mintable address', function() {
    return tokenInstance.getMintableAddress().then(function(address) {
      mintableAddress = address;
      assert.equal(address, saleContractAddress);
    });
  });   

  it('should not be able to send ether before any sale starts', function() {
    try {
      var result = web3.eth.sendTransaction({
        from: accounts[2],
        to: saleContractAddress,
        value: 0.1 * web3.toWei(1, 'ether'),
        gas: 300000,
      });
    } catch (error) {
      return assert.equal(true, true);
    }    
    return assert.equal(false, true);
  });  

  it('should create a new mintable sale', function() {
    return saleInstance.createMintableSale(6400, 2, 60*24*90).then(function(tx) {
      assert.equal(tx.receipt.status, 1);
    });
  });    

  it('should set the sale contract to mint tokens', function() {
    return tokenInstance.setupMintableAddress(saleContractAddress).then(function(tx) {
      assert.equal(tx.receipt.status, 1);
    });
  });  

  it('should return the exchange rate in ether', function() {
    return saleInstance.getRate().then(function(rate) {
      assert.equal(rate.toString(10), '6400');
    });
  }); 

  it('should work when trying to send 1 ether during the sale', function() {
    try {
      var result = web3.eth.sendTransaction({
        from: accounts[2],
        to: saleContractAddress,
        value: web3.toWei(1, 'ether'),
        gas: 300000,
      });
    } catch (error) {
      return assert.equal(false, true);
    }    
    return assert.equal(true, true);
  }); 

  it('should return a balance of 0 in owner account', function() {
    return tokenInstance.balanceOf(ownerAccount).then(function(balance) {
      assert.equal(balance.toString(10), '0');
    });
  }); 

  it('should return a balance after 1 ether payment', function() {
    return tokenInstance.balanceOf(multiSigWallet).then(function(balance) {
      assert.equal(balance.toString(10), '999993600000000000000000000');
    });
  }); 

  it('should return the balance of the backer', function() {
    return tokenInstance.balanceOf(accounts[2]).then(function(balance) {
      var amount = balance.toString(10);
      assert.equal(amount, '6400000000000000000000'); 
    }); 
  }); 

  it('should work when trying to send 1 ether during the sale', function() {
    try {
      var result = web3.eth.sendTransaction({
        from: accounts[2],
        to: saleContractAddress,
        value: web3.toWei(1, 'ether'),
        gas: 300000,
      });
    } catch (error) {
      return console.log(error);
    }    
    return assert.equal(true, true);
  }); 

  it('should return a balance after 1 ether payment', function() {
    return tokenInstance.balanceOf(multiSigWallet).then(function(balance) {
      assert.equal(balance.toString(10), '999987200000000000000000000');
    });
  });  

  it('should not work when trying to send 1 ether if the funding goal was reached', function() {
    try {
      var result = web3.eth.sendTransaction({
        from: accounts[2],
        to: saleContractAddress,
        value: web3.toWei(2, 'ether'),
        gas: 300000,
      });
    } catch (error) {
      return assert.equal(true, true);
    }    
    return assert.equal(false, true);
  }); 

  it('should return the amount raised in ether', function() {
    return saleInstance.getAmountRaised().then(function(amountRaised) {
      assert.equal(amountRaised.toString(10), '2000000000000000000');
    });
  });       

  it('should not work when creating a new mintable sale before deadline', function() {
    saleInstance.createMintableSale(3200, 1, 60*24*30).then(function(tx) {
      return assert.equal(false, true);
    }).catch(function (error) {
      return assert.equal(true, true);
    });
  });  

  it('should be able to close the sale', function() {
    return saleInstance.closeSale().then(function(tx) {
      assert.equal(tx.receipt.status, 1);
    }).catch(function (error) {
      return assert.equal(false, true);
    });
  });  

  it('should work to create the 2nd mintable sale', function() {
    return saleInstance.createMintableSale(3200, 1, 60*24*30).then(function(tx) {
      assert.equal(tx.receipt.status, 1);
    }).catch(function (error) {
      return assert.equal(false, true);
    });
  });    

  it('should return the exchange rate', function() {
    return saleInstance.getRate().then(function(rate) {
      assert.equal(rate.toNumber(), 3200);
    });
  }); 

  it('should return the balance of the backer', function() {
    return tokenInstance.balanceOf(accounts[2]).then(function(balance) {
      var amount = balance.toString(10);
      assert.equal(amount, '12800000000000000000000'); 
    }); 
  });   

  it('should work when trying to send 0.01 ether during the 2nd sale', function() {
    try {
      var result = web3.eth.sendTransaction({
        from: accounts[2],
        to: saleContractAddress,
        value: 0.1 * web3.toWei(1, 'ether'),
        gas: 300000,
      });
    } catch (error) {
      return assert.equal(false, true);
    }    
    return assert.equal(true, true);
  });

  it('should return the amount raised in ether', function() {
    return saleInstance.getAmountRaised().then(function(amountRaised) {
      var amount = new BN(amountRaised.toString(10), 10);
      assert.equal(amount.toString(10), '2100000000000000000');
    });
  });     

  it('should return a balance of the owner account', function() {
    return tokenInstance.balanceOf(multiSigWallet).then(function(balance) {
      var amount = new BN(balance.toString(10), 10);
      assert.equal(amount.toString(10), '999986880000000000000000000');
    });
  });  

  it('should return the balance of the backer', function() {
    return tokenInstance.balanceOf(accounts[2]).then(function(balance) {
      var amount = balance.toString(10);
      assert.equal(amount, '13120000000000000000000'); //12800 + 320 = 13120 * 10**18
    }); 
  });  

  it('should not work when sending less than 0.1 ether', function() {
    try {
      var result = web3.eth.sendTransaction({
        from: accounts[2],
        to: saleContractAddress,
        value: 0.01 * web3.toWei(1, 'ether'),
        gas: 300000,
      });
    } catch (error) {
      return assert.equal(true, true);
    }    
    return assert.equal(false, true);
  });  

  it('should be able to close the sale', function() {
    return saleInstance.closeSale().then(function(tx) {
      assert.equal(tx.receipt.status, 1);
    }).catch(function (error) {
      return assert.equal(false, true);
    });
  });

  it('should not work when sending ether during sales close', function() {
    try {
      var result = web3.eth.sendTransaction({
        from: accounts[2],
        to: saleContractAddress,
        value: 1 * web3.toWei(1, 'ether'),
        gas: 300000,
      });
    } catch (error) {
      return assert.equal(true, true);
    }    
    return assert.equal(false, true);
  });  

  it('should return the amount raised in ether', function() {
    return saleInstance.getAmountRaised().then(function(amountRaised) {
      assert.equal(amountRaised.toString(10), '2100000000000000000');
    });
  });       
});