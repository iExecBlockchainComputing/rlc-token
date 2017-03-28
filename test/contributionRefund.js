var Crowdsale = artifacts.require("./Crowdsale.sol");
var RLC = artifacts.require("./RLC.sol");
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


// reach the min cap and the get the token with a second payment
//

contract('Crowdsale', function(accounts) {
  it("Send ETH to the contract and get refund when mincapnotreach", function() {
    var CrowdContract;
    var RLCcontract;
    var acc2Bal;
    var acc2RLCbal;
    var acc3Bal;
    var acc3RLCbal;
    var acc4Bal;
    var acc4RLCBal;
    var crowdContractBal;



    return RLC.deployed({from: accounts[0]}).then(function(instance){
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

        var myEvent2 = CrowdContract.RefundETH();
        myEvent2.watch(function(err, result){
          if (err) {
                  console.log("Erreur event ", err);
                  return;
          }
          console.log("RefundETH event = ",result.args.to,result.args.value);
        });

        var myEvent3 = CrowdContract.RefundBTC();
        myEvent3.watch(function(err, result){
          if (err) {
                  console.log("Erreur event ", err);
                  return;
          }
          console.log("RefundBTC event = ",result.args.to,result.args.value);
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

// get balance before payment
        return web3.eth.getBalance(accounts[2]);
        }).then(function(result){
          console.log("acc2 balance pre payment ",result.toNumber());
        }).then(function(result){

// first payment with acount 2
        return web3.eth.sendTransaction({from:accounts[2], to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:3000000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[2]);
      }).then(function(result){
        acc2RLCbal = result.toNumber();
        assert.equal(result.toNumber(),6000000000000,"RLC send acc2")  

// get balance after payment acc2
        return web3.eth.getBalance(accounts[2]);
        }).then(function(result){
          acc2Bal = result.toNumber();
          console.log("acc2 balance post payment ",result.toNumber());

// first payment with acount 3
        return web3.eth.sendTransaction({from:accounts[3], to: CrowdContract.address , value: web3.toWei(1, "ether"), gas:300000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[3]);
      }).then(function(result){
        acc3RLCbal = result.toNumber();
        assert.equal(result.toNumber(),6000000000000,"RLC send acc3")  

// get balance after payment acc3
        return web3.eth.getBalance(accounts[3]);
        }).then(function(result){
          console.log("acc3 balance post payment ",result.toNumber());
          acc3Bal = result.toNumber();

// get CrowContract Balance
        return web3.eth.getBalance(CrowdContract.address);
        }).then(function(result){
          console.log("crowdcontract balance after payment ",result.toNumber());
          crowdContractBal = result.toNumber();

// first payment in BTC with account 4
        return CrowdContract.receiveBTC(accounts[4], "0x004", 200000, {from:accounts[1] ,gas:300000});
      }).then(function(result){
        return RLCcontract.balanceOf.call(accounts[4]);
      }).then(function(result){
        console.log("payment 1 acc4 via BTC",result.toNumber());
        acc4RLCbal = result.toNumber();
        assert.equal(result.toNumber(),12000000000,"RLC send BTC") 

// manually set crowdsale to the end (temp hack for test only)
        return CrowdContract.closeCrowdsaleForRefund()
      }).then(function(result){

// call the refund function acc2 , and the withdrawPaymentfunction (pullpayment)
        return RLCcontract.approveAndCall(CrowdContract.address,acc2RLCbal,"","", {from:accounts[2] ,gas:300000}); // will throw if its not the right amount of RLC send back
      }).then(function(result){
        return CrowdContract.withdrawPayments({from:accounts[2] ,gas:300000});
      }).then(function(result){
// get balance after refund acc2
        return web3.eth.getBalance(accounts[2]);
        }).then(function(result){
          console.log("acc2 bal after payment ",acc2Bal," -- acc2 bal after refund ",result.toNumber());
           assert(result.toNumber() > acc2Bal,"the acc2 is refund")  
// check RLC bal acc2 after refund
        return RLCcontract.balanceOf.call(accounts[2]);
      }).then(function(result){
        console.log("RLC balance acc2 post refund",result.toNumber());
        assert.equal(result.toNumber(),0,"RLC send")  

// call the refund function acc3, , and the withdrawPaymentfunction (pullpayment)
        return RLCcontract.approveAndCall(CrowdContract.address,acc3RLCbal,"","", {from:accounts[3] ,gas:300000}); // will throw if its not the right amount of RLC send back
      }).then(function(result){
        return CrowdContract.withdrawPayments({from:accounts[3] ,gas:300000});
      }).then(function(result){
// get balance after refund acc2
        return web3.eth.getBalance(accounts[3]);
        }).then(function(result){
          console.log("acc3 bal after payment ",acc3Bal," -- acc2 bal after refund ",result.toNumber());
          assert(result.toNumber() > acc3Bal,"the acc3 is refund")  // true even with gas used, approx 1 eth
// check RLC bal acc3 after refund
        return RLCcontract.balanceOf.call(accounts[3]);
      }).then(function(result){
        console.log("RLC balance acc3 post refund",result.toNumber());
        assert.equal(result.toNumber(),0,"RLC send")  

// get CrowContract Balance after refund
        return web3.eth.getBalance(CrowdContract.address);
        }).then(function(result){
          console.log("crowdcontract balance after refund ",result.toNumber());
          assert.notEqual(crowdContractBal,result.toNumber());

// call the refund function acc4
        return RLCcontract.approveAndCall(CrowdContract.address,acc4RLCbal,"","", {from:accounts[4] ,gas:300000}); // will throw if its not the right amount of RLC send back
      }).then(function(result){
        // manually check on the log than we get the right event


        // check other value rlc_bounty rlc_team rlc_reserve RLCEmitted
        return CrowdContract.rlc_bounty();
      }).then(function(result){
        assert.equal(result.toNumber(),1701201200000000,"rlc bounty part")  
      }).catch(function(err){
        console.log(err);
    });
  });
}); 