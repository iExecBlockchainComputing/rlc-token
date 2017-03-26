var Crowdsale = artifacts.require("./Crowdsale.sol");
var RLC = artifacts.require("./RLC.sol");
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


// reach the min cap and the get the token with a second payment
//

contract('Crowdsale', function(accounts) {
  it("Send Eth to the contract and verify RLC balance", function() {
    var CrowdContract;
    var RLCcontract;

// fisrt payment with acount 5
// first payment with acount 6
// first payment in BTC with account 7
// reach min cap
// account 5 second payment
// account 6 second payment
// account 7 second payment with his eth adress
// show block number
// same with finalize



    return RLC.deployed(1000,{from: accounts[0]}).then(function(instance){
      RLCcontract = instance;

        return Crowdsale.deployed(RLCcontract, accounts[1], {from: accounts[0]});
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

        return CrowdContract.BTCproxy();
      }).then(function(result){
        console.log("btcproxy = ", result.toString(), " ",accounts[1]);
// first payment with acount 2
        return web3.eth.sendTransaction({from:accounts[2], to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[2]);
      }).then(function(result){
        console.log("payment 1 acc2 via ETH",result.toNumber());
        assert.equal(result.toNumber(),0,"no RLC send min cap not reach")  

// first payment with acount 3
        return web3.eth.sendTransaction({from:accounts[3], to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[3]);
      }).then(function(result){
        console.log("payment 1 acc3 via ETH",result.toNumber());
        assert.equal(result.toNumber(),0,"no RLC send min cap not reach")  


// first payment in BTC with account 4
        return CrowdContract.receiveBTC(accounts[4], "0x004", 200000, {from:accounts[1] ,gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[4]);
      }).then(function(result){
        console.log("payment 1 acc4 via BTC",result.toNumber());
        assert.equal(result.toNumber(),0,"no RLC send min cap not reach")  

// first payment in BTC with account 5, reach the min cap
        return CrowdContract.receiveBTC(accounts[5], "0x005", 200000000000, {from:accounts[1] ,gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[5]);
      }).then(function(result){
        console.log("payment 1 acc5 via BTC",result.toNumber());
        assert.equal(result.toNumber(),0,"no RLC send min cap not reach")  

// second payment with acount 2, reached the min cap
        return web3.eth.sendTransaction({from:accounts[2], to: CrowdContract.address , value: web3.toWei(100, "finney"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[2]);
      }).then(function(result){
        console.log("payment 2 acc2 via ETH",result.toNumber());
        assert.equal(result.toNumber(),6600000000000,"RLC send min cap reached")  

// second payment with acount 3, reached the min cap
        return web3.eth.sendTransaction({from:accounts[3], to: CrowdContract.address , value: web3.toWei(100, "finney"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[3]);
      }).then(function(result){
        console.log("payment 2 acc3 via ETH",result.toNumber());
        assert.equal(result.toNumber(),6600000000000,"RLC send min cap reached") 

// second payment in BTC with account 4, reached the min cap
        return CrowdContract.receiveBTC(accounts[4], "0x004", 200000, {from:accounts[1] ,gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[4]);
      }).then(function(result){
        console.log("payment 2 acc4 via BTC",result.toNumber());
        assert.equal(result.toNumber(),24000000000,"RLC sent min cap reached")  

// second payment in BTC with account 5, reached the min cap
        return web3.eth.sendTransaction({from:accounts[5], to: CrowdContract.address , value: web3.toWei(100, "finney"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[5]);
      }).then(function(result){
        console.log("payment 2 acc5 via ETH",result.toNumber());
        assert.equal(result.toNumber(),600000000000,"RLC sent")  

        // check other value rlc_bounty rlc_team rlc_reserve RLCEmitted
        return CrowdContract.rlc_bounty();
      }).then(function(result){
        assert.equal(result.toNumber(),2901382400000000,"rlc bounty part")  
      }).catch(function(err){
        console.log(err);
    });
  });
}); 