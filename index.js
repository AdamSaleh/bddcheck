#!/usr/bin/env node
var program = require('commander');
var checker = require('./lib/check.js');
program
    .arguments('<file>')
    .action(function(file) {
        console.log("Checking "+ file+ " :");
        checker.checkFile(file, function(err,res){
            if(res.length === 0) {
                console.log("No problems found.");
            }else{
                console.log("No scenario found that results in satisfying:")
                res.forEach(function (i){
                    console.log("\t \""+ i.original + "\" on line "+ i.location.line); 
                });
            }
        })
    })
    .parse(process.argv);
