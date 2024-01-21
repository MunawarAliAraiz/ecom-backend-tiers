const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;
require('dotenv').config();
const password = process.env.MONGO_DB_PASSWORD; // Update the password accordingly
const User = require('../models/UserModel'); // Update the path accordingly
const auth = require('../middleware/authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Endpoints for Users

// Register a user
router.post('/signup', async (req, res) => {

    let check = await User.findOne({email: req.body.email})
    if (check) {
        return res.status(400).json({
            success: false,
            message: "User already exists",
        })
    }
    let cart = {}
    for (let i = 1; i <= 300; i++) {
        cart[i] = 0
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        cartData: cart,
        password: hashedPassword
    })
    try {
        await user.save()
        const data = {
            user:{
                id:user.id
            }
        }

        const token = jwt.sign(data, password)
        res.status(201).json({
            success: true,
            token,
            message: "User registered successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// Login a user
router.post('/login', async (req, res) => {
    let user = await User.findOne({email: req.body.email})
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User does not exist",
        })
    }
    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) {
        console.log('password does not match')
        return res.status(400).json({
            success: false,
            message: "Incorrect password",
        })
    }
    const data = {
        user:{
            id:user.id
        }
    }
    const token = jwt.sign(data, password)
    res.json({
        success: true,
        token,
        message: "User logged in successfully"
    })
})

// Endpoint to add products to cart
router.post('/addtocart', auth, async (req, res) => {
    console.log(req.body, req.user)
    let user = await User.findOne({_id: req.user.id})
    user.cartData[req.body.product_id] += 1
    await User.findOneAndUpdate({_id: req.user.id}, {cartData: user.cartData})
    res.json({
        success: true,
        message: "Product added to cart successfully",
    })
})

// Endpoint to remove products to cart
router.post('/removefromcart', auth, async (req, res) => {
    console.log('removed', req.user)
    let user = await User.findOne({_id: req.user.id})
    if (user.cartData[req.body.product_id] > 0)
    user.cartData[req.body.product_id] -= 1
    await User.findOneAndUpdate({_id: req.user.id}, {cartData: user.cartData})
    res.json({
        success: true,
        message: "Product completely removed from cart successfully",
    })
})

// Endpoint to completely remove products to cart
router.post('/completelyremovefromcart', auth, async (req, res) => {
    console.log('removed', req.user)
    let user = await User.findOne({_id: req.user.id})
    if (user.cartData[req.body.product_id] > 0)
    user.cartData[req.body.product_id] = 0
    await User.findOneAndUpdate({_id: req.user.id}, {cartData: user.cartData})
    res.json({
        success: true,
        message: "Product completely removed from cart successfully",
    })
})

// Endpoint to empty cart
router.post('/emptycart', auth, async (req, res) => {
    console.log('removed', req.user)
    let user = await User.findOne({_id: req.user.id})
    for (let i = 1; i <= 300; i++) {
        user.cartData[i] = 0
    }
    await User.findOneAndUpdate({_id: req.user.id}, {cartData: user.cartData})
    res.json({
        success: true,
        message: "Cart emptied successfully",
    })
})

// Endpoint to get cart data
router.post('/getcartdata', auth, async (req, res) => {
    let user = await User.findOne({_id: req.user.id})
    res.json(user.cartData);
})

// Endpoint for checkout using Stripe
router.post('/checkout-session', auth, async (req, res) => {
    const {products} = req.body;

    const lineItems = products.map(product => {
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name,
                    images: [product.image],
                },
                unit_amount: Math.round(product.price*100),
            },
            quantity: product.quantity,
        }
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: 'https://e-commerce-tiers.netlify.app/success',
        cancel_url: 'https://e-commerce-tiers.netlify.app/cancel',
    });

    res.json({ id: session.id });
})

module.exports = router;
