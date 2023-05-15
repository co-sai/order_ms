const express = require("express");
const cors = require("cors");
const { order } = require("./api");

module.exports = async (app) => {
  try{
    app.use(express.json());
    app.use(cors());
    app.use(express.static(__dirname + "/public"));
  
    order(app);
  }catch(err){
    throw err;
  }
};
