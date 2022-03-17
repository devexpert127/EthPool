const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EthPool contract", function () {
  let owner, A, B, C;
  let EthPool;
  let contract

  before(async () => {
    [owner, A, B] = await ethers.getSigners();

    EthPool = await ethers.getContractFactory("EthPool");

    contract = await EthPool.deploy();
  });

  it("check team address", async function () {
    const team = await contract.getTeam();
    expect(team).to.equal(owner.address);
  });

  it("check initial team balance and rewards", async function () {
    const team = await contract.getTeam();
    expect(0).to.equal(await contract.getBalance(team));
    expect(0).to.equal(await contract.getRewards(team));
  });

  it("deposit 1.0 eth from a", async function() {
    expect(0).to.equal(await contract.getBalance(owner.address));
    expect(0).to.equal(await contract.getBalance(A.address));

    await contract.connect(A).deposit({
      value: ethers.utils.parseEther("1.0")
    });

    expect(0).to.equal(await contract.getBalance(owner.address));
    expect(1000000000000000000n).to.equal(await contract.getBalance(A.address));

    const withdrawal = await contract.connect(A).withdraw();

    expect(0).to.equal(await contract.getBalance(A.address));
  });

  it("deposit reward only team", async function() {
    await contract.connect(owner).depositReward({
      value: ethers.utils.parseEther("1.0")
    });

    try {
      await contract.connect(A).depositReward({
        value: ethers.utils.parseEther("1.0")
      });
    } catch (e) {
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Only team can deposit rewards'");
    }
  });

  it("Deposit A 100, B 300, T 200 reward, A can get 150, B can get 450", async function() {
    await contract.connect(A).deposit({
      value: ethers.utils.parseEther("100")
    });
    await contract.connect(B).deposit({
      value: ethers.utils.parseEther("300")
    });
    await contract.connect(owner).depositReward({
      value: ethers.utils.parseEther("200")
    });

    expect(100000000000000000000n).to.equal(await contract.getBalance(A.address));
    expect(300000000000000000000n).to.equal(await contract.getBalance(B.address));

    expect(50000000000000000000n).to.equal(await contract.getRewards(A.address));
    expect(150000000000000000000n).to.equal(await contract.getRewards(B.address));

    expect(600000000000000000000n).to.equal(await contract.getTotal());
    await contract.connect(A).withdraw();
    await contract.connect(B).withdraw();
    expect(0).to.equal(await contract.getTotal());
  });

  it("Deposit A 100, T 200 reward, B 300, A can get 300, B can get 300", async function() {
    await contract.connect(A).deposit({
      value: ethers.utils.parseEther("100")
    });
    await contract.connect(owner).depositReward({
      value: ethers.utils.parseEther("200")
    });
    await contract.connect(B).deposit({
      value: ethers.utils.parseEther("300")
    });

    expect(100000000000000000000n).to.equal(await contract.getBalance(A.address));
    expect(300000000000000000000n).to.equal(await contract.getBalance(B.address));

    expect(200000000000000000000n).to.equal(await contract.getRewards(A.address));
    expect(0).to.equal(await contract.getRewards(B.address));

    expect(600000000000000000000n).to.equal(await contract.getTotal());
    await contract.connect(A).withdraw();
    await contract.connect(B).withdraw();
    expect(0).to.equal(await contract.getTotal());
  });
});