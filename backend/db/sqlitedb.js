const {app} = require('electron')
const path = require('path')
const electronPath = path.join(app.getPath("userData"), './data/database.sqlite');
console.log('electron path', electronPath)

const fs = require('fs');
const dataDir = path.join(app.getPath('userData'), 'data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true }); // Create directory if it doesn't exist
}
console.log('Electron database path:', electronPath);

const knex = require('knex')({
    client: "sqlite3",
    connection: {
        filename: electronPath,
    },
    useNullAsDefault: true,
    pool: {
        min: 1,
        max: 100,
        idleTimeoutMillis: 360000 * 1000,
    },
});

// const options = {
//     client: 'mysql2',
//     connection: {
//         host: '127.0.0.1',
//         user: 'root',
//         password: 'hello12345bob',
//         database: 'bizwatch_test'
//     }
// }

// const knex = require('knex')(options);


// function getUsers(){
//     return new Promise((resolve,reject)=>{
//          let users = knex.select('Firstname').from('User')
//          users.then((rows)=>{
//             resolve(rows)
//          })
//          .catch(err=>{
//              reject(err)
//          })
//     })
// }



//module.exports.getUsers = getUsers
module.exports.knex = knex

