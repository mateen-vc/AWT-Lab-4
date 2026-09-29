import { Product } from '../models/Product.js';

export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCTS_FETCH_ERROR',
        message: err.message,
      },
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: `Product with ID ${req.params.id} was not found`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_ID',
        message: err.message,
      },
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product name and price are required',
        },
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      stock,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PRODUCT_CREATION_FAILED',
        message: err.message,
      },
    });
  }
};
