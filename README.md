# rlc-token
RLC Token for the iEx.ec project    

Thanks to Beyond the Void, for helping us shaping the crowdsale 
contract, Open Zeppelin and SmartPool for the security audit and
François Branciard for the testing.

The RLC token is deployed at 0x607F4C5BB672230e8672085532f7e901544a7375
The Crowdsale contract is deployed at 0xec33fB8D7c781F6FeaF2Dd46D521D4F292320200


## To test  
This is a truffle 3 repo
Launch `testrpc` on another terminal    
Launch `truffle test`


## Deployment    
Launch migrations script `truffle migrate`    
and the run this on truffle console:    
RLC.at(RLC.address).transfer(Crowdsale.address,87000000000000000)      
RLC.at(RLC.address).transferOwnership(Crowdsale.address)     

