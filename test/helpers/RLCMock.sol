pragma solidity ^0.4.8;


import '../../contracts/RLC.sol';


// mock class using RLC
contract RLCMock is RLC {

  function RLCMock(address initialAccount, uint initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
