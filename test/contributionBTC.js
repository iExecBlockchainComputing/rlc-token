var Crowdsale = artifacts.require("./Crowdsale.sol");
var RLC = artifacts.require("./RLC.sol");
var Web3 = require('web3');

web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

    var CrowdContract;
    var RLCcontract

contract('Crowdsale', function(accounts) {
  it("Send Eth to the contract and verify RLC balance", function() {
    var account_one = accounts[0];
    var account_two = accounts[1];
    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    return RLC.deployed({from: account_one}).then(function(instance){
      RLCcontract = instance;

      var myEvent = RLCcontract.allEvents();
      myEvent.watch(function(err, result){
        if (err) {
                console.log("Erreur event ", err);
                return;
        }
        console.log("Token event = ",result.args.to,result.args.value);
              //console.log("Event = ", JSON.parse(result.args.value));
      });
      return Crowdsale.deployed(RLCcontract,{from: account_one});
      }).then(function(instance){
        CrowdContract = instance;
        return RLCcontract.transfer(CrowdContract.address, 87000000000000000);
      }).then(function(instance){
        var myEvent = CrowdContract.allEvents();
        myEvent.watch(function(err, result){
          if (err) {
                  console.log("Erreur event ", err);
                  return;
          }
          console.log("crowdsale event = ",result.args.amount,result.args.value);
        });



        // call receiveBTC with right parameters

        return web3.eth.sendTransaction({from:account_two, to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:4700000});
      }).then(function(result){
        console.log(result);
        return RLCcontract.balanceOf.call(account_two);
      }).then(function(result){
        assert.equal(result.toNumber(),6000,"test equal with 20% bonus")
      }).catch(function(err){
        console.log(err);
    });
  });
}); 