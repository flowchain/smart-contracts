var FlowchainToken = artifacts.require("FlowchainToken");
var EarlyTokenSale = artifacts.require("EarlyTokenSale");

module.exports = function(deployer) {
    return deployer.deploy(EarlyTokenSale, FlowchainToken.address);
};