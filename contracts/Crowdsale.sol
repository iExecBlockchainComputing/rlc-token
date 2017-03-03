pragma solidity ^0.4.8;

import "./SafeMath.sol";
import "./RLC.sol";

/*
  
  Crowdsale Smart Contract for the iEx.ec project

  This smart contract collects ETH and BTC, and in turn emits RLC tokens

  Thanks to BeyondTheVoid who helped us shaping this code.

 */

contract Crowdsale {

  	struct BackerETH {
	  uint weiReceived;	// Amount of ETH given
	  uint rlcToSend;  	// rlc to distribute when the min cap is reached
	}

  	struct BackerBTC {
	  string btc_address;  //store the btc address (?)
	  uint satoshiReceived;	// Amount of BTC given
	  uint rlcToSend;   	// rlc to distribute when the min cap is reached
	}

	RLC 	public rlc;         // RLC contract reference
	address public owner;       // Contract owner (iEx.ec team)
	address public multisigETH; // Multisig contract that will receive the ETH
	uint public RLCPerETH;      // Number of RLC per ETH
	uint public RLCPerBTC;      // Number of RLC per BTC
	uint public receivedETH;    // Number of ETH received
	uint public receivedBTC;    // Number of BTC received
	uint public RLCSentToETH;   // Number of RLC sent to ETH contributors
	uint public RLCSentToBTC;   // Number of RLC sent to BTC contributors
	uint public startBlock;     // Crowdsale start block
	uint public endBlock;       // Crowdsale end block
	uint public minCap;         // Minimum number of RLC to distribute
	uint public maxCap;         // Maximum number of RLC to distribute
	bool public minCapReached;  // Min cap has been reached
	bool public maxCapReached;  // Max cap has been reached
	uint public minInvestETH;   // Minimum amount to invest

	mapping(address => BackerETH) public backersETH; //backersETH indexed by their ETH address
	mapping(address => BackerBTC) public backersBTC; //backersBTC indexed by their (BTC,ETH) address

    // Auth modifier, if the msg.sender isn't the expected address, throw.
	modifier onlyBy(address a){
	    if (msg.sender != a) throw;  
	    _;
	}

	event ETHReceived(address);
	event BTCReceived(string,address);

	// Constructor of the contract.
	function Crowdsale(address _token) {
		
	  //set the different variables
	  owner = msg.sender;
	  rlc = RLC(_token); 	// RLC contract address
	  multisigETH = 0x8cd6B3D8713df6aA35894c8beA200c27Ebe92550;
	  minInvestETH = 100 finney; // approx 1 USD
	  startBlock = 1 ;            // now (testnet)
	  endBlock =  1578450;        // ever (testnet) startdate + 30 days
	  RLCPerBTC = 50000;         // 5000 RLC par BTC == 50,000 RLC per satoshi
	  RLCPerETH = 5000;          // FIXME
	  minCap=10;
	  maxCap=80000000000;
	}

	// The anonymous function corresponds to a donation in ETH
	function(){
	  receiveETH(msg.sender);
	}
	
	
	function receiveETH(address beneficiary) payable{
	  //don't accept funding under a predefined treshold
	  if (msg.value < minInvestETH) throw;

	  // if we are in the correct time slot
	  if ((now > startBlock) || (now < endBlock )) throw;  

	  //compute the number of RLC to send
	  uint rlcToSend = bonus((msg.value*RLCPerETH)/(1 ether));
	  
	  //update the backer
	  BackerETH backer = backersETH[beneficiary];
	  backer.weiReceived += msg.value;
	  
	  if (!transferRLC(beneficiary, rlcToSend)) throw;     
	  
	  receivedETH += msg.value;    // Update the total wei collcted during the crowdfunding     
	  RLCSentToETH += rlcToSend;
	  minCapReached = (RLCSentToETH + RLCSentToBTC) > minCap;

	  ETHReceived(beneficiary);
	  
	}

	// When the minimum cap is reached, ETH are moved to a specific address
	function withdrawETH(address to, uint amount) onlyBy (owner){
	  if (!minCapReached) throw;
	  var r = to.send(amount);
	}

	// When the minimum cap is reached, RLC are moved to a specific address
	function withdrawRLC(address to, uint amount) onlyBy(owner){
	  if (!minCapReached) throw;
	  rlc.transfer(to, amount);
	}

	/*
	  Compute the RLC bonus
	*/
	function bonus(uint amount) returns (uint) {
	  if (now < (startBlock + 10 days)) return (amount + amount/5);
	  if (now < startBlock + 20 days) return (amount + amount/10);
	  return amount;
	}
	/*
	  Transfer RLC to backers
	  Assumes that the owner of the token contract and the crowdsale contract is the same
	 */
	function transferRLC(address to, uint amount) internal returns (bool) {
	  return rlc.transfer(to, amount);
	}
}

