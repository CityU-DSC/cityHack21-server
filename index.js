require('dotenv').config();

const express = require("express");
const PORT = process.env.PORT || 3000;
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require("./config/db");
const path = require('path');

const routes = require('./routes/api');
const admin_routes = require('./routes/admin_api');

const app = express();

const cronJobs = require('./util/cron');

//configure database and mongoose
mongoose.set("useCreateIndex", true);
mongoose
    .connect(config.database, { useNewUrlParser: true, autoIndex: true })
    .then(() => {
        console.log("Database is connected");
    })
    .catch(err => {
        console.log({ database_error: err });
    });

app.use(cors());

// app.use(bodyParser.urlencoded({
//     parameterLimit: 100000,
//     limit: '50mb',
//     extended: true
// }));
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(morgan("dev"));


app.use('/api/admin', admin_routes);
app.use('/api', routes);
app.use(express.static(path.join(__dirname, "../cityhack21/dist")));
app.use('*', express.static(path.join(__dirname, "../cityhack21/dist")));

app.listen(PORT, () => {
    console.log(`App is listening on ${PORT}`);
});

cronJobs.startCrons();
