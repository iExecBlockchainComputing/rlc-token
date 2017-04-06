var RLC = artifacts.require("./RLC.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");



module.exports = function(deployer, accounts) {
	var owner = web3.eth.accounts[0];
	var btcproxy = web3.eth.accounts[1];
  deployer.deploy(RLC, {from: owner}).then(function(){
  	return deployer.deploy(Crowdsale,RLC.address,btcproxy);
  });
};

/* ADD these step
RLCcontract.transfer(CrowdContract.address, 87000000000000000,{from: owner});
RLCcontract.transferOwnership(CrowdContract.address,{from: owner});

truffle console:
RLC.at(RLC.address).transfer(Crowdsale.address,87000000000000000)
RLC.at(RLC.address).balanceOf(Crowdsale.address)
RLC.at(RLC.address).transferOwnership(Crowdsale.address)
RLC.at(RLC.address).owner()


*/