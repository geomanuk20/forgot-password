/*const express = require('express')
const jwt = require('jsonwebtoken')

const app = express();

app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.set('view engine','ejs')

let user = {
    id:"asfdsjsdskhhgs",
    email: "geomanuk20@gmail.com",
    password:"12"
}
const JWT_SECRET = 'some super secret...'

app.get('/',(req,res)=>{
    res.send('hello world')
})
app.get('/forgot-password',(req,res,next)=>{
    res.render('forgot-password')
})
app.post('/forgot-password',(req,res,next)=>{
    const{email} = req.body
    // make sure user inside the database
    if(email !== user.email){
        res.send('user not register')
        return;
    }
    // user exist ans now create a one time link valid for 15 minutes

    const secret = JWT_SECRET + user.password
    const payload = {
        email:user.email,
        id:user.id 
    }
    const token = jwt.sign(payload,secret,{expiresIn:'5min'})
    const link = `http://localhost:3000/reset-password/${user.id}/${token}`
    console.log(link)
    res.send('password reset link has been sent to your email..')
})
app.get('/reset-password/:id/:token', (req, res, next) => {
    const { id, token } = req.params;
    // check if this id exists in the database
    if (id !== user.id) {
        res.send('Invalid id...');
        return;
    }
    // we have a valid id, and we have a valid user with this id
    const secret = JWT_SECRET + user.password;
    try {
        const payload = jwt.verify(token, secret);
        res.render('reset-password', { email: user.email });
    } catch (error) {
        console.log(error.message);
        res.send(error.message);
    }
});

app.post('/reset-password/:id/:token', (req, res, next) => {
    const { id, token } = req.params;
    const { password, password2 } = req.body;

    // Check if this id exists in the database
    if (id !== user.id) {
        res.send('Invalid id...');
        return;
    }

    // Validate password and password2 should match
    if (password !== password2) {
        res.send('Passwords do not match.');
        return;
    }

    const secret = JWT_SECRET + user.password;
    try {
        // Verify the token
        const payload = jwt.verify(token, secret);

        // Update the user's password
        user.password = password;
        // You might want to save the updated user data to your database here

        res.send('Password successfully reset.');
    } catch (error) {
        console.log(error.message);
        res.send('Error resetting password.');
    }
});

app.listen(3000,()=> console.log('successful running'))
*/

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const connect = mongoose.connect('mongodb://localhost:27017/project-tut');

connect.then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.log('Error connecting to MongoDB:', err);
});

const loginschema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
    },
 
    password: {
        type: String,
        required: true
    }
});

// User collection
const User = mongoose.model('user', loginschema);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const data = {
        name: req.body.username,
        password: req.body.password,
        repassword: req.body.repassword
    };

    if (data.password !== data.repassword) {
        res.send('Passwords do not match. Please try again.');
    } else {
        try {
            const existingUser = await User.findOne({ name: data.name });
            if (existingUser) {
                res.send('User already exists');
            } else {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(data.password, saltRounds);

                const newUser = new User({
                    name: data.name,
                    password: hashedPassword
                });

                await newUser.save();
                res.send('<script>alert("User registered successfully"); window.location="/login";</script>');
            }
        } catch (error) {
            console.log('Error:', error);
            res.send('An error occurred while registering the user.');
        }
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ name: req.body.username });
        if (!user) {
            res.send('Username not found');
            return;
        }

        const passwordMatch = await bcrypt.compare(req.body.password, user.password);
        if (passwordMatch) {
            res.render('home');
        } else {
            res.send('Incorrect password');
        }
    } catch (error) {
        console.log('Error:', error);
        res.send('An error occurred while logging in.');
    }
});

const JWT_SECRET = 'some super secret...';

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.post('/forgot-password', async (req, res) => {
    const { name } = req.body;

    try {
        // Check if the user exists in the database
        const user = await User.findOne({ name });
        if (!user) {
            res.send('User not registered');
            return;
        }

        // User exists, generate JWT token
        const secret = JWT_SECRET + user.password;
        const payload = {
            name: user.name,
            id: user.id
        };
        const token = jwt.sign(payload, secret, { expiresIn: '5min' });
        const resetLink = `http://localhost:3000/reset-password/${user.id}/${token}`;

        // Send password reset link via email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'geomanuk20@gmail.com', // Replace with your email
                pass: 'fdna izua igon kiik' // Replace with your email password
            }
        });

        const mailOptions = {
            from: 'geomanuk20@gmail.com', // Replace with your email
            to: user.name,
            subject: 'Password Reset Link',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
                res.send('An error occurred while sending the email.');
            } else {
                console.log('Email sent:', info.response);
                res.send('Password reset link has been sent to your email.');
            }
        });
    } catch (error) {
        console.log('Error:', error);
        res.send('An error occurred while processing your request.');
    }
});

app.get('/reset-password/:id/:token', async (req, res, next) => {
    const { id, token } = req.params;
    try {
        // Find the user by ID
        const user = await User.findById(id);
        if (!user) {
            res.send('Invalid id...');
            return;
        }

        // Validate the token using user's password as part of the secret
        const secret = JWT_SECRET + user.password;
        const payload = jwt.verify(token, secret);

        // Render the reset password form with user's email
        res.render('reset-password', { name: user.name });
    } catch (error) {
        console.log(error.message);
        res.send(error.message);
    }
});


app.post('/reset-password/:id/:token', async (req, res) => {
    const { id, token } = req.params;
    const { password, password2 } = req.body;

    if (password !== password2) {
        res.send('Passwords do not match.');
        return;
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            res.send('User not found');
            return;
        }

        const secret = JWT_SECRET + user.password;
        const payload = jwt.verify(token, secret);

        // Update the user's password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user.password = hashedPassword;
        await user.save();

        res.send('Password successfully reset.');
    } catch (error) {
        console.log('Error:', error);
        res.send('Error resetting password.');
    }
});
app.listen(3000, () => console.log('Server running on port 3000'));





/*
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the user exists in the database
        const user = await User.findOne({ email });
        if (!user) {
            res.send('User not registered');
            return;
        }

        // User exists, generate JWT token
        const secret = JWT_SECRET + user.password;
        const payload = {
            name: user.name,
            id: user.id
        };
        const token = jwt.sign(payload, secret, { expiresIn: '5min' });
        const link = `http://localhost:3000/reset-password/${user.id}/${token}`;
        console.log(link);
        res.send('Password reset link has been sent to your email.');
    } catch (error) {
        console.log('Error:', error);
        res.send('An error occurred while processing your request.');
    }
});
*/