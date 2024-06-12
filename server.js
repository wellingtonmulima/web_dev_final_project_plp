const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const {check,validationResult} = require("express-validator");
const dotenv = require("dotenv");
const { reject } = require("lodash");

const app = express();
const PORT = 3000;
dotenv.config();

const db = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'Willy1997!',
    database:'agric_econapp'
});

db.connect((err) =>{
    if(err) throw new Error('failed to connect to the DB');
    console.log('Connection to the db was successful');
});

app.use(express.static(__dirname));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended:true }));
app.use(bodyParser.urlencoded({ extended:true }));

app.use(session({
    secret:'jhsgfjggdjkffjhjjksgajkhaehjgfshjkkkeirkkdjsiocvbsnhehe',
    resave:false,
    saveUninitialized:true
}));

//landing page
app.get('/',(req,res) =>{
    res.sendFile(__dirname + '/index.html');
});

//setting up the user object

const User = {
    tableName:'users',
    createUser: function(newUser,callback){
        db.query(' INSERT INTO ' + this.tableName + ' SET ? ',newUser,callback);
    },
    getUserByEmail: function(email,callback){
        db.query(' SELECT * FROM ' + this.tableName + ' WHERE email = ? ',email,callback);
    },
    getUserByUsername: function(username,callback){
        db.query(' SELECT * FROM ' + this.tableName + ' WHERE username = ? ',username,callback);
    }

};

app.post('/register',[
    //custom check
    check('email').isEmail(),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),
    check('email').custom(value => {
        return new Promise((resolve, reject) => {
            User.getUserByEmail(value, (err, user) => {
                if (err) return reject(new Error('Database error'));
                if (user.length > 0) return reject(new Error('Email already exists'));
                resolve(true);
            });
        });
    }),
    check('username').custom(value => {
        return new Promise((resolve, reject) => {
            User.getUserByUsername(value, (err, user) => {
                if (err) return reject(new Error('Database error'));
                if (user.length > 0) return reject(new Error('Username already exists'));
                resolve(true);
            });
        });
    })
], async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(401).json({errors:errors.array()});
    }
    //hash the password 
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password,saltRounds);

    //create newUser Object
    const newUser ={
        email : req.body.email,
        username : req.body.username,
        password : hashedPassword,
        full_name : req.body.full_name
    }

    User.createUser(newUser,(err,results,fields) =>{
        if(err){
            console.error('error inserting record',err.message);
            return res.status(500).json({err:err.message});
        }
        console.log('Record inserted with id' + results.insertid);
        res.status(201).json(newUser);
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Retrieve user from database
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Database error:', err.message); // error logging
            return res.status(500).send('Internal server error'); 
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid username or password'); //  return statement
        }

        const user = results[0];


        bcrypt.compare(password, user.password, (err, isMatch) => { 
            if (err) {
                console.error('Error comparing passwords:', err.message); // Added error logging
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            if (isMatch) {
                // Store in session
                req.session.user = user;
                //res.send('Login successful');
                res.json({ success: true, redirectUrl: '/home.html' });
                console.log('login successful');
            } else {
                res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
        }); 
    });
});

//seving the home.html

app.get('/home.html',(req,res) =>{
    if(!req.session.user){
        res.redirect('/');
    }
    res.sendFile(__dirname + '/home.html');
});

//route to add a crop
app.post('/api/crops',(req,res) =>{
    if(!req.session.user){
        return res.status(401).json({Error:'Unauthorized'});
    }
    const {crop_name,area,cost,projected_yield,market_price} = req.body;
    const userId = req.session.user.id;
    const sql =' INSERT INTO crops (user_id,crop_name,area,cost,projected_yield,market_price) VALUES ( ? , ? , ?, ? , ? , ? )';
    console.log('Received crop data',req.body);
    db.query(sql,[userId,crop_name,area,cost,projected_yield,market_price],(err,result) =>{
        if(err){
            console.error(err);
            return res.status(500).json({error:'Failed to add crop data'});
        }else{
            res.json({message:'crop data added'});
        }
    });
});

//route to get economic analysis
app.get('/api/analysis',(req,res) =>{
    if(!req.session.user){
        return res.status(401).json({Error:'Unauthorized'});
    }
    const userId = req.session.user.id;
    const sql =' SELECT * FROM crops  WHERE user_id = ? ';
    db.query(sql,[userId],(err,results) =>{
        if(err){
            console.error(err);
            res.status(500).json({Error:'Failed to retrieve analysis'});
        }else{
            console.log('Retrieved analysis data',results);
            const analysis = results.map(crop =>{
                const revenue = crop.projected_yield * crop.market_price;
                const profit = revenue - crop.cost;
                return {...crop,revenue,profit};
            });
            res.json(analysis);
        }
    });
});


app.post('/logout', (req, res) => { // Added
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

app.listen(PORT, () =>{
    console.log(`Server running on port:${PORT}`);
});