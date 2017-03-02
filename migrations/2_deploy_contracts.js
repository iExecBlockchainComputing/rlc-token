
var RLC = artifacts.require("./RLC.sol");

module.exports = function(deployer) {
//  deployer.deploy(ConvertLib);
//  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(RLC);
};
