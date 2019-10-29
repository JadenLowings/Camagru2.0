const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const multiparty = require('connect-multiparty');

const app = express();

//  Passport config
require('./config/passport')(passport);

//db config
const db = require('./config/keys').mongoURI;
//connect mongo
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('mongoDB Connected..'))
    .catch(err =>console.log(err));

const PORT = process.env.PORT || 5000;

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// static folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// connect
app.use(multiparty());
//Bodyparser
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(bodyParser.json());

// Express Session
app.use(session ({
    secret: 'weewee',
    resave: true,
    saveUninitialized: true
}));

// Passport mid
app.use(passport.initialize());
app.use(passport.session());

// flash connect
app.use(flash());

// Global
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

//routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

app.listen(PORT, console.log(`server started on port ${PORT}.`));