const express = require('express')
const moment = require('moment')
const { v4: uuidv4 } = require('uuid')
const app = express()
var cloudinary = require('cloudinary');
var cloudinaryStorage = require('multer-storage-cloudinary');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const Ajv = require("ajv")
const ajv = new Ajv()
const passport = require('passport')
const BasicStrategy = require('passport-http').BasicStrategy
const bodyParser = require('body-parser')
app.use(bodyParser.json());



let userDB = []; // create database for users
let itemDB = []; // create database for items

const itemSchema = require('./itemSheetSchema.json');

const itemInfoValidator = ajv.compile(itemSchema)

/*
var storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: '', // give cloudinary folder where you want to store images
  allowedFormats: ['jpg', 'png'],
});
*/

  var parser = multer({ storage: storage });

passport.use(new BasicStrategy(           //used for basic html authentication
    (username, password, done) =>{
    console.log('Basic strategy params, username: ' + username + ' password: ' + password);
    

    const searchResult = userDB.find(user => ((username === user.username) && (password === user.password)))
    if(searchResult !=  undefined){
    done(null, searchResult)
    } else {
    done(null, false)
    }
  }
));

app.get('/listings', (req, res) =>{         //fetches all of the listings from item database
    res.send(itemDB)
})

app.get('/listings/category/:category', (req, res) =>{      //fetches listings which are specific category
    const items = itemDB.find(d => d.category === req.params.category)
    if (items === undefined){  //if category doesn't match any listing, return code not found
        res.sendStatus(404);
    } else{ //if category matches, listings are shown
        res.json(items);
    }
})

app.get('/listings/location/:location', (req, res) =>{          //fetches listings which are from specific location
    const locations = itemDB.find(d => d.location === req.params.location)
    if (locations === undefined){  //if location doesn't match any listing, return code not found
        res.sendStatus(404);
    } else{ //if location matches, listings are shown
        res.json(locations);
    }
})

app.get('/userlistings', passport.authenticate('basic', {session: false}), (req, res) =>{ //fetches listings which are made my user
    const userListings = itemDB.find(d => d.owner === req.user.userID)
    if (userListings === undefined){  //if user has no listings, return code not found
        res.sendStatus(404);
    } else{ // if user has listings, they are shown
        res.json(userListings);
    }
})

app.delete('/userlistings/delete/:listingID', passport.authenticate('basic', {session: false}), (req, res) =>{ //user can delete listing with corresponding id
    const userListings = itemDB.find(d => d.owner === req.user.userID)
    if (userListings === undefined){  //if user has no listings, return code not found
        res.sendStatus(404);
    } else{  //if user has listings, it will find listing with corresponding id and then deletes it
        const listing = itemDB.find(d => d.listingID === req.params.listingID)
        const index = itemDB.indexOf(listing);
    if (index > -1) {
       itemDB.splice(index, 1);
    }
       res.sendStatus(200);
    }
})

app.put('/userlistings/edit/:listingID', passport.authenticate('basic', {session: false}), (req, res) =>{ //user can edit listing with corresponding id
    ownerID = req.user.userID
    const listing = itemDB.find(d => d.listingID === req.params.listingID)
    if (listing === undefined){ //if user has no listings, returns code not found
        res.sendStatus(404);
    }
    else if(ownerID != listing.owner) //if trying to edit listing which is not owned, returns code forbidden
    {
        res.sendStatus(403)
    }
    
    else{

        const valid = itemInfoValidator(req.body)
        console.log(valid)

        if(valid === true){  // if all fields are given in right format, valid is true
        const itemIndex = itemDB.indexOf(listing);
        itemDB[itemIndex].title = req.body.title;
        itemDB[itemIndex].description = req.body.description;
        itemDB[itemIndex].category = req.body.category;
        itemDB[itemIndex].location = req.body.location;
        itemDB[itemIndex].price = req.body.price;
        itemDB[itemIndex].deliveryType = req.body.deliveryType;
        itemDB[itemIndex].sellerInfo = req.body.sellerInfo;
       res.sendStatus(200);}
       else{  //if fields are left empty or given in wrong format, returns code bad request
           res.sendStatus(400)
       }
    }
})


app.get('/listings/date/:date', (req, res) =>{ //fetches listings with specific date
    const dates = itemDB.find(d => d.dateOfPosting === req.params.dateOfPosting)
    if (dates === undefined){  //if date doesn't match any listing, return code not found
        res.sendStatus(404);
    } else{ //if date matches, listing are shown
        res.json(dates);
    }
})

app.post('/register', (req, res) =>{ //user can create login credentials
    const newUser = {
        userID: uuidv4(),
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
    }
    userDB.push(newUser);
    res.sendStatus(201)
})

app.post('/createListing', passport.authenticate('basic', {session: false}), upload.array('image', 4), (req, res) =>{ //user can create new listing
    const newItem = {
        owner: req.user.userID,
        listingID: uuidv4(),
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        image: req.body.image,
        price: req.body.price,
        dateOfPosting: moment().format('MMMM Do YYYY, h:mm:ss a'),
        deliveryType: req.body.deliveryType,
        sellerInfo: req.body.sellerInfo
    }
    itemDB.push(newItem);
    res.sendStatus(201)
})


app.listen(process.env.PORT || 3000, function() {
    console.log('Node app is running on port');
});
