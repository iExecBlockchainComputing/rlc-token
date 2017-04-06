var Crowdsale = artifacts.require("./Crowdsale.sol");
var RLC = artifacts.require("./RLC.sol");
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


// reach the min cap and the get the token with a second payment
//

contract('Crowdsale', function(accounts, network) {
  it("Send Eth and BTC to the contract and verify RLC balance", function() {
    var CrowdContract;
    var RLCcontract;
    var TotalRlcEmitETHBTC = 0;
    var crowdContractbalance = 0;
    var teamRLC = 0;
    var reserveRLC = 0;
    var bountyRLC = 0;
console.log("net ", network);

//    if (network == "ropsten") {

        var owner = "0x7c34db57c20eab8f1fca9b76b93d44f65338dae7";
        var btcproxy = "0x5081be2f9d34f70a4946d3c3972348fc952ae110";
        var firstcust = "0xdb9e7c7eba7041a61d17017e32b826c636784353";
        var seccust = "0xc3782c4bd2ac23a4e3bbaeb27eb323c4be218495";
        var thirdcust = "0xb3be7a782dc6fa78b2e233bc1c41bb3d493aecb8";
        var fourthcust = "0xc50cde425f7cb96839d8133f7af26c9b9ebcc488";


/*      var owner = accounts[0];
      var btcproxy = accounts[1];
      var firstcust = accounts[2];
      var seccust = accounts[3];
      var thirdcust = accounts[4];
      var fourthcust = accounts[5];*/




    return RLC.deployed({from: owner}).then(function(instance){
      RLCcontract = instance;

        return Crowdsale.deployed(RLCcontract, btcproxy, {from: owner});
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
        return RLCcontract.transfer(CrowdContract.address, 87000000000000000,{from: owner});
      }).then(function(res){
        return RLCcontract.transferOwnership(CrowdContract.address,{from: owner});
      }).then(function(res){
        return RLCcontract.balanceOf.call(CrowdContract.address);
      }).then(function(result){
        assert.equal(result.toNumber(),87000000000000000,"test crowdsale get all RLC ");
        console.log("address = ",CrowdContract.address);
        return CrowdContract.BTCproxy();
      }).then(function(result){
        console.log("btcproxy = ", result.toString(), " ",btcproxy);

// first payment with acount 2
        return web3.eth.sendTransaction({from:firstcust, to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(firstcust);
      }).then(function(result){
        console.log("payment 1 acc2 via ETH",result.toNumber());
        //assert.equal(result.toNumber(),240000000000,"RLC send")  

// first payment with acount 3
        return web3.eth.sendTransaction({from:seccust, to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(seccust);
      }).then(function(result){
        console.log("payment 1 acc3 via ETH",result.toNumber());
        //assert.equal(result.toNumber(),240000000000,"RLC send")  

// first payment in BTC with account 4
        return CrowdContract.receiveBTC(thirdcust, "0x004", 200000, "tsxid", {from:btcproxy ,gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(thirdcust);
      }).then(function(result){
        console.log("payment 1 acc4 via BTC",result.toNumber());
        //assert.equal(result.toNumber(),12000000000,"RLC send")  

// first payment in BTC with account 5, reach the min cap
        return CrowdContract.receiveBTC(fourthcust, "0x005", 200000000000, "tsxid", {from:btcproxy ,gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(fourthcust);
      }).then(function(result){
        console.log("payment 1 acc5 via BTC",result.toNumber());
        //assert.equal(result.toNumber(),12000000000000000,"RLC send")  

// second payment with acount 2, reached the min cap
        return web3.eth.sendTransaction({from:firstcust, to: CrowdContract.address , value: web3.toWei(100, "finney"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(firstcust);
      }).then(function(result){
        console.log("payment 2 acc2 via ETH",result.toNumber());
        //assert.equal(result.toNumber(),264000000000,"RLC send min cap reached")  

// second payment with acount 3, reached the min cap
        return web3.eth.sendTransaction({from:seccust, to: CrowdContract.address , value: web3.toWei(100, "finney"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(seccust);
      }).then(function(result){
        console.log("payment 2 acc3 via ETH",result.toNumber());
        //assert.equal(result.toNumber(),264000000000,"RLC send min cap reached") 

// second payment in BTC with account 4, reached the min cap
        return CrowdContract.receiveBTC(thirdcust, "0x004", 200000, "tsxid", {from:btcproxy ,gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(thirdcust);
      }).then(function(result){
        console.log("payment 2 acc4 via BTC",result.toNumber());
        //assert.equal(result.toNumber(),24000000000,"RLC sent min cap reached")  

// second payment in BTC with account 5, reached the min cap
        return web3.eth.sendTransaction({from:fourthcust, to: CrowdContract.address , value: web3.toWei(100, "finney"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(fourthcust);
      }).then(function(result){
        console.log("payment 2 acc5 via ETH",result.toNumber());
        //assert.equal(result.toNumber(),12000024000000000,"RLC sent")  

// check total rlc sent via BTC and ETH payment
        return CrowdContract.RLCSentToETH();
      }).then(function(result){
        console.log('RLCSentToETH ',result.toNumber())
        TotalRlcEmitETHBTC += result.toNumber();
        return CrowdContract.RLCSentToBTC();
      }).then(function(result){
        console.log('RLCSentToBTC ',result.toNumber())
        TotalRlcEmitETHBTC += result.toNumber();
        console.log("total RLC via BTC ETH", TotalRlcEmitETHBTC);

// check crowdcontract balance
        return web3.eth.getBalance(CrowdContract.address);
      }).then(function(result){
        console.log("crowdcontract balance before finalise = ",result.toNumber());
        crowdContractbalance = result.toNumber();

// check contract RLC supply before finalising
        return RLCcontract.balanceOf.call(CrowdContract.address); // reserve address
      }).then(function(result){
        console.log("RLC still on crowdcontract before finalise ",result.toNumber());
        assert.equal(result.toNumber(),87000000000000000 - TotalRlcEmitETHBTC,"right amount on the contrat balance")  

// finalise crowdsale and check contract balance
        return  CrowdContract.finalizeTEST({from:owner ,gas:3000000});
      }).then(function(result){
        return web3.eth.getBalance(CrowdContract.address);
      }).then(function(result){
        console.log("crowdcontract balance after finalise = ",result.toNumber());
        assert.equal(result.toNumber(), 0,"Crowdcontract is empty");

// check multisig adress balance after finalise
        return CrowdContract.multisigETH();
      }).then(function(result){
        console.log("addr multisig ", result.toString());
        return web3.eth.getBalance(result.toString());
      }).then(function(result){
        console.log("multisig balance after finalise = ",result.toNumber());
        assert.equal(result.toNumber(), crowdContractbalance,"Multisig get all the ETH the contract had before the finalise()");

// check the team reserve and bounty allocation
        return RLCcontract.balanceOf.call("0x1000000000000000000000000000000000000000"); // team address
      }).then(function(result){
        console.log("team RLC ",result.toNumber());
        teamRLC = 12000000000000000 + (TotalRlcEmitETHBTC /20);
        assert.equal(result.toNumber(),teamRLC,"RLC sent to team")  

        return RLCcontract.balanceOf.call("0x3000000000000000000000000000000000000000"); // reserve address
      }).then(function(result){
        console.log("bounty RLC ",result.toNumber());
        bountyRLC = 1700000000000000 + (TotalRlcEmitETHBTC /10);
        assert.equal(result.toNumber(), bountyRLC, "RLC sent to bounty");

        return RLCcontract.balanceOf.call("0x2000000000000000000000000000000000000000"); // bounty address
      }).then(function(result){
        console.log("reserve RLC ",result.toNumber());
        reserveRLC = 1700000000000000 + (TotalRlcEmitETHBTC /10);
        assert.equal(result.toNumber(), reserveRLC, "RLC sent to reserve");

// check crowdcontract RLC supply after finalise
        return RLCcontract.balanceOf.call(CrowdContract.address); // reserve address
      }).then(function(result){
        console.log("RLC still on crowdcontract after finalise ",result.toNumber());
        assert.equal(result.toNumber(),0,"No more token available")  

// get the total burnt
        return RLCcontract.balanceOf.call("0x1b32000000000000000000000000000000000000"); // reserve address
      }).then(function(result){
        console.log("Burnt token ",result.toNumber());
        assert.equal(result.toNumber() + bountyRLC + reserveRLC + teamRLC + TotalRlcEmitETHBTC,87000000000000000,"We get the final right number")  

      }).catch(function(err){
        console.log(err);
    });
  });
}); 