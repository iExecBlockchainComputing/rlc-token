var Crowdsale = artifacts.require("./Crowdsale.sol");
var RLC = artifacts.require("./RLC.sol");
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


// for this test to pass you have to revert the condition on crowdsale.sol line 143 and 187

contract('Crowdsale', function(accounts) {
  it("Send Eth to the contract and verify RLC balance", function() {
    var CrowdContract;
    var RLCcontract;

    return RLC.deployed(1000,{from: accounts[0]}).then(function(instance){
      RLCcontract = instance;

        return Crowdsale.deployed(RLCcontract, accounts[2], {from: accounts[0]});
      }).then(function(instance){
        CrowdContract = instance;
        var myEvent = CrowdContract.Logs();
        myEvent.watch(function(err, result){
          if (err) {
                  console.log("Erreur event ", err);
                  return;
          }
          console.log("Logs event = ",result.args.amount,result.args.value);
        });
        return RLCcontract.transfer(CrowdContract.address, 87000000000000000,{from: accounts[0]});
      }).then(function(res){
        return RLCcontract.transferOwnership(CrowdContract.address,{from: accounts[0]});
      }).then(function(res){
        return RLCcontract.balanceOf.call(CrowdContract.address);
      }).then(function(result){
        assert.equal(result.toNumber(),87000000000000000,"test crowdsale get all RLC ");
        return web3.eth.sendTransaction({from:accounts[1], to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[1]);
      }).then(function(result){
        assert.equal(result.toNumber(),6000000000000,"test equal with 20% bonus")  
        // test receive BTC with same adress

        // if we put accounts[1] (same account than the receiveETH) it will throw 
        return CrowdContract.receiveBTC(accounts[3], "0x000", 200000, {from:accounts[2] ,gas:3000000});
      }).then(function(result){

        return RLCcontract.balanceOf.call(accounts[3]);
      }).then(function(result){
        assert.equal(result.toNumber(),12000000000,"test equal with 20% bonus")  

        // check other value rlc_bounty rlc_team rlc_reserve RLCEmitted
        return CrowdContract.rlc_bounty();
      }).then(function(result){
        assert.equal(result.toNumber(),1700601200000000,"rlc bounty part")  
      }).catch(function(err){
        console.log(err);
    });
  });
}); 