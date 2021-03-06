const express = require("express");
const router = express.Router();
const data = require("../data");
const usersData = data.Users;
const reportsData = data.Report;
const ObjectID = require("mongodb").ObjectID;
var multer = require('multer');
const xss = require("xss");

router.get("/", async(req, res) => { //create a report form
    try {
        res.render("layouts/createreport", { users: req.session.userlogged });
    } catch (e) {
        res.status(404).render("layouts/error", { errors: e, ErrorPage: true });
    }
});

// Check for extension of image
const getExtension = file => {
    if (file.mimetype == "image/jpeg")
        ext = ".jpeg";
    else if (file.mimetype == "image/jpg")
        est = ".jpg";
    else
        ext = ".png";
    return ext;
}

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + getExtension(file))
    }
});

var upload = multer({ storage: storage });

router.post("/", upload.single('exampleFormControlFile1'), async(req, res, next) => {

    // router.post("/", async(req, res) => {
    const reportInfo = req.body;
    if (!reportInfo) {
        res.json({ error: "You must provide data to add a report" });
    }
    if (!reportInfo.userID) {
        res.json({ error: "You must provide a user ID" });
    }
    if (!reportInfo.exampleFormControlTextarea1) {
        res.json({ error: "You must provide an evidence" });
    }
    try {
        //get the reported_player info, add newReport to received_reports array, then update user info to database
        const reportedPlayerInfo = await usersData.findUserByUserName(xss(reportInfo.userID));
        if(!reportedPlayerInfo)
        {
            res.render("layouts/createreport", {users: req.session.userlogged, errors : "Invalid Userid" , hasErrors:true});
        }
        else if (reportedPlayerInfo.user_name === req.session.userlogged.user_name) { //Check name, you cannot report yourself
            res.render("layouts/createreport", {users: req.session.userlogged, errors : "You cannot report yourself" , hasErrors:true});
        }
        else if (reportedPlayerInfo.isAdmin) { //Check admin, who cannot be reporeted
            res.render("layouts/createreport", {users: req.session.userlogged, errors : "Admin cannot be reported" , hasErrors:true});
        }
        else
        {        
        //add a new report to Report collection

        if ((reportInfo.link != undefined || reportInfo.link != null) && reportInfo.link != "") {
            let proofLink = xss(reportInfo.link);
            if (proofLink.substring(0, 4) != "http") { //Make sure the profile always store absolute link
                reportInfo.link = "http://" + proofLink;
            }
        };

        const newReport = await reportsData.addReport(req.session.userlogged.user_name, xss(reportInfo.userID), xss(reportInfo.exampleFormControlTextarea1), req.file/*reportInfo.exampleFormControlFile1*/, xss(reportInfo.link));
        reportedPlayerInfo.received_reports.push(ObjectID(newReport._id));
        const updatedReportedPlayer = await usersData.updateUser(reportedPlayerInfo._id, reportedPlayerInfo);      

            //get the reported_by info, add newReport to created_reports array, then update user info to database
            const reportPlayerInfo = await usersData.findUserByUserName(req.session.userlogged.user_name);
            reportPlayerInfo.created_reports.push(ObjectID(newReport._id));
            const updatedReportPlayer = await usersData.updateUser(reportPlayerInfo._id, reportPlayerInfo);

            //check status and decide whether it will change
            await usersData.statusChange(reportedPlayerInfo.user_name, "reports");

            res.redirect("/users/" + reportedPlayerInfo.user_name);
        }
    } catch (e) {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.locals.loggedin = false;
        res.status(404).render("layouts/error", { errors: e, ErrorPage: true });
    }
});

router.post("/:userid", async(req, res) => { //post a report against userid
    try {
        if (req.session.userlogged) { //If a user is authenticated
            //1. Create a report with appropriate details and 2. link it to the user's profile

            //get userId of the reported player and then show their profile (with the new report added)
            const user = "UserReported";
            res.render('layouts/example', { data: user });
        } else {
            //go to login screen and do not make a report, with an error that you must be logged in to do this action
            const data = "go to Log In page once it is made";
            res.render('layouts/example', { data });
        }
    } catch (e) {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.locals.loggedin = false;
        res.status(404).render("layouts/error", { errors: e, ErrorPage: true });
    }
});

router.put("/:reportid", async(req, res) => { //add a comment to a report
    try {
        if (req.session.userlogged) { //If a user is authenticated
            //make a comment on a report: need a report add comment function
            res.render('layouts/example', { users: req.session.userlogged, data: user });
        } else {
            //go to login screen and do not make a report, with an error that you must be logged in to do this action
            const data = "go to Log In page once it is made";
            res.render('layouts/example', { data });
        }
    } catch (e) {
        req.session.userlogged = null;
        res.clearCookie("AuthCookie");
        res.locals.loggedin = false;
        res.status(404).render("layouts/error", { errors: e, ErrorPage: true });
    }
});

module.exports = router;