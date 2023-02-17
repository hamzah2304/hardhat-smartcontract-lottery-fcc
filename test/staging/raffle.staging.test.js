const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { ethers, network, getNamedAccounts, deployments } = require("hardhat")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", function () {
          console.log("Starting staging test...")
          let raffle, raffleEntranceFee, deployer

          beforeEach(async function () {
              console.log("Running beforeEach...")
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              console.log("Raffle contract deployed...")
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("should work with Live Chainlink Keepers and Chainlink VRF and choose a random winner", async function () {
                  console.log("Setting up staging test...")
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  const accounts = await ethers.getSigners()
                  console.log("Setting up listener...")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter the raffle
                      // Just in case the blockchain moves REALLY fast
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLastTimeStamp()

                              await expect(raffle.getPlayers(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      console.log("Entering Raffle...")
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
