var RLC = artifacts.require("./RLC.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");



module.exports = function(deployer, network) {
	if (network == "ropsten") {
      var owner = "0x7c34db57c20eab8f1fca9b76b93d44f65338dae7";
      var btcproxy = "0x5081be2f9d34f70a4946d3c3972348fc952ae110";
	} else {
		var owner = web3.eth.accounts[0];
		var btcproxy = web3.eth.accounts[1];
	}
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