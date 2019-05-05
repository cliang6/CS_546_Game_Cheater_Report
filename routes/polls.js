const express = require("express");
const router = express.Router();

//we may not need any routes for this

router.post("/:id", async (req, res) => {
    try{
        //we need a function to update a poll for voting about a userID 
        const vote = "vote casted!";
        res.render('layouts/example', { data: vote });
    }
    catch(e){
        res.status(404).json({ error: "Page not render-able" + e });
    }
});

module.exports = router;