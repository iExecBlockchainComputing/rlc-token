var RLC = artifacts.require("./RLC.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

var rlc;
var crowdsale;
/*
module.exports = function(deployer) {
    deployer.deploy(RLC).then(function() {
        return deployer.deploy(Crowdsale, RLC.address).then(function() {
            return Crowdsale.deployed();
        }).then(function(instance) {
            crowdsale = instance;
            return RLC.deployed();
        })
    });
};

*/

module.exports = function(deployer) {
  deployer.deploy(RLC).then(function(){
  	return deployer.deploy(Crowdsale,RLC.address,web3.eth.accounts[2]);
  });
};
