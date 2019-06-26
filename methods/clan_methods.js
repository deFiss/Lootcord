const Discord = require("discord.js");
const { query } = require('../mysql.js');
const config = require('../json/_config.json');
const itemdata = require("../json/completeItemList");
//const fs = require("fs");

class Methods {
    async getMembers(clanId){
        const users = (await query(`SELECT * FROM scores WHERE clanId = ${clanId}`));
        
        var memberIds = [];

        for(var i = 0; i < users.length; i++){
            memberIds.push(users[i].userId)
        }

        return {
            count: users.length,
            memberIds: memberIds
        }
    }

    async disbandClan(clanId){
        query(`UPDATE scores SET clanRank = 0 WHERE clanId = ${clanId}`);
        query(`UPDATE scores SET clanId = 0 WHERE clanId = ${clanId}`);

        query(`DELETE FROM items WHERE userId = ${clanId}`);
        query(`DELETE FROM clans WHERE clanId = ${clanId}`);
    }

    async getPower(clanId){
        var members = await this.getMembers(clanId);
        var usedPower = 0;
        var currPower = 0;
        var maxPower = 0;

        for(var i = 0; i < members.count; i++){
            const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${members.memberIds[i]}`))[0];

            currPower += scoreRow.power;
            maxPower += scoreRow.max_power;
        }
        
        return {
            usedPower: usedPower,
            currPower: currPower,
            maxPower: maxPower
        }
    }
}

module.exports = new Methods();