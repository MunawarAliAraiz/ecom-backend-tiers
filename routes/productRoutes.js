const express = require('express');
const router = express.Router();
const path = require('path')
const upload  = require('../uploads/multerConfig');
const port = 4000;
const Product = require('../models/ProductModel'); // Update the path accordingly


// Upload Endpoints for Image

router.use('/images', express.static(path.join(__dirname, '../upload/images')))

router.post('/upload', upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image: {
            url: `http://localhost:${port}/api/products/images/${req.file.filename}`
        }
    })
})

// Add a product
router.post('/addproduct', async (req, res) => {
    const products = await Product.find()
    let id;
    if (products.length === 0) {
        id = 1
    } else {
        id = products[products.length - 1].id + 1
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
        available: req.body.available
    })
    try {
        await product.save()
        console.log(product)
        res.json({
            success: true,
            name: req.body.name,
            message: "Product added successfully"
        })
    } catch (error) {
        res.status(500).send(error)
    }
})

// Delete a product
router.delete('/deleteproduct', async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({id: req.body.id})
        if (!product) {
            res.status(404).send()
        }
        res.json({
            success: true,
            message: `Product ${req.body.name} deleted successfully`
        })
    } catch (error) {
        res.status(500).send(error)
    }
})

// Edit a product
router.put('/editproduct', async (req, res) => {
    const productId = req.body.id;

    try {
        const product = await Product.findOneAndUpdate(
            { id: productId },
            {
                name: req.body.name,
                image: req.body.image,
                category: req.body.category,
                new_price: req.body.new_price,
                old_price: req.body.old_price,
                available: req.body.available
            },
            { new: true } // This option returns the modified document
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product with ID ${productId} not found`
            });
        }

        console.log(product);
        res.json({
            success: true,
            message: `Product ${product.name} edited successfully`,
            editedProduct: product
        });
    } catch (error) {
        res.status(500).send(error);
    }
});


// Get all products
router.get('/productlist', async (req, res) => {
    const products = await Product.find()
    res.send(products)
})


module.exports = router;
