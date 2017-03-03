pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/RLC.sol";

contract TestRLC {

  function testInitialBalanceUsingDeployedContract() {
    RLC meta = RLC(DeployedAddresses.RLC());

    uint expected = 100000000000000000;

    Assert.equal(meta.balanceOf(tx.origin), expected, "Owner should have 100000000000000000 RLC initially");
  }

}
