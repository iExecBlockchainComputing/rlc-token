var rlc = artifacts.require("../contracts/RLC.sol");
var crowdsale = artifacts.require("../contracts/Crowdsale.sol");

let token = await rlc.new();

contract('Crowdsale', function(accounts) {

    it("check if minCap and maxCap are not reached after construction", async function() {

        let cs = await crowdsale.new(token.address);
        assert.equal(cs.minCapReached, false);
    })


});
