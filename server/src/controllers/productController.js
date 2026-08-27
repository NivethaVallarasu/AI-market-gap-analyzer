const { searchProducts } = require("../services/productHuntService");

const getProducts = async (req, res) => {

    try {

        const products = await searchProducts("AI");

        res.json(products);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

};

module.exports = {
    getProducts
};