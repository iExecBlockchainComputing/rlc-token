pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/RLC.sol";
import "../contracts/Crowdsale.sol";

contract TestCrowdsale {
  RLC rlc;
  Crowdsale cs;

  function beforeAll() {
    rlc = RLC(DeployedAddresses.RLC());
    cs = Crowdsale(DeployedAddresses.Crowdsale());
  }

  function testInitialBalanceUsingDeployedContract() {
    uint expected = 10;
    Assert.equal(cs.minCap(), expected, "Owner should have 10 RLC initially");
  }
/*
  function testReceiveETHOwner() {
    cs.receiveETHOwner(0x7Fc5b1d839016c6Eae93dA025236E0496Ce8c21c, 1 ether);
  }
*/
}