# rlc-token
RLC Token for the iEx.ec project    
This is a truffle 3 repo

## To test  
Launch `testrpc` on another terminal    
Launch `truffle test`


## Deployment    
Launch migrations script `truffle migrate`    
and the run this on truffle console:    
RLC.at(RLC.address).transfer(Crowdsale.address,87000000000000000)      
RLC.at(RLC.address).transferOwnership(Crowdsale.address)     

