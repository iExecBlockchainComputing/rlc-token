var RLC = artifacts.require("./RLC.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

module.exports = function(deployer) {
  deployer.deploy(RLC).then(function(){
  	return deployer.deploy(Crowdsale,RLC.address,web3.eth.accounts[1]);
  });
};
