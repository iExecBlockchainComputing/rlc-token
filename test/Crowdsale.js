const assertJump = require('./helpers/assertJump');
var rlc = artifacts.require("../contracts/RLC.sol");
var crowdsale = artifacts.require("../contracts/Crowdsale.sol");



contract('Crowdsale', function(accounts) {

    it("check if RLC total supply is correct", async function() {
        let token = await rlc.new();
        let i = await token.totalSupply();
        assert.equal(i, 100000000000000000);
    });


    it("check if minCap and maxCap are not reached after construction", async function() {
        let token = await rlc.new();
        let cs = await crowdsale.new(token.address);
        let minCR = cs.minCapReached();
        assert.equal(minCR, false);
    });


});
