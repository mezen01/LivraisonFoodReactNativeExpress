var express = require("express");
const {addToCart, removeFromCart, getCartItems } = require("../services/cart.service");
var router = express.Router();


router.get("/", async (req, res) => {
  let username = req?.username;
  let response = await getCartItems({username});
  res.json(response);
});

router.post("/:FoodId", async (req, res) => {
  let foodId = req?.params.FoodId;
  let username = req?.username;
  let response = await addToCart({foodId,username});
  res.json(response);
});
router.delete("/:FoodId", async (req, res) => {
  let foodId = req?.params.FoodId;
  let username = req?.username;
  let response = await removeFromCart({foodId,username});
  res.json(response);
});
module.exports = router;