pragma solidity ^0.4.8;
import "./SafeMath.sol";
import "./RLC.sol";
import "./PullPayment.sol";
import "./Pausable.sol";

/*
  Crowdsale Smart Contract for the iEx.ec project

  This smart contract collects ETH and BTC, and in return emits RLC tokens to the backers

  Thanks to BeyondTheVoid and TokenMarket who helped us shaping this code.

*/

contract Crowdsale is SafeMath, PullPayment, Pausable {

  	struct Backer {
  	  uint weiReceived;	// Amount of ETH given
	  string btc_address;  //store the btc address for full traceability
	  uint satoshiReceived;	// Amount of BTC given
	  uint rlcToSend;   	// rlc to distribute when the min cap is reached
	  uint rlcSent;
	}

	RLC 	public rlc;         // RLC contract reference
	address public owner;       // Contract owner (iEx.ec team)
	address public multisigETH; // Multisig contract that will receive the ETH
	address public BTCproxy;	// address of the BTC Proxy

	uint public RLCPerETH;      // Number of RLC per ETH
	uint public RLCPerSATOSHI;  // Number of RLC per SATOSHI
	uint public ETHReceived;    // Number of ETH received
	uint public BTCReceived;    // Number of BTC received
	uint public RLCSentToETH;   // Number of RLC sent to ETH contributors
	uint public RLCSentToBTC;   // Number of RLC sent to BTC contributors
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
	mapping(address => Backer) public backers; //backersETH indexed by their ETH address

    // Auth modifier, if the msg.sender isn't the expected address, throw.
	modifier onlyBy(address a){
	    if (msg.sender != a) throw;  
	    _;
	}

	modifier minCapNotReached() {
		if ((now<endBlock) || RLCSentToETH + RLCSentToBTC > minCap ) throw;
		_;
	}

	modifier respectTimeFrame() {
		if ((now < startBlock) || (now > endBlock )) throw;
		_;
	}

	/*
	 * Event
	 */
	event ReceivedETH(address addr, uint value);
	event ReceivedBTC(address addr, string from, uint value, string txid);
	event RefundBTC(string to, uint value);
	event Logs(address indexed from, uint amount, string value);

	/*
	 *	Constructor
	 */
	function Crowdsale(address _token, address _btcproxy) {

		//set the different variables
		owner = msg.sender;
		BTCproxy = _btcproxy; // to change
		rlc = RLC(_token); 	// RLC contract address
		multisigETH = 0x8cd6B3D8713df6aA35894c8beA200c27Ebe92550;
		team = 0x1000000000000000000000000000000000000000;
		reserve = 0x2000000000000000000000000000000000000000;
		bounty = 0x3000000000000000000000000000000000000000;
		RLCSentToETH = 0;
		RLCSentToBTC = 0;
		minInvestETH = 100 finney; // 0.1 ether
		minInvestBTC = 1000000;     // approx 10 USD or 0.01000000 BTC
		startBlock = 0 ;            	// should wait for the call of the function start
		endBlock =  0;  				// should wait for the call of the function start
		RLCPerETH = 200000000000;    // FIXME  will be update
		RLCPerSATOSHI = 50000;         // = 5000,000000000 RLC per BTC 
		minCap=12000000000000000;
		maxCap=60000000000000000;
		rlc_bounty=1700000000000000;		// max 6000000 RLC
		rlc_reserve=1700000000000000;		// max 6000000 RLC
		rlc_team=12000000000000000;
	}

	/* 
	 * The fallback function corresponds to a donation in ETH
	 */
	function() payable {
		if (now > endBlock) throw;
		receiveETH(msg.sender);
	}

	/* 
	 * To call to start the crowdsale
	 */
	function start() onlyBy(owner) {
		startBlock = now ;            
		endBlock =  now + 30 days;    
	}

	/*
	 *	Receives a donation in ETH
	 */
	function receiveETH(address beneficiary) internal stopInEmergency respectTimeFrame {

		//don't accept funding under a predefined threshold
		if (msg.value < minInvestETH) throw;  

		//compute the number of RLC to send
		uint rlcToSend = bonus(safeMul(msg.value,RLCPerETH)/(1 ether));

		// check if we are not reaching the maxCap by accepting this donation
		if (safeAdd(rlcToSend, safeAdd(RLCSentToETH, RLCSentToBTC)) > maxCap) throw;

		//update the backer
		Backer backer = backers[beneficiary];

		if (!rlc.transfer(beneficiary, rlcToSend)) throw;     // Do the transfer right now 

		backer.rlcSent = safeAdd(backer.rlcSent, rlcToSend);
		backer.weiReceived = safeAdd(backer.weiReceived, msg.value); // Update the total wei collected during the crowdsale     
		ETHReceived = safeAdd(ETHReceived, msg.value); // Update the total wei collected during the crowdsale
		RLCSentToETH = safeAdd(RLCSentToETH, rlcToSend);

		emitRLC(rlcToSend);
		// send the corresponding contribution event
		ReceivedETH(beneficiary,ETHReceived);
	}
	
	/*
	 * receives a donation in BTC
	 */
	function receiveBTC(address beneficiary, string btc_address, uint value, string txid) stopInEmergency respectTimeFrame onlyBy(BTCproxy) returns (bool res){

		if (value < minInvestBTC) throw;  // the verif is made by btcproxy 

		//compute the number of RLC to send
		uint rlcToSend = bonus(safeMul(value,RLCPerSATOSHI));
		if (safeAdd(rlcToSend, safeAdd(RLCSentToETH, RLCSentToBTC)) > maxCap) {
			RefundBTC(btc_address , value);
			return false;
		}

		//update the backer
		Backer backer = backers[beneficiary];

		if (!rlc.transfer(beneficiary, rlcToSend)) throw;     // Do the transfer right now 

		backer.rlcSent = safeAdd(backer.rlcSent , rlcToSend);
		backer.btc_address = btc_address;
		backer.satoshiReceived = safeAdd(backer.satoshiReceived, value);
		BTCReceived =  safeAdd(BTCReceived, value);// Update the total satoshi collected during the crowdsale 
		RLCSentToBTC = safeAdd(RLCSentToBTC, rlcToSend);
		emitRLC(rlcToSend);
		ReceivedBTC(beneficiary, btc_address, rlcToSend, txid);
		return true;
	}

	/*
	 * Compute the variable part
	 */
	function emitRLC(uint amount) internal {
		rlc_bounty = safeAdd(rlc_bounty, amount/10);
		rlc_team = safeAdd(rlc_team, amount/20);
		rlc_reserve = safeAdd(rlc_reserve, amount/10);
		Logs(msg.sender ,amount, "emitRLC");
	}

	/*
	 * Compute the RLC bonus according to the investment period
	 */
	function bonus(uint amount) internal constant returns (uint) {
		if (now < safeAdd(startBlock, 10 days)) return (safeAdd(amount, amount/5));   // bonus 20%
		if (now < safeAdd(startBlock, 20 days)) return (safeAdd(amount, amount/10));  // bonus 10%
		return amount;
	}

	/* 
	 * When mincap is not reach backer can call the approveAndCall function of the RLC token contract
	 * with this crowdsale contract on parameter with all the RLC they get in order to be refund
	 */
	function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData, bytes _extraData2) minCapNotReached public {
		if (msg.sender != address(rlc)) throw; 
		if (_extraData.length != 0) throw;  // no extradata needed
		if (_extraData2.length != 0) throw;  // no extradata needed
		if (_value != backers[_from].rlcSent) throw; // compare value from backer balance
		if (!rlc.transferFrom(_from, address(this), _value)) throw ; // get the token back to the crowdsale contract
		if (!rlc.burn(_value)) throw ;
		uint ETHToSend = backers[_from].weiReceived;
		backers[_from].weiReceived=0;
		uint BTCToSend = backers[_from].satoshiReceived;
		backers[_from].satoshiReceived = 0;
		if (ETHToSend > 0) {
			asyncSend(_from,ETHToSend);
		}
		if (BTCToSend > 0)
			RefundBTC(backers[_from].btc_address ,BTCToSend); // event message to manually refund BTC
	}

	/*
	* Update the rate RLC per ETH, computed externally by using the BTCETH index on kraken every 10min
	*/
	function setRLCPerETH(uint rate) onlyBy(BTCproxy) {
		RLCPerETH=rate;
	}
	
	/*	
	* Finalize the crowdsale, should be called after the refund period
	*/
	function finalize() onlyBy(owner) {
		// check
		if (RLCSentToETH + RLCSentToBTC < maxCap - 100000000000 && now < endBlock) throw; // cannot finalise before 30 day until maxcap is reached 
		if (RLCSentToETH + RLCSentToBTC < minCap && now < endBlock + 15 days) throw ;  // if mincap is not reached donors have 15 days to get refund 
		//moves the remaining ETH to the multisig address
		if (!multisigETH.send(this.balance)) throw;
		//moves RLC to the team, reserve and bounty address
		if (rlc_reserve > 6000000000000000){
			if(!rlc.transfer(reserve,6000000000000000)) throw; // max cap 6000000RLC
			rlc_reserve = 6000000000000000;
		} else {
			if(!rlc.transfer(reserve,rlc_reserve)) throw;  
		}
		if (rlc_bounty > 6000000000000000){
			if(!rlc.transfer(bounty,6000000000000000)) throw; // max cap 6000000RLC
			rlc_bounty = 6000000000000000;
		} else {
			if(!rlc.transfer(bounty,rlc_bounty)) throw;
		}
		if (!rlc.transfer(team,rlc_team)) throw;
		uint RLCEmitted = rlc_reserve + rlc_bounty + rlc_team + RLCSentToBTC + RLCSentToETH;
		if (RLCEmitted < rlc.totalSupply())					// necessary check for reserve and bounty maxcap
			  rlc.burn(rlc.totalSupply() - RLCEmitted);
		rlc.unlock();
		crowdsaleClosed = true;
	}
}

