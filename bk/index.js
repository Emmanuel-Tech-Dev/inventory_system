const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const path = require("path");
const logger = require("morgan");
const workerpool = require("workerpool");
const moment = require("moment");
const otpGenerator = require("otp-generator");

const threadPool = workerpool.pool(__dirname + "/workers.js");
const { Server } = require("socket.io");

const Model = require("./model/model");
const Utilities = require("./helper/functions");
const Settings = require("./helper/settings");
const TableModels = require("./helper/table_models");
const CommonEndpoints = require("./helper/common_endpoints");

const CustomUtilities = require("./helper/custom_functions");
const LDAP = require("./helper/ldap");
const { generateSQLIn } = require("./helper/functions");
const { type } = require("os");


const InventoryManagementEndpoints = require("./helper/opd_endpoints");

const Mutex = require("async-mutex").Mutex;

const app = express(); //creating express instance
const server = http.createServer(app); //creating http instance that takes express as a plugin
const io = new Server(server); //creating socket.io intance that takes http instance as a plugin

// dotenv.config();

server.listen(3002, async () => {
  //http listening on port
  console.log("Server running on port 3002");
});

//USE BODY PARSER
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

//ALLOW CORS
app.use(function (req, res, next) {
  // res.header('Access-Control-Allow-Origin', 'http://localhost:3000, https://smgt.aamusted.edu.gh');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use(express.static("../fk/build"));
const publicPath = path.resolve(__dirname, "resources/adphotos");
const voiceNotePath = path.resolve(__dirname, "resources/voicenotes");
const msgImgPath = path.resolve(__dirname, "resources/msgimages");
const sysImgPath = path.resolve(__dirname, "resources/sysimg");
const usersImgPath = path.resolve(__dirname, "resources/users");
const pdfsFilePath = path.resolve(__dirname, "resources/pdfs");

const staticFilesOptions = {};
app.get("/:pic", express.static(publicPath, staticFilesOptions));
app.get("/:voice", express.static(voiceNotePath, staticFilesOptions));
app.get("/:img", express.static(msgImgPath, staticFilesOptions));
app.get("/:img", express.static(sysImgPath, staticFilesOptions));
app.get("/:img", express.static(usersImgPath, staticFilesOptions));
app.get("/:pdf", express.static(pdfsFilePath, staticFilesOptions));

app.get("*", (req, res) => {
  res.sendFile(path.resolve("../fk/build/index.html"));
});

// Utilities.logRequest(app);
// app.use(Utilities.hasPermission);
new CommonEndpoints(app, upload);
new InventoryManagementEndpoints(app); // or OpdEndpoints

app.post("/test", async (request, response) => {
  try {
    response.json({ status: "Ok", msg: "Operation success" });
  } catch (err) {
    console.log(err.message);
    response.json({
      status: "Error",
      msg: "Operation failed",
      msg2: err.message,
    });
  }
});

