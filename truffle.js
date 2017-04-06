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
      from: "0x7c34db57c20eab8f1fca9b76b93d44f65338dae7"
    }
  }
};
