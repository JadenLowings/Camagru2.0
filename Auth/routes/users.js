const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { ensureAuthenticated } = require('../config/Auth');
var fs = require('fs');
const multipary = require('connect-multiparty');

// User model
const User = require('../models/User');
const Image = require('../models/image');
const Comment = require('../models/comments');



// function base_encode(file) {
//     var baseimg = fs.readFileSync(file); 
//     return new Buffer.from(baseimg).toString('base64');
// };
////////////////
// Navigation //
////////////////

// password reset
router.get('/forgot', (req, res) => res.render('forgot'));

//login
router.get('/login', (req, res) => res.render('login'));

//camera
router.get('/camera', ensureAuthenticated, (req, res) => res.render('camera'));

router.post('/comment', (req, res) => {
    const comment = req.body.comment;
    const imageID = req.body.imageId;
    const userID = req.user._id;
    console.log(imageID);

    const newcomment = new Comment({
        userID: userID,
        imageID: imageID,
        comment: comment
    })
    newcomment.save(err => {
        console.log(err);
    })
    res.redirect('back');
});
router.get('/img', ensureAuthenticated, (req, res) => {
    const imageID = req.query.id;

    Image.find({ _id: imageID })
        .then (images => {
            Comment.find({ imageID })
                .populate('userID')
                .exec()
                .then(comments => {
                    res.render('img', {
                        images: images,
                        likes: images.likes,
                        comments: comments,
                        userName: req.user.name
                    });
                })
            .catch(err => {
                console.log(err);
            });
        })
        .catch(err => {
            console.log(err);
        })
});

//Home
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    let currentPage
    if (req.params.page) {
        currentPage = Number(req.params.page);
    } 
    else currentPage = 1;

    Image.find()

        .then(images => {
            res.render('dashboard', {
                images: images,
                id: images._id,
                userName: req.user.name,
                name: req.user.name,
                currentPage: currentPage,
                likes: images.likes
            });
        })
        .catch(err => {
            console.log(err);
        });
});

//register
router.get('/register', (req, res) => res.render('register'));

// profile
router.get('/profile', ensureAuthenticated, (req, res) => res.render('profile'));

router.get('/passwordreset', (req, res) => res.render('passwordreset'));

// router.get('/accountimg', (req, res) => res.render('accountimg'));


////////////////
////////////////
////////////////

router.post('/profile', (req, res) => {
    usernamesolid = req.body.usernamesolid;

    username = req.body.username;
    email = req.body.email;
    password = req.body.password;

    User.findOne({ name: usernamesolid })
        .then(user => {
            if (username) {
                user.name = username;
                console.log(user.name);
            }
            if (email) {
                user.email = email;
            }
            if (password) {

                bcrypt.genSalt(10, (error, salt) =>
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (error) throw (error)
                        password = hash;
                        // console.log(password, 'This is password');
                        user.password = password;
                        user.save();
                    }))
            }
            user.save();
        })
        .catch(err => {
            console.log(err, 'oopsie2');
        });
    res.redirect('../users/profile');
});

router.post('/forgot', (req, res) => {
    email = req.body.email;

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'User does not exist');
                res.redirect('../users/forgot');
            }

            req.flash('success_msg', 'Email sent');
            var seed = crypto.randomBytes(20);
            var token = crypto.createHash('sha1').update(seed + email).digest('hex');
            user.Token = token;

            user.save()

            URL = "http://localhost:5000/users/passwordreset?id=" + token;

            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: '465',
                secure: true,
                auth: {
                    user: 'camagru.teamactivation@gmail.com',
                    pass: 'Auth3ntic1!'
                }
            });

            let mailOptions = {
                from: '"Camagru Team" <camagru.teamactivation@gmail.com>',
                to: email,
                subject: 'Password Reset',
                text: 'testing',
                html: `
                        <p> Did you forget your password? tisk tisk.. </p>
                        <h3>Your details are</h3>

                        <h3>Please click the link below to reset your password</h3>
                        <p>'${URL}'</p>`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent %s', info.messageId);
            })
            res.redirect('/users/login');
        })
        .catch(err => console.log(err));
})
router.post('/passwordreset', (req, res) => {
    var token = req.query.id;
    var password = req.body.password;

    User.findOne({ Token: token })
        .then(user => {
            if (!user) {
                req.flash('error', 'User not found');
                res.redirect('../users/forgot');
                return;
            }
            if (!password) {
                req.flash('error', 'Missing fields');
                res.redirect('back');
                return;
            }

            bcrypt.genSalt(10, (error, salt) =>
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) throw err;
                    password = hash;

                    user.Token = '';
                    user.password = password;
                    user.save();
                }))
        })
        .catch(err => {
            console.log(err);
        });
    res.redirect('../users/login');
})



