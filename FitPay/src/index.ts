import { v4 as uuidv4 } from "uuid";
import { StableBTreeMap } from "azle";
import express from "express";
import { time } from "azle";

/**
 * rewardStorage - it's a key-value datastructure that stores the rewards for users.
 * {@link StableBTreeMap} is a self-balancing tree that acts as a durable data storage that keeps data across canister upgrades.
 * For the sake of this contract we've chosen {@link StableBTreeMap} as a storage for the next reasons:
 * - insert, get and remove operations have a constant time complexity - O(1)
 * - data stored in the map survives canister upgrades unlike using HashMap where data is stored in the heap and it's lost after the canister is upgraded
 *
 * Breakdown of the StableBTreeMap(string, Reward) datastructure:
 * - the key of map is a userId
 * - the value in this map is a reward history related to a given user (userId)
 *
 * Constructor values:
 * 1) 0 - memory id where to initialize a map.
 */

/**
 * This type represents a reward earned by a user based on their activity.
 */
class Reward {
  id: string;
  userId: string;
  points: number;
  activity: string;
  timestamp: Date;
}

const rewardStorage = StableBTreeMap<string, Reward>(0);

const app = express();
app.use(express.json());

// Endpoint to log a new reward for a user
app.post("/rewards", (req, res) => {
  const reward: Reward = {
    id: uuidv4(),
    timestamp: getCurrentDate(),
    ...req.body,
  };
  rewardStorage.insert(reward.userId, reward);
  res.json(reward);
});

// Endpoint to get all rewards
app.get("/rewards", (req, res) => {
  res.json(rewardStorage.values());
});

// Endpoint to get a specific reward by userId
app.get("/rewards/:userId", (req, res) => {
  const userId = req.params.userId;
  const rewardOpt = rewardStorage.get(userId);
  if (!rewardOpt) {
    res.status(404).send(`No reward found for user with id=${userId}`);
  } else {
    res.json(rewardOpt);
  }
});

// Endpoint to update a user's reward details
app.put("/rewards/:userId", (req, res) => {
  const userId = req.params.userId;
  const rewardOpt = rewardStorage.get(userId);
  if (!rewardOpt) {
    res
      .status(400)
      .send(`Couldn't update the reward for user with id=${userId}. Reward not found`);
  } else {
    const reward = rewardOpt;

    const updatedReward = {
      ...reward,
      ...req.body,
      timestamp: getCurrentDate(),
    };
    rewardStorage.insert(reward.userId, updatedReward);
    res.json(updatedReward);
  }
});

// Endpoint to delete a user's reward
app.delete("/rewards/:userId", (req, res) => {
  const userId = req.params.userId;
  const deletedReward = rewardStorage.remove(userId);
  if (!deletedReward) {
    res
      .status(400)
      .send(`Couldn't delete the reward for user with id=${userId}. Reward not found`);
  } else {
    res.json(deletedReward);
  }
});

app.listen(8000, () => {
  console.log("FitPay server running on port 8000");
});

// Utility function to get the current timestamp
function getCurrentDate() {
  const timestamp = new Number(time());
  return new Date(timestamp.valueOf() / 1000_000);
}
