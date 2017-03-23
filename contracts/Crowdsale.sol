pragma solidity ^0.4.8;
import "./SafeMath.sol";
import "./RLC.sol";

/*
  Crowdsale Smart Contract for the iEx.ec project

  This smart contract collects ETH and BTC, and in return emits RLC tokens to the backers

  Thanks to BeyondTheVoid and TokenMarket who helped us shaping this code.

 */

// TODO 
// Comment vont faire les gars qui ont investit en BTC avant le min cap pour recuperer leur rlc?
// add lockable to RLC transfer only for owner
// add emergency stop

// TEST:
// test differente timeframe
// test multiple invest
// test claim ETH


contract Crowdsale is SafeMath {

	// temp logs
	event Logs(address indexed from, uint amount, string value);

  	struct BackerETH {
	  uint weiReceived;	// Amount of ETH given
	  uint rlcToSend;  	// rlc to distribute when the min cap is reached
	}

  	struct BackerBTC {
	  string btc_address;  //store the btc address for full tracability
	  uint satoshiReceived;	// Amount of BTC given
	  uint rlcToSend;   	// rlc to distribute when the min cap is reached
	}

	RLC 	public rlc;         // RLC contract reference
	address public owner;       // Contract owner (iEx.ec team)
	address public multisigETH; // Multisig contract that will receive the ETH
	address public BTCproxy;	// addess of the BTC Proxy

	uint public RLCPerETH;      // Number of RLC per ETH
	uint public RLCPerBTC;      // Number of RLC per BTC
	uint public RLCPerSATOSHI;  // Number of RLC per SATOSHI
	uint public ETHReceived;    // Number of ETH received
	uint public BTCReceived;    // Number of BTC received
	uint public RLCSentToETH;   // Number of RLC sent to ETH contributors
	uint public RLCSentToBTC;   // Number of RLC sent to BTC contributors
	uint public RLCEmitted;		// Number of RLC emitted 
	uint public startBlock;     // Crowdsale start block
	uint public endBlock;       // Crowdsale end block
	uint public minCap;         // Minimum number of RLC to sell
	uint public maxCap;         // Maximum number of RLC to sell
	bool public maxCapReached;  // Max cap has been reached
	uint public minInvestETH;   // Minimum amount to invest
	uint public minInvestBTC;   // Minimum amount to invest
	bool public crowdsaleClosed;// Is crowdsale still on going
	
	address public bounty;		// address at which the bounty RLC will be sent
	address public reserve; 	// address at which the contingency reserve will be sent
	address public team;		// address at which the team RLC will be sent

	uint public rlc_bounty;		// amount of bounties RLC
	uint public rlc_reserve;	// amount of the contingency reserve
	uint public rlc_team;		// amount of the team RLC 
	
	mapping(address => BackerETH) public backersETH; //backersETH indexed by their ETH address
	mapping(address => BackerBTC) public backersBTC; //backersBTC indexed by their (BTC,ETH) address

    // Auth modifier, if the msg.sender isn't the expected address, throw.
	modifier onlyBy(address a){
	    if (msg.sender != a) throw;  
	    _;
	}

	event receivedETH(address addr, uint value);
	event receivedBTC(address addr, string from, uint value);
	event RefundBTC(string to, uint value);
	// Constructor of the contract.
	function Crowdsale(address _token) {
		
	  //set the different variables
	  owner = msg.sender;
	  BTCproxy = 0x8cd6B3D8713df6aA35894c8beA200c27Ebe92550; // to change
	  //RLC = Token(0x0a8f269d52fad5f0f6297a264f48cbb290c68130); 	// RLC contract address
	  rlc = RLC(_token); 	// RLC contract address
	  multisigETH = 0x8cd6B3D8713df6aA35894c8beA200c27Ebe92550;
	  RLCSentToETH = 0;
	  minInvestETH = 100 finney; // 0.1 ether
	  minInvestBTC = 100000;     // approx 1 USD or 0.00100000 BTC
	  startBlock = now ;            // now (testnet)
	  endBlock =  now + 30 days;    // ever (testnet) startdate + 30 days
	  //RLCPerBTC = 50000000000000;         // 5000 RLC par BTC == 50,000 RLC per satoshi
	  RLCPerETH = 5000000000000;          // FIXME
	  RLCPerSATOSHI = 50000;         // 5000 RLC par BTC == 50,000 RLC per satoshi
	  minCap=12000000000000000;
	  maxCap=60000000000000000;
	  rlc_bounty=1700000000000000;		
	  rlc_reserve=17000000000000000;
	  rlc_team=12000000000000000;
	  RLCEmitted = rlc_bounty + rlc_reserve + rlc_team;
	}

	/* 
	* The fallback function corresponds to a donation in ETH
	*/
	function() payable	{
	  receiveETH(msg.sender);
	}

	/*
	*	Receives a payment in ETH
	*/
	function receiveETH(address beneficiary) payable {
// TODO check for msg.value coherent ?

	  //don't accept funding under a predefined treshold
	  if (msg.value < minInvestETH) throw;  

	  // check if we are in the correct time slot
	  if ((now < startBlock) || (now > endBlock )) throw;  

	  //compute the number of RLC to send
	  uint rlcToSend = bonus((msg.value*RLCPerETH)/(1 ether));
	  //uint rlcToSend = bonus((msg.value*RLCPerFINNEY)/(1 finney));

	  // check if we are not reaching the maxCap by accepting this payment
	  if ((rlcToSend + RLCSentToETH + RLCSentToBTC) > maxCap) throw;
	  
	  // check that the same ETH address has not be used for BTC payment to facilitate refund
	 if (backersBTC[beneficiary].satoshiReceived > 0) throw;
	  
	  //update the backer
	  BackerETH backer = backersETH[beneficiary];

	  // if the min cap is reached, token transfer happens immediately possibly along
	  // with the previous payment
	  if(isMinCapReached()) {
	  	Logs(msg.sender,rlcToSend + backer.rlcToSend, "1st list");
		if (!transferRLC(beneficiary, rlcToSend + backer.rlcToSend)) throw;     // Do the transfer right now 
			backer.rlcToSend=0;
	  } else {
	      //if not we provision them to be paid or reclaimed later
		  //backer.rlcToSend += rlcToSend;
		  backer.rlcToSend = safeAdd(backer.rlcToSend, rlcToSend);
	  }
	  
	  //backer.weiReceived += msg.value;
	  backer.weiReceived = safeAdd(backer.weiReceived, msg.value);
	  //ETHReceived += msg.value;    // Update the total wei collcted during the crowdfunding    
	  ETHReceived = safeAdd(ETHReceived, msg.value) ;
	  //RLCSentToETH += rlcToSend;   // Update the total wei collcted during the crowdfunding
	  RLCSentToETH = safeAdd(RLCSentToETH, rlcToSend);

	  emitRLC(rlcToSend);
	  
	  // send the corresponding contribution event
	  receivedETH(beneficiary,ETHReceived);
	}
	
	/*
	* receives a payment in BTC
	*/
	

	// Refund BTC in JS if function throw

	function receiveBTC(address beneficiary, string btc_address, uint value) onlyBy(BTCproxy){
	  //don't accept funding under a predefined treshold
	  if (value < minInvestBTC) throw;  

	  // if we are in the correct time slot
	  if ((now < startBlock) || (now > endBlock )) throw;  

	  // check that the same ETH address has not be used for ETH payment to facilitate refund
	  if (backersETH[beneficiary].weiReceived > 0) throw;

	  //compute the number of RLC to send
	  uint rlcToSend = bonus((value*RLCPerBTC));

	  // check if we are not reaching the maxCap
	  if ((rlcToSend + RLCSentToETH + RLCSentToBTC) > maxCap) throw;

	  //update the backer
	  BackerBTC backer = backersBTC[beneficiary];

	  // if the min cap is reached, token transfer happens immediately possibly along
	  // with the previous payment
	  if(isMinCapReached()) {
		  if (!transferRLC(beneficiary, rlcToSend + backer.rlcToSend)) throw;     // Do the transfer right now 
		  backer.rlcToSend=0;
	  } else {
	      //if not we provision them to be paid or reclaimed later
		  backer.rlcToSend += rlcToSend;
	  }

	  backer.btc_address = btc_address;
	  //backer.satoshiReceived += value;
	  backer.satoshiReceived = safeAdd(backer.satoshiReceived, value);

	  //BTCReceived += value;    // Update the total satoshi collcted during the crowdfunding   
	  BTCReceived =  safeAdd(BTCReceived, value);
	  //RLCSentToBTC += rlcToSend;
	  RLCSentToBTC = safeAdd(RLCSentToBTC, rlcToSend);
	  emitRLC(rlcToSend);
	  
	  receivedBTC(beneficiary, btc_address, BTCReceived);
	}
	
	function isMinCapReached() returns (bool) {
		return (RLCSentToETH + RLCSentToBTC ) > minCap;
	}

	function isMaxCapReached() returns (bool) { 
		return (RLCSentToETH + RLCSentToBTC ) == maxCap;
	}

	// Compute the variable part
	function emitRLC(uint amount) internal {
		Logs(msg.sender ,amount, "emitRLC");
		rlc_bounty+=amount/10;      // bounty is 10% of the crowdsale
		rlc_team+=amount/20;        // team is 5% of the crowdsale
		rlc_reserve+=amount/10; 	// contingency is 10% of the crowdsale
		RLCEmitted+=amount + amount/4;	// adjust the total number of RLC emitted
	}

	/*
	  Compute the RLC bonus according to the investment period
	*/
	function bonus(uint amount) returns (uint) {
	  if (now < (startBlock + 10 days)) return (amount + amount/5);  // bonus 20%
	  if (now < startBlock + 20 days) return (amount + amount/10);  // bonus 10%
	  return amount;
	}
	
	/*
	 * Transfer RLC to backers
	 * Assumes that the owner of the token contract and the crowdsale contract is the same
	 */
	function transferRLC(address to, uint amount) internal returns (bool) {
	  return rlc.transfer(to, amount);
	}

	/* 
	* After the end of the crowdsale let user reclaimed their RLC if minCap has not been reached.
	* It must be sent from the backer address
	*/
	function claimRLC() {
		if ((now<endBlock) || isMinCapReached() || (now > endBlock + 15 days)) throw;
		uint amount=backersETH[msg.sender].rlcToSend;
		if (amount !=0 ) {
			if (!rlc.transfer(msg.sender,amount)) throw;
			backersETH[msg.sender].rlcToSend=0;
			//transfer the corresponding amount to the multisig address
			if (!multisigETH.send(backersETH[msg.sender].weiReceived)) throw;
			backersETH[msg.sender].weiReceived=0;
		} else {
			amount = backersBTC[msg.sender].rlcToSend;
			if (!rlc.transfer(msg.sender,amount)) throw;
			backersBTC[msg.sender].rlcToSend=0;
			backersBTC[msg.sender].satoshiReceived=0;
		}
	}

	/* 
	* After the end of the crowdsale let user reclaimed their ETH if minCap has not been reached.
	* It must be sent from the backer address
	*/
	function claimETH() {
		//check if we are in the correct time frame and if the 
/*
		if ((now<endBlock) || isMinCapReached() || (now > endBlock + 15 days)) throw;
		if (!msg.sender.send(backersETH[msg.sender].weiReceived)) throw;
		backersETH[msg.sender].weiReceived=0;
		//reverse sold RLC to the team
		backersETH[msg.sender].rlcToSend=0;
		*/

		if ((now<endBlock) || isMinCapReached() || (now > endBlock + 15 days)) throw;
		uint valToSend = backersETH[msg.sender].weiReceived;
		backersETH[msg.sender].weiReceived=0;
		backersETH[msg.sender].rlcToSend=0;
		if (!msg.sender.send(valToSend)) throw;
	}

	/* 
	* After the end of the crowdsale let user reclaimetheir BTC if minCap has not been reached.
	* It must be sent from the backer address
	*/
	/*
	function claimBTC(address beneficiary) onlyBy(BTCproxy) {
		if ((now<endBlock) || isMinCapReached() || (now > endBlock + 15 days)) throw;
		uint valueToSend = backersBTC[msg.sender].satoshiReceived;
		backersBTC[msg.sender].satoshiReceived=0;
		//reverse sold RLC to the team
		backersETH[msg.sender].rlcToSend=0;
		RefundBTC(backersBTC[msg.sender].btc_address ,valueToSend);

	}
	*/
	function claimBTC() {
		if ((now<endBlock) || isMinCapReached() || (now > endBlock + 15 days)) throw;
		uint valueToSend = backersBTC[msg.sender].satoshiReceived;
		backersBTC[msg.sender].satoshiReceived=0;
		//reverse sold RLC to the team
		backersETH[msg.sender].rlcToSend=0;
		RefundBTC(backersBTC[msg.sender].btc_address ,valueToSend);
	}

	/*
	* Update the rate RLC per ETH, computed externally by using the BTCETH index
	*/
	function setRLCPerETH(uint rate) onlyBy(BTCproxy) {
		RLCPerETH=rate;
	}
	
	/*	
	* Finalize the crowdsale, should be called after the refund period
	*/
	function finalize() onlyBy(owner) {
		if ((now > endBlock + 10 days ) && (now < endBlock + 60 days)) throw;
		//moves the remaining ETH to the multisig address
		if (!multisigETH.send(this.balance)) throw;
		//moves RLC to the team, reserve and bounty address
	    if (!transferRLC(team,rlc_team)) throw;
	    if (!transferRLC(reserve,rlc_reserve)) throw;	
	    if (!transferRLC(bounty,rlc_bounty)) throw;
	    rlc.burn(rlc.totalSupply() - RLCEmitted);
		crowdsaleClosed = true;
	}
}

