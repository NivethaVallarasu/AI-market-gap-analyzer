const axios = require("axios");

const PRODUCT_HUNT_URL = "https://api.producthunt.com/v2/api/graphql";

async function searchProducts(keyword) {

    const query = `
{
  posts(first: 10) {
    edges {
      node {
        id
        name
        tagline
        description
        votesCount
        website
      }
    }
  }
}
`;

    try {

        const response = await axios.post(

            PRODUCT_HUNT_URL,

            {
                query,
                
            },

            {
                headers: {
                    Authorization: `Bearer ${process.env.PRODUCT_HUNT_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                timeout: 2000
            }

        );

        return response.data;

    } catch (error) {

        console.error(error.response?.data || error.message);

        throw error;

    }

}

module.exports = {
    searchProducts
};