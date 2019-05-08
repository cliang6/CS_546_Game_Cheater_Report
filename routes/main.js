const express = require("express");
const router = express.Router();
const data = require("../data");
const usersData = data.Users;
const bcrypt = require("bcrypt");
const saltRounds = 16;

router.use(function (req, res, next) {
    if (req.session.userlogged === undefined || req.session.userlogged === null) {
        res.locals.loggedin = false;
    } else {
        console.log("run!");
        res.locals.loggedin = true;
    }

    next();
});


router.get("/", async(req, res) => { //get the MAIN PAGE! :)
    try 
    {
        res.render("layouts/main", {});
    } 
    catch (e) 
    {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.status(400).render("layouts/error",{errors: e , layout: 'errorlayout' });
    }
});

router.post("/login", async (req, res) => {
    try {
        let newUserInfo = req.body;
        if (!newUserInfo) {
            res.json({error: "You must provide data to create a user"});
        }
        if (!newUserInfo.username_login) {
            res.json({ error: "You must provide a username"});
        }
        if(!newUserInfo.password_login){
            res.json({ error: "You must provide a password"});
        }
        const compareUser = await usersData.findUserByUserName(newUserInfo.username_login);
        if(!compareUser)
        {
            res.json({error : "Provide valid Username/Password"});
        }
        else {
            const hashed = await bcrypt.compare(newUserInfo.password_login, compareUser.hashedPassword);
            if (!hashed) {
                res.json({error : "Provide valid Username/Password"});
            }
            else {
                req.session.userlogged = compareUser;
                res.render("layouts/main", {});
            }
        }        
       
    } 
    catch (e) 
    {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.status(404).render("layouts/error", {errors: e , layout: 'errorlayout' });
    }
});

router.get("/logout", async (req, res) => {
    console.log("asd");
    req.session.userlogged = null;
    res.clearCookie("AuthCookie");
    res.locals.userlogged = false;
    res.redirect("/");

});

router.post("/register", async (req, res) => {
    try {
        let newUserInfo = req.body;

        if (!newUserInfo) {
            res.json({error: "You must provide a valid data"});
        }
        if (!newUserInfo.username_signup) {
            res.json({error: "You must provide a username"});
        }

        if(!newUserInfo.password_signup){
            res.json({error: "You must provide a password"});
        }
        let compareUser = await usersData.findUserByUserName(newUserInfo.username_signup);

        if (compareUser === undefined || compareUser === null) {
            bcrypt.hash(newUserInfo.password_signup, saltRounds, function (err, hash) {
                // Store hash in password DB.
                usersData.addUser(newUserInfo.username_signup, hash, false);
            });
            res.render("layouts/main", {});
        } 
        else 
        {
           res.json({error : "Username already exists"});
        }        
    } 
    catch (e) 
    {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.status(404).render("layouts/error", {errors: e , layout: 'errorlayout' });
    }
});

router.post("/search", async (req, res) => {
    try {
        const searchInfo = req.body;
        if (!searchInfo) {
            res.json({ error: "You must provide a valid data" });
        }

        if (!searchInfo.username_search) {
            res.json({ error: "Provide Username"});
        }
        let searchData = await usersData.findUserByUserName(searchInfo.username_search);
        if (searchData === undefined || searchData === null) {
            //show an error message
            //username doen't exist
            res.render("layouts/main", { hasErrors: true, errors: "Provide valid username" });
        }
        else {
            res.redirect('/users/' + searchInfo.username_search);
        }        
    } 
    catch (e) 
    {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.status(404).render("layouts/error", {errors: e , layout: 'errorlayout' });
    }
});

router.get("/users/:id", async (req, res) => {
    try {
        
        const user = await usersData.findUserByUserName(req.params.id);
        console.log(user);

        user.created_reports_count =  user.created_reports.length;

        res.render("layouts/user", {users : user});
    } 
    catch (e) 
    {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.status(404).render("layouts/error",{ errors: e , layout: 'errorlayout' });
    }
});

router.use(function (req, res, next) {
    if (req.session.userlogged === undefined || req.session.userlogged === null) {
        res.render("layouts/main", { hasErrors: true, errors: "Please Login" });
    } else
        next();
});

// Ban List Routes
router.get("/list", async (req, res) => { //get the cheater list
    try {
        const userList = "List of banned players";
        //Get users by status: confirmed cheater
        res.render('layouts/cheaters', { data: userList });
    } 
    catch (e) 
    {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.status(404).render("layouts/error", {errors: e , layout: 'errorlayout' });
    }
});

router.get("/list/:status", async (req, res) => { //get the list of players with any status
    try {
        //if status is admin, get all admins
        //otherwise go through entire user list and only get users if they have that status
        const userList = "List of players with status {status}";
        res.render('layouts/example', { data: userList });
    } 
    catch (e) 
    {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.status(404).render("layouts/error", {errors: e , layout: 'errorlayout' });
    }
});

module.exports = router;