router.get('/verify', (req, res) => {
    var Urltoken = req.query.id;

    User.findOne({ Token: Urltoken })
        .then(user => {
            if (!user) {
                req.flash('error', 'User not found');
                console.log(Urltoken);

                res.redirect('../users/register');
            }

            user.active = true;
            user.Token = '';
            user.save();
            req.flash('success_msg', 'Email verified');
            res.redirect('./login');
        })
        .catch(err => {
            console.log(err);
        });

})

//Reg Handle
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    //required fields
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    //Password Comparison
    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    //Password length
    if (password.length < 6) {
        errors.push({ msg: 'Password must be larger than 6 characters' });
    }

    //Email check
    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        });
    }
    else {
        // validation passing

        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    // User exists
                    errors.push({ msg: 'Email is already in use.' });
                    res.render('register', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });
                }
                else {
                    const newUser = new User({
                        name,
                        email,
                        password
                    });

                    // Password encryption

                    bcrypt.genSalt(10, (error, salt) =>
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;

                            // pswd hash
                            newUser.password = hash;

                            var seed = crypto.randomBytes(20);
                            var token = crypto.createHash('sha1').update(seed + email).digest('hex');
                            newUser.Token = token;

                            // save user
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'Registration complete');
                                    req.flash('success_msg', 'Verification Email sent');
                                    URL = "http://localhost:5000/users/verify?id=" + token;

                                    let transporter = nodemailer.createTransport({
                                        host: 'smtp.gmail.com',
                                        port: '465',
                                        secure: true,
                                        auth: {
                                            user: 'camagru.teamactivation@gmail.com',
                                            pass: 'Auth3ntic1!'
                                        }
                                    });

                                    let mailOptions = {
                                        from: '"Camagru Team" <camagru.teamactivation@gmail.com>',
                                        to: email,
                                        subject: 'Account Activation',
                                        text: 'testing',
                                        html: `
                                                <p> Welcome to the Camagru Family! </p>
                                                <h3>Your details are</h3>
                                                <ul>
                                                    <li>Name: ${req.body.name}</li>
                                                    <li>Email: ${req.body.email}</li>
                                                    <li>Password: ${req.body.password}</li>
                                                </ul>
                                                <h3>Please click the link below to Activate your account</h3>
                                                <p>'${URL}'</p>`
                                    };
                                    transporter.sendMail(mailOptions, (error, info) => {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        console.log('Message sent %s', info.messageId);
                                    })
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err));

                        }))
                }
            })

    }

});

router.post('/camera', (req, res) => {
    console.log('what the hell is going on?');
    console.log(req);
    if (req.files.insert) {

        var img = req.files.insert.path;
        console.log(img);
        var imgset = 'data:image/png;base64,';
        var userID = req.user;
        var fimg = base_encode(img);
        var final_img = imgset+fimg;

        console.log(fimg);
        
        const image = new Image({
            userID: userID,
            image: final_img
        });

        image.save()
            .then(result => {
                res.redirect('/users/camera');
            })
            .catch(err => {
                console.log(err);
            });
        }
    
    if (req.body.imgsrc) {
        const img = req.body.imgsrc;
        const userID = req.user;

        console.log(img);
        console.log(userID);


        const image = new Image({
            userID: userID,
            image: img
        });

        image.save()
            .then(result => {
                res.redirect('/users/camera');
            })
            .catch(err => {
                console.log(err);
            });
    } else {
        console.log('hello its a me mario');
        res.redirect('/users/camera');

    }
})
// Login
router.post('/login', (req, res, next) => {
    var log = req.body.email;
    console.log(log);
    passport.authenticate('local', {
        successRedirect: '/users/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true

    })(req, res, next);

});

// logout handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'Logged out');
    res.redirect('/users/login');
});

router.get('/accountimg', ensureAuthenticated, (req, res) => {
    var ids = req.user._id;

    Image.find({ userID: ids })
        .then(images => {
            User.findOne({ _id: ids })
            res.render('accountimg', {
                images: images,
            });
        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/likeme', (req, res) => {
    const imgid = req.body.imageId;

    Image.findOne({ _id: imgid })
        .then(image => {
            const likes = image.likes;
            image.likes = likes + 1;
            image.save();

            res.redirect('back');
        })
        .catch(err => {
            console.log(err);
        })
});

router.post('/delete-img', (req, res) => {
    const imgid = req.body.imageId
    Image.remove({ _id: imgid })
        .then(() => {
            res.redirect('/users/accountimg');
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/guest', (req, res) => {
    Image.find()

    .then(images => {
        res.render('guest', {
            images: images,
            id: images._id,
            likes: images.likes
        });
    })
    .catch(err => {
        console.log(err);
    });
})


function base_encode(file) {
    var baseimg = fs.readFileSync(file); 
    return new Buffer.from(baseimg).toString('base64');
};

module.exports = router;