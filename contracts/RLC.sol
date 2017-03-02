pragma solidity ^0.4.8;
import "./Ownable.sol";
import "./SafeMath.sol";
import "./ERC20.sol";
import "./TokenSpender.sol";


contract RLC is ERC20, SafeMath, Ownable {

    /* Public variables of the token */
  string public name;       //fancy name
  string public symbol;
  uint8 public decimals;    //How many decimals to show.
  string public version = 'v0.1'; 
  uint256 public initialSupply;
  address public burnAddress;
  uint256 public totalSupply;

  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowed;

  function RLC() {
    initialSupply = 100000000000000000;
    totalSupply = initialSupply;
    balances[msg.sender] = initialSupply;// Give the creator all initial tokens                    
    name = 'iEx.ec Network Token';        // Set the name for display purposes     
    symbol = 'RLC';                       // Set the symbol for display purposes  
    decimals = 9;                        // Amount of decimals for display purposes
    burnAddress = 0x1b32000000000000000000000000000000000000;
  }

  function burn(uint256 _value) returns (bool success){
    balances[msg.sender] = safeSub(balances[msg.sender], _value) ;
    balances[burnAddress] = safeAdd(balances[burnAddress], _value);
    totalSupply = safeSub(totalSupply, _value);
    Transfer(msg.sender, burnAddress, _value);
    return true;
  }

  function transfer(address _to, uint _value) returns (bool success) {
    Transfer(msg.sender, _to, _value);
    balances[msg.sender] = safeSub(balances[msg.sender], _value);
    balances[_to] = safeAdd(balances[_to], _value);

    return true;
  }

  function transferFrom(address _from, address _to, uint _value) returns (bool success) {
    var _allowance = allowed[_from][msg.sender];
    
    balances[_to] = safeAdd(balances[_to], _value);
    balances[_from] = safeSub(balances[_from], _value);
    allowed[_from][msg.sender] = safeSub(_allowance, _value);
    Transfer(_from, _to, _value);
    return true;
  }

  function balanceOf(address _owner) constant returns (uint balance) {
    return balances[_owner];
  }

  function approve(address _spender, uint _value) returns (bool success) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

    /* Approve and then comunicate the approved contract in a single tx */
  function approveAndCall(address _spender, uint256 _value, string _extraData, string _extraData2){    
      TokenSpender spender = TokenSpender(_spender);
      if (approve(_spender, _value)) {
          spender.receiveApproval(msg.sender, _value, this, _extraData, _extraData2);
      }
  }

  function allowance(address _owner, address _spender) constant returns (uint remaining) {
    return allowed[_owner][_spender];
  }
    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw;     // Prevents accidental sending of ether
    }
}
