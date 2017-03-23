var Crowdsale = artifacts.require("./Crowdsale.sol");
var RLC = artifacts.require("./RLC.sol");
var Web3 = require('web3');

web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


contract('Crowdsale', function(accounts) {
  it("Send Eth to the contract and verify RLC balance", function() {
    var account_one = accounts[0];
    var account_two = accounts[1];
    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;


    var CrowdContract;
    var RLCcontract;

    return RLC.deployed({from: account_one}).then(function(instance){
      RLCcontract = instance;

        return Crowdsale.deployed(RLCcontract, {from: account_one});
      }).then(function(instance){
        CrowdContract = instance;

        return RLCcontract.transfer(CrowdContract.address, 87000000000000000,{from: account_one});

      }).then(function(res){
        return RLCcontract.owner.call();
      }).then(function(res){
        console.log("owner",res);

        return RLCcontract.transferOwnership(CrowdContract.address,{from: account_one});

      }).then(function(res){
        return RLCcontract.owner.call();
      }).then(function(res){
        console.log("owner",res);
        return RLCcontract.balanceOf.call(CrowdContract.address);
      }).then(function(result){
        console.log(result)
        assert.equal(result.toNumber(),87000000000000000,"test crowdsale get all RLC ");
        var myEvent = CrowdContract.Logs();
        myEvent.watch(function(err, result){
          if (err) {
                  console.log("Erreur event ", err);
                  return;
          }
          console.log("crowdsale event = ",result.args.amount,result.args.value);
        });
        
        return web3.eth.sendTransaction({from:account_two, to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:4000000});
      }).then(function(result){
        console.log(result);


        return RLCcontract.balanceOf.call(account_two);
      }).then(function(result){
        assert.equal(result.toNumber(),6000000000000,"test equal with 20% bonus")  
        // check other value rlc_bounty rlc_team rlc_reserve RLCEmitted
        return CrowdContract.rlc_bounty();
      }).then(function(result){
        assert.equal(result.toNumber(),1700600000000000,"rlc bounty part")    
      }).catch(function(err){
        console.log(err);
    });
  });
}); 