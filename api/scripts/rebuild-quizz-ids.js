const fs = require("fs");
const path = require("path");
require("../src/mongo");
require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");

console.log(mongoose.Types.ObjectId());

const quizz = require("../data/quizz.json");

(async () => {
  for (const theme of quizz) {
    theme._id = `theme-${mongoose.Types.ObjectId()}`;
    for (const question of theme.questions) {
      question._id = `question-${mongoose.Types.ObjectId()}`;
    }
  }
  fs.writeFileSync(path.resolve("./data/quizz.json"), JSON.stringify(quizz, null, 2));
})();