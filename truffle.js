module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      from: "0x00e1Ac3BF9c4F5D16649971f36C7a1d2c4476c7E"
    }
  }
};
