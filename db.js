const Pool = require("pg").Pool;
// const pgp = require("pg-promise")();

const pool = new Pool({
  user: "postgres",
  password: "rishal@1999",
  host: "localhost",
  port: 5432,
  database: "pawmart",
});

// const pool = pgp({
//     user: 'postgres',
//     password: 'rishal@1999',
//     host: 'localhost',
//     port: 5432,
//     database: 'pawmart'
//   });

module.exports = pool;
