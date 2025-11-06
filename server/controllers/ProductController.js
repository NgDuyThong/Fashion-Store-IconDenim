const Product = require("../models/Product");
const Category = require("../models/Category");
const Target = require("../models/Target");
const ProductColor = require("../models/ProductColor");
const ProductSizeStock = require("../models/ProductSizeStock");
const Promotion = require("../models/Promotion"); // Thêm dòng này
const {
    getImageLink,
    uploadImage,
    deleteImage,
} = require("../middlewares/ImagesCloudinary_Controller");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const trainingData = require("../data/trainingData");
const cloudinary = require("cloudinary").v2;

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

class ProductController {
   
    // Lấy danh sách sản phẩm với phân trang và lọc
    async getProducts(req, res) {
        try {
            // Bước 1: Lấy các tham số từ request (giữ nguyên như cũ)
            const {
                page = 1,
                limit = 12,
                sort = '-createdAt',
                category,
                target,
                minPrice,
                maxPrice,
                search,
                isActivated,
                isAdmin = false,
                inStock,
                colorName,
                size,
            } = req.query;
    
            // Bước 2: Xây dựng match stage cho aggregate
            const matchStage = {};
    
            // Xử lý trạng thái active
            if (typeof isActivated !== 'undefined') {
                matchStage.isActivated = isActivated === 'true';
            } else if (!isAdmin) {
                matchStage.isActivated = true;
            }
    
            // Xử lý target (Nam/Nữ)
            if (target) {
                const targetValue = parseInt(target);
                console.log('🎯 Filter by target:', {
                    'req.query.target': target,
                    'typeof target': typeof target,
                    'parseInt(target)': targetValue,
                    'isNaN': isNaN(targetValue)
                });
                matchStage.targetID = targetValue;
            }
    
            // Xử lý category
            if (category && category !== 'Tất cả') {
                if (isNaN(category)) {
                    const categoryDoc = await Category.findOne({ name: category });
                    if (categoryDoc) matchStage.categoryID = categoryDoc.categoryID;
                } else {
                    matchStage.categoryID = parseInt(category);
                }
            }
    
            // Xử lý khoảng giá
            if (minPrice || maxPrice) {
                matchStage.price = {};
                if (minPrice) matchStage.price.$gte = parseInt(minPrice);
                if (maxPrice) matchStage.price.$lte = parseInt(maxPrice);
            }
    
            // Xử lý tìm kiếm
            if (search) {
                matchStage.name = new RegExp(search, 'i');
            }
    
            // Bước 3: Xây dựng sort stage
            const sortStage = {};
            switch (sort) {
                case 'price-asc': sortStage.price = 1; break;
                case 'price-desc': sortStage.price = -1; break;
                case 'name-asc': sortStage.name = 1; break;
                case 'name-desc': sortStage.name = -1; break;
                case 'stock-asc': sortStage.totalStock = 1; break;
                case 'stock-desc': sortStage.totalStock = -1; break;
                default: sortStage.createdAt = -1;
            }
    
            // Bước 4: Xây dựng pipeline
            const pipeline = [
                // Match stage đầu tiên (giữ nguyên)
                { $match: matchStage },
    
                // Join với Target (đơn giản hóa)
                {
                    $lookup: {
                        from: 'targets',
                        localField: 'targetID',
                        foreignField: 'targetID',
                        pipeline: [{ $project: { name: 1, _id: 0 } }],
                        as: 'targetInfo'
                    }
                },
                { $unwind: '$targetInfo' },
    
                // Join với Category (đơn giản hóa)
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryID',
                        foreignField: 'categoryID',
                        pipeline: [{ $project: { name: 1, _id: 0 } }],
                        as: 'categoryInfo'
                    }
                },
                { $unwind: '$categoryInfo' },
    
                // Join với ProductColor (đơn giản hóa)
                {
                    $lookup: {
                        from: 'product_colors',
                        let: { productID: '$productID' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$productID', '$$productID'] }
                                }
                            },
                {
                    $lookup: {
                                    from: 'product_sizes_stocks',
                                    let: { colorID: '$colorID' },
                        pipeline: [
                            {
                                $match: {
                                                $expr: { $eq: ['$colorID', '$$colorID'] }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 0,
                                                size: 1,
                                                stock: 1,
                                                SKU: 1
                                }
                            }
                        ],
                        as: 'sizes'
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    colorID: 1,
                                    productID: 1,
                                    colorName: 1,
                                    images: 1,
                                    sizes: 1
                                }
                            }
                        ],
                        as: 'colors'
                    }
                },

                // Tính totalStock (giữ nguyên)
                {
                    $addFields: {
                        totalStock: {
                            $reduce: {
                                input: '$colors',
                                initialValue: 0,
                                in: {
                                    $add: [
                                        '$$value',
                                        {
                                            $reduce: {
                                                input: '$$this.sizes',
                                                initialValue: 0,
                                                in: { $add: ['$$value', '$$this.stock'] }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },

                // Join với Promotion (đơn giản hóa)
                {
                    $lookup: {
                        from: 'promotions',
                        let: { productId: '$_id', categoryName: '$categoryInfo.name' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $or: [
                                                    { $in: ['$$productId', '$products'] },
                                                    { $in: ['$$categoryName', '$categories'] }
                                                ]
                                            },
                                            { $eq: ['$status', 'active'] },
                                            { $lte: ['$startDate', new Date()] },
                                            { $gte: ['$endDate', new Date()] }
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                    discountPercent: 1,
                                    endDate: 1
                                }
                            },
                            { $sort: { discountPercent: -1 } },
                            { $limit: 1 }
                        ],
                        as: 'promotion'
                    }
                },
                { $unwind: { path: '$promotion', preserveNullAndEmptyArrays: true } },
    
                // Tính discountedPrice
                {
                    $addFields: {
                        'promotion.discountedPrice': {
                            $toString: {
                                $round: [
                                    {
                                        $multiply: [
                                            { $toInt: '$price' },
                                            { $subtract: [1, { $divide: ['$promotion.discountPercent', 100] }] }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },

                // Sort và phân trang (giữ nguyên)
                { $sort: sortStage },
                { $skip: (parseInt(page) - 1) * parseInt(limit) },
                { $limit: parseInt(limit) },

                // Project kết quả cuối cùng (đơn giản hóa)
                {
                    $project: {
                    _id: 1,
                    productID: 1,
                    name: 1,
                        targetID: 1,
                        description: 1,
                    price: 1,
                        categoryID: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    thumbnail: 1,
                        isActivated: 1,
                        colors: 1,
                    category: '$categoryInfo.name',
                    target: '$targetInfo.name',
                    totalStock: 1,
                        inStock: { $gt: ['$totalStock', 0] },
                    promotion: {
                            $cond: {
                                if: '$promotion',
                                then: {
                        name: '$promotion.name',
                        discountPercent: '$promotion.discountPercent',
                                    discountedPrice: '$promotion.discountedPrice',
                        endDate: '$promotion.endDate'
                                },
                                else: null
                            }
                        }
                    }
                }
            ];
    
            // Thực hiện aggregate
            let products = await Product.aggregate(pipeline);

            // 🔍 DEBUG: Kiểm tra kết quả filter theo target
            if (target) {
                console.log('✅ Kết quả filter theo targetID:', {
                    'matchStage.targetID': matchStage.targetID,
                    'Tổng sản phẩm': products.length,
                    'Sample 3 sản phẩm đầu': products.slice(0, 3).map(p => ({
                        productID: p.productID,
                        name: p.name,
                        targetID: p.targetID,
                        target: p.target
                    }))
                });
            }
    
            // Xử lý cloudinary links
            products = await Promise.all(
                products.map(async (product) => {
                    // Xử lý thumbnail
                    product.thumbnail = await getImageLink(product.thumbnail);
    
                    // Xử lý images của từng màu
                    product.colors = await Promise.all(
                        product.colors.map(async (color) => {
                            color.images = await Promise.all(
                                color.images.map((img) => getImageLink(img))
                            );
                            return color;
                        })
                    );
    
                    return product;
                })
            );
    
            // Áp dụng các bộ lọc bổ sung
            if (inStock === 'true' || inStock === 'false') {
                const stockFilter = inStock === 'true';
                products = products.filter((product) =>
                    stockFilter ? product.totalStock > 0 : product.totalStock === 0
                );
            }
    
            if (colorName) {
                const colors = colorName.split(',');
                products = products.filter((product) =>
                    product.colors.some((color) => colors.includes(color.colorName))
                );
            }
    
            if (size) {
                const sizes = size.split(',');
                products = products.filter((product) =>
                    product.colors.some((color) =>
                        color.sizes.some((s) => sizes.includes(s.size))
                    )
                );
            }
    
            // Đếm tổng số sản phẩm để phân trang
            const total = await Product.countDocuments(matchStage);
    
            res.json({
                products,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page)
            });
    
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy danh sách sản phẩm',
                error: error.message
            });
        }
    }

    // Lấy thông tin cơ bản của tất cả sản phẩm (không phân trang)
    async getAllProductsBasicInfo(req, res) {
        try {
            // Lấy danh sách promotion đang active
            const activePromotions = await Promotion.find({
                status: 'active',
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            });

            // Sử dụng aggregate pipeline để xử lý dữ liệu
            const products = await Product.aggregate([
                // Lọc sản phẩm đang hoạt động
                {
                    $match: {
                        isActivated: true,
                    },
                },

                // Lookup để join với bảng Target
                {
                    $lookup: {
                        from: "targets",
                        localField: "targetID",
                        foreignField: "targetID",
                        as: "targetInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$targetInfo",
                        preserveNullAndEmptyArrays: true,
                    },
                },

                // Lookup để join với bảng Category
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryID",
                        foreignField: "categoryID",
                        as: "categoryInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$categoryInfo",
                        preserveNullAndEmptyArrays: true,
                    },
                },

                // Lookup để join với bảng ProductColor
                {
                    $lookup: {
                        from: "product_colors",
                        let: { productID: "$productID" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$productID", "$$productID"] }
                                }
                            },
                            // Lookup để join với bảng ProductSizeStock
                            {
                                $lookup: {
                                    from: "product_sizes_stocks",
                                    let: { colorID: "$colorID" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: { $eq: ["$colorID", "$$colorID"] }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 0,
                                                size: 1,
                                                stock: 1,
                                                SKU: 1
                                            }
                                        }
                                    ],
                                    as: "sizeStocks"
                                }
                            },
                            // Tính tổng stock cho mỗi màu
                            {
                                $addFields: {
                                    colorStock: {
                                        $reduce: {
                                            input: "$sizeStocks",
                                            initialValue: 0,
                                            in: { $add: ["$$value", "$$this.stock"] }
                                        }
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    colorID: 1,
                                    productID: 1,
                                    colorName: 1,
                                    images: 1,
                                    sizeStocks: 1,
                                    colorStock: 1
                                }
                            }
                        ],
                        as: "colors"
                    }
                },

                // Tính toán các trường cần thiết
                {
                    $addFields: {
                        colorCount: { $size: "$colors" },
                        totalStock: {
                            $reduce: {
                                input: "$colors",
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.colorStock"] }
                            }
                        }
                    }
                },

                // Project để chọn các trường cần trả về
                {
                    $project: {
                        _id: 1,
                        productID: 1,
                        name: 1,
                        price: { $toString: "$price" },
                        category: "$categoryInfo.name",
                        target: "$targetInfo.name",
                        thumbnail: 1,
                        colorCount: 1,
                        totalStock: 1,
                        inStock: { $gt: ["$totalStock", 0] },
                        colors: {
                            $map: {
                                input: "$colors",
                                as: "color",
                                in: {
                                    colorID: "$$color.colorID",
                                    colorName: "$$color.colorName",
                                    images: "$$color.images",
                                    stock: "$$color.colorStock",
                                    sizes: "$$color.sizeStocks"
                                }
                            }
                        }
                    }
                }
            ]);

            // Xử lý thumbnail URL và thêm thông tin promotion cho các sản phẩm
            const productsWithPromotions = await Promise.all(
                products.map(async (product) => {
                    // Tìm promotion phù hợp cho sản phẩm
                    const applicablePromotion = activePromotions.find(promo => {
                        const isProductIncluded = promo.products.some(p => 
                            p.toString() === product._id.toString()
                        );
                        const isCategoryIncluded = promo.categories.includes(product.category);
                        return isProductIncluded || isCategoryIncluded;
                    });

                    // Xử lý thumbnail và images của từng màu
                    const processedProduct = {
                        ...product,
                        thumbnail: product.thumbnail ? await getImageLink(product.thumbnail) : null,
                        colors: await Promise.all(
                            product.colors.map(async (color) => ({
                                ...color,
                                images: await Promise.all(
                                    (color.images || []).map(img => getImageLink(img))
                                )
                            }))
                        ),
                        promotion: applicablePromotion ? {
                            name: applicablePromotion.name,
                            description: applicablePromotion.description,
                            type: applicablePromotion.type,
                            endDate: applicablePromotion.endDate,
                            discountPercent: applicablePromotion.discountPercent
                        } : null,
                        discount: applicablePromotion ? applicablePromotion.discountPercent : 0
                    };

                    return processedProduct;
                })
            );

            res.json({
                success: true,
                products: productsWithPromotions
            });
        } catch (error) {
            console.error("Lỗi khi lấy thông tin sản phẩm:", error);
            res.status(500).json({
                message: "Có lỗi xảy ra khi lấy thông tin sản phẩm",
                error: error.message,
            });
        }
    }

    // Lấy chi tiết sản phẩm theo ID
    async getProductById(req, res) {
        try {
            // Sắp xếp kích thước theo thứ tự mong muốn
            const sizeOrder = ["S", "M", "L", "XL", "XXL"];

            const { id } = req.params;

            // Lấy thông tin cơ bản của sản phẩm, sử dụng productID thay vì _id
            const product = await Product.findOne({ productID: id })
                .populate("targetInfo", "name")
                .populate("categoryInfo", "name");

            if (!product) {
                return res.status(404).json({
                    message: "Không tìm thấy sản phẩm",
                });
            }

            // Lấy tất cả màu của sản phẩm
            const colors = await ProductColor.find({ productID: product.productID });

            // Xử lý thumbnail bằng Cloudinary
            const thumbnail = product.thumbnail
                ? await getImageLink(product.thumbnail)
                : null;

            // Lấy thông tin size và tồn kho cho từng màu
            const colorsWithSizes = await Promise.all(
                colors.map(async (color) => {
                    const sizes = await ProductSizeStock.find({
                        colorID: color.colorID,
                    }).select("size stock");

                    sizes.sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));

                    // Xử lý hình ảnh từng màu sắc bằng Cloudinary
                    const imagesPromises = color.images.map(
                        async (img) => await getImageLink(img)
                    );
                    const images = await Promise.all(imagesPromises);

                    return {
                        colorID: color.colorID,
                        colorName: color.colorName,
                        images: images || [], // Lưu ảnh đã xử lý từ Cloudinary
                        sizes: sizes.map((size) => ({
                            size: size.size,
                            stock: size.stock,
                        })),
                    };
                })
            );

            // Lấy promotion đang active cho sản phẩm
            const currentDate = new Date();
            const activePromotion = await Promotion.findOne({
                $or: [
                    { products: product._id },
                    { categories: product.categoryInfo.name },
                ],
                startDate: { $lte: currentDate },
                endDate: { $gte: currentDate },
                status: "active",
            }).sort({ discountPercent: -1 }); // Lấy promotion có giảm giá cao nhất

            // Tính giá sau khuyến mãi nếu có
            let discountedPrice = null;
            if (activePromotion) {
                const priceNumber = Number(product.price.toString().replace(/\./g, ""));
                const discountedNumber = Math.round(
                    priceNumber * (1 - activePromotion.discountPercent / 100)
                );
                discountedPrice = discountedNumber
                    .toString()
            }

            // Tạo object chứa thông tin sản phẩm
            const formattedProduct = {
                _id: product._id,
                productID: product.productID,
                name: product.name,
                description: product.description,
                price: Number(product.price.toString().replace(/\./g, "")),
                category: product.categoryInfo?.name,
                target: product.targetInfo?.name,
                thumbnail: thumbnail, // Ảnh từ Cloudinary
                colors: colorsWithSizes,
                promotion: activePromotion
                    ? {
                    name: activePromotion.name,
                    description: activePromotion.description,
                    discountPercent: activePromotion.discountPercent,
                    discountedPrice: discountedPrice,
                        endDate: activePromotion.endDate,
                    }
                    : null,
                // Tính toán các thông tin bổ sung
                totalStock: colorsWithSizes.reduce(
                    (total, color) =>
                        total + color.sizes.reduce((sum, size) => sum + size.stock, 0),
                    0
                ),
                availableSizes: [
                    ...new Set(
                        colorsWithSizes.flatMap((color) =>
                            color.sizes.map((size) => size.size)
                        )
                    ),
                ].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)),
                availableColors: colorsWithSizes.map((color) => color.colorName),
            };

            res.json({
                success: true,
                product: formattedProduct,
            });
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
            res.status(500).json({
                message: "Có lỗi xảy ra khi lấy chi tiết sản phẩm",
                error: error.message,
            });
        }
    }

    // Lấy sản phẩm theo gender
    async getProductsByGender(req, res) {
        try {
            const {
                targetID,
                page = 1,
                limit = 12,
                sort = '-createdAt',
                categories,
                minPrice,
                maxPrice,
                search,
            } = req.query;

            // Validate targetID
            if (!targetID) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu tham số targetID"
                });
            }

            // Bước 1: Xây dựng match stage cơ bản
            const matchStage = {
                isActivated: true,
                targetID: parseInt(targetID)
            };

            // Xử lý lọc theo danh mục
            if (categories && categories !== "") {
                const categoryNames = categories.split(",");
                const categoryDocs = await Category.find({
                    name: { $in: categoryNames },
                });
                if (categoryDocs.length > 0) {
                    const categoryIDs = categoryDocs.map((cat) => cat.categoryID);
                    matchStage.categoryID = { $in: categoryIDs };
                }
            }

            // Xử lý lọc theo giá
            if (minPrice || maxPrice) {
                matchStage.price = {};
                if (minPrice) matchStage.price.$gte = parseInt(minPrice);
                if (maxPrice) matchStage.price.$lte = parseInt(maxPrice);
            }

            // Xử lý tìm kiếm theo tên
            if (search) {
                matchStage.name = new RegExp(search, 'i');
            }

            // Bước 2: Xây dựng sort stage
            const sortStage = {};
            switch (sort) {
                case 'price-asc': sortStage.price = 1; break;
                case 'price-desc': sortStage.price = -1; break;
                case 'name-asc': sortStage.name = 1; break;
                case 'name-desc': sortStage.name = -1; break;
                case 'stock-asc': sortStage.totalStock = 1; break;
                case 'stock-desc': sortStage.totalStock = -1; break;
                default: sortStage.createdAt = -1;
            }

            // Bước 3: Xây dựng pipeline
            const pipeline = [
                // Match stage đầu tiên
                { $match: matchStage },

                // Join với Target
                {
                    $lookup: {
                        from: 'targets',
                        localField: 'targetID',
                        foreignField: 'targetID',
                        pipeline: [{ $project: { name: 1, _id: 0 } }],
                        as: 'targetInfo'
                    }
                },
                { $unwind: '$targetInfo' },

                // Join với Category
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryID',
                        foreignField: 'categoryID',
                        pipeline: [{ $project: { name: 1, _id: 0 } }],
                        as: 'categoryInfo'
                    }
                },
                { $unwind: '$categoryInfo' },

                // Join với ProductColor và ProductSizeStock
                {
                    $lookup: {
                        from: 'product_colors',
                        let: { productID: '$productID' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$productID', '$$productID'] }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'product_sizes_stocks',
                                    let: { colorID: '$colorID' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: { $eq: ['$colorID', '$$colorID'] }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                sizeStockID: 1,
                                                colorID: 1,
                                                size: 1,
                                                stock: 1,
                                                SKU: 1
                                            }
                                        }
                                    ],
                                    as: 'sizes'
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    colorID: 1,
                                    productID: 1,
                                    colorName: 1,
                                    images: 1,
                                    sizes: 1
                                }
                            }
                        ],
                        as: 'colors'
                    }
                },

                // Tính totalStock
                {
                    $addFields: {
                        totalStock: {
                            $reduce: {
                                input: '$colors',
                                initialValue: 0,
                                in: {
                                    $add: [
                                        '$$value',
                                        {
                                            $reduce: {
                                                input: '$$this.sizes',
                                                initialValue: 0,
                                                in: { $add: ['$$value', '$$this.stock'] }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },

                // Join với Promotion
                {
                    $lookup: {
                        from: 'promotions',
                        let: { productId: '$_id', categoryName: '$categoryInfo.name' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $or: [
                                                    { $in: ['$$productId', '$products'] },
                                                    { $in: ['$$categoryName', '$categories'] }
                                                ]
                                            },
                                            { $eq: ['$status', 'active'] },
                                            { $lte: ['$startDate', new Date()] },
                                            { $gte: ['$endDate', new Date()] }
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                    discountPercent: 1,
                                    endDate: 1
                                }
                            },
                            { $sort: { discountPercent: -1 } },
                            { $limit: 1 }
                        ],
                        as: 'promotion'
                    }
                },
                { $unwind: { path: '$promotion', preserveNullAndEmptyArrays: true } },

                // Tính discountedPrice
                {
                    $addFields: {
                        'promotion.discountedPrice': {
                            $toString: {
                                $round: [
                                    {
                                        $multiply: [
                                            { $toInt: '$price' },
                                            { $subtract: [1, { $divide: ['$promotion.discountPercent', 100] }] }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },

                // Sort và phân trang
                { $sort: sortStage },
                { $skip: (parseInt(page) - 1) * parseInt(limit) },
                { $limit: parseInt(limit) },

                // Project kết quả cuối cùng
                {
                    $project: {
                        _id: 1,
                        productID: 1,
                        name: 1,
                        targetID: 1,
                        price: 1,
                        categoryID: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        thumbnail: 1,
                        isActivated: 1,
                        colors: 1,
                        category: '$categoryInfo.name',
                        inStock: { $gt: ['$totalStock', 0] },
                        promotion: {
                            $cond: {
                                if: '$promotion',
                                then: {
                                    name: '$promotion.name',
                                    discountPercent: '$promotion.discountPercent',
                                    discountedPrice: '$promotion.discountedPrice',
                                    endDate: '$promotion.endDate'
                                },
                                else: null
                            }
                        }
                    }
                }
            ];

            // Thực hiện aggregate
            let products = await Product.aggregate(pipeline);

            // Xử lý cloudinary links
            products = await Promise.all(
                products.map(async (product) => {
                    // Xử lý thumbnail
                    product.thumbnail = await getImageLink(product.thumbnail);

                    // Xử lý images của từng màu
                    product.colors = await Promise.all(
                        product.colors.map(async (color) => {
                            color.images = await Promise.all(
                                color.images.map((img) => getImageLink(img))
                            );
                            return color;
                        })
                    );

                    return product;
                })
            );

            // Đếm tổng số sản phẩm để phân trang
            const total = await Product.countDocuments(matchStage);

            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        total,
                        totalPages: Math.ceil(total / parseInt(limit)),
                        currentPage: parseInt(page),
                        pageSize: parseInt(limit),
                    },
                },
            });

        } catch (error) {
            console.error("Lỗi khi lấy sản phẩm theo gender:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    async toggleProductStatus(req, res) {
        try {
            const { id } = req.params;

            // Tìm sản phẩm
            const product = await Product.findOne({ productID: id });
            if (!product) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
            }

            // Đảo ngược trạng thái isActivated
            product.isActivated = !product.isActivated;
            await product.save();

            res.json({
                message: `Đã ${product.isActivated ? "kích hoạt" : "vô hiệu hóa"
                    } sản phẩm thành công`,
                isActivated: product.isActivated,
            });
        } catch (error) {
            console.error("Lỗi trong quá trình thay đổi trạng thái:", error);
            res.status(500).json({
                message: "Có lỗi xảy ra khi thay đổi trạng thái sản phẩm",
                error: error.message,
            });
        }
    }

    // Thêm method mới để lấy sản phẩm theo category
    async getProductsByCategory(req, res) {
        try {
            const { categoryID } = req.params;
            const { page = 1, limit = 12, sort = "-createdAt" } = req.query;

            // Kiểm tra category tồn tại
            const category = await Category.findOne({
                categoryID: parseInt(categoryID),
            });
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy danh mục",
                });
            }

            // Xây dựng query cơ bản
            const query = {
                categoryID: parseInt(categoryID),
                isActivated: true,
            };

            // Xử lý sắp xếp
            let sortOptions = {};
            switch (sort) {
                case "price-asc":
                    sortOptions.price = 1;
                    break;
                case "price-desc":
                    sortOptions.price = -1;
                    break;
                case "name-asc":
                    sortOptions.name = 1;
                    break;
                case "name-desc":
                    sortOptions.name = -1;
                    break;
                case "newest":
                    sortOptions.createdAt = -1;
                    break;
                case "oldest":
                    sortOptions.createdAt = 1;
                    break;
                default:
                    sortOptions.createdAt = -1;
            }

            // Thực hiện query với phân trang
            const products = await Product.find(query)
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate("targetInfo", "name")
                .populate("categoryInfo", "name");

            // Lấy ngày hiện tại để kiểm tra khuyến mãi
            const currentDate = new Date();

            // Xử lý thông tin chi tiết cho từng sản phẩm
            const enhancedProducts = await Promise.all(
                products.map(async (product) => {
                // Lấy thông tin màu sắc và kích thước
                    const colors = await ProductColor.find({
                        productID: product.productID,
                    });
                    const colorsWithSizes = await Promise.all(
                        colors.map(async (color) => {
                            const sizes = await ProductSizeStock.find({
                                colorID: color.colorID,
                            });

                    // Xử lý images cho từng màu sắc
                            const imagesPromises = color.images.map(
                                async (img) => await getImageLink(img)
                            );
                    const images = await Promise.all(imagesPromises);

                    return {
                        colorID: color.colorID,
                        colorName: color.colorName,
                        images: images || [],
                                sizes: sizes.map((size) => ({
                            size: size.size,
                                    stock: size.stock,
                                })),
                    };
                        })
                    );

                // Tính tổng tồn kho
                    const totalStock = colorsWithSizes.reduce(
                        (total, color) =>
                            total + color.sizes.reduce((sum, size) => sum + size.stock, 0),
                        0
                    );

                // Tìm khuyến mãi đang áp dụng
                const activePromotion = await Promotion.findOne({
                    $or: [
                        { products: product._id },
                            { categories: product.categoryInfo.name },
                    ],
                    startDate: { $lte: currentDate },
                    endDate: { $gte: currentDate },
                        status: "active",
                }).sort({ discountPercent: -1 });

                // Tính giá sau khuyến mãi
                let promotionDetails = null;
                if (activePromotion) {
                        const priceNumber = parseInt(product.price.replace(/\./g, ""));
                        const discountedValue = Math.round(
                            priceNumber * (1 - activePromotion.discountPercent / 100)
                        );
                    promotionDetails = {
                        name: activePromotion.name,
                        discountPercent: activePromotion.discountPercent,
                            discountedPrice: discountedValue.toLocaleString("vi-VN"),
                            endDate: activePromotion.endDate,
                    };
                }

                return {
                    productID: product.productID,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    thumbnail: await getImageLink(product.thumbnail),
                        category: product.categoryInfo?.name,
                        target: product.targetInfo.name,
                    colors: colorsWithSizes,
                    totalStock,
                    inStock: totalStock > 0,
                        promotion: promotionDetails,
                };
                })
            );

            // Đếm tổng số sản phẩm
            const total = await Product.countDocuments(query);

            // Thống kê bổ sung cho category
            const stats = {
                totalProducts: total,
                inStockProducts: enhancedProducts.filter((p) => p.inStock).length,
                outOfStockProducts: enhancedProducts.filter((p) => !p.inStock)
                    .length,
                productsOnPromotion: enhancedProducts.filter((p) => p.promotion)
                    .length,
            };

            res.json({
                success: true,
                category: {
                    id: category.categoryID,
                    name: category.name,
                    description: category.description,
                    imageURL: await getImageLink(category.imageURL),
                },
                products: enhancedProducts,
                stats,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                },
            });
        } catch (error) {
            console.error("Error in getProductsByCategory:", error);
            res.status(500).json({
                success: false,
                message: "Có lỗi xảy ra khi lấy danh sách sản phẩm theo danh mục",
                error: error.message,
            });
        }
    }

    // Thêm method để lấy tất cả sản phẩm được nhóm theo danh mục
    async getAllProductsByCategories(req, res) {
        try {
            // Lấy tất cả danh mục
            const categories = await Category.find().sort({ categoryID: 1 });

            // Lấy ngày hiện tại để kiểm tra khuyến mãi
            const currentDate = new Date();

            // Xử lý từng danh mục và sản phẩm của nó
            const categoriesWithProducts = await Promise.all(
                categories.map(async (category) => {
                // Lấy sản phẩm theo danh mục
                const products = await Product.find({
                    categoryID: category.categoryID,
                        isActivated: true,
                })
                        .populate("targetInfo", "name")
                    .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất

                // Xử lý chi tiết cho từng sản phẩm
                    const enhancedProducts = await Promise.all(
                        products.map(async (product) => {
                    // Lấy thông tin màu sắc và kích thước
                            const colors = await ProductColor.find({
                                productID: product.productID,
                            });
                            const colorsWithSizes = await Promise.all(
                                colors.map(async (color) => {
                                    const sizes = await ProductSizeStock.find({
                                        colorID: color.colorID,
                                    });
                        return {
                            colorID: color.colorID,
                            colorName: color.colorName,
                                        sizes: sizes.map((size) => ({
                                size: size.size,
                                            stock: size.stock,
                                        })),
                        };
                                })
                            );

                    // Tính tổng tồn kho
                            const totalStock = colorsWithSizes.reduce(
                                (total, color) =>
                                    total +
                                    color.sizes.reduce((sum, size) => sum + size.stock, 0),
                                0
                            );

                    // Tìm khuyến mãi đang áp dụng
                    const activePromotion = await Promotion.findOne({
                                $or: [{ products: product._id }, { categories: category.name }],
                        startDate: { $lte: currentDate },
                        endDate: { $gte: currentDate },
                                status: "active",
                    }).sort({ discountPercent: -1 });

                    // Tính giá sau khuyến mãi
                    let promotionDetails = null;
                    if (activePromotion) {
                                const priceNumber = parseInt(product.price.replace(/\./g, ""));
                                const discountedValue = Math.round(
                                    priceNumber * (1 - activePromotion.discountPercent / 100)
                                );
                        promotionDetails = {
                            name: activePromotion.name,
                            discountPercent: activePromotion.discountPercent,
                                    discountedPrice: discountedValue.toLocaleString("vi-VN"),
                                    endDate: activePromotion.endDate,
                        };
                    }

                    return {
                        productID: product.productID,
                        name: product.name,
                        price: product.price,
                        thumbnail: await getImageLink(product.thumbnail),
                        target: product.targetInfo.name,
                        totalStock,
                        inStock: totalStock > 0,
                                promotion: promotionDetails,
                    };
                        })
                    );

                // Thống kê cho danh mục
                const categoryStats = {
                    totalProducts: enhancedProducts.length,
                        inStockProducts: enhancedProducts.filter((p) => p.inStock).length,
                        outOfStockProducts: enhancedProducts.filter((p) => !p.inStock)
                            .length,
                        productsOnPromotion: enhancedProducts.filter((p) => p.promotion)
                            .length,
                };

                return {
                    categoryID: category.categoryID,
                    name: category.name,
                    description: category.description,
                    imageURL: await getImageLink(category.imageURL),
                    stats: categoryStats,
                        products: enhancedProducts,
                };
                })
            );

            res.json({
                success: true,
                categories: categoriesWithProducts,
            });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách sản phẩm theo danh mục:", error);
            res.status(500).json({
                success: false,
                message: "Có lỗi xảy ra khi lấy danh sách sản phẩm theo danh mục",
                error: error.message,
            });
        }
    }

    //!ADMIN - Lấy danh sách sản phẩm
    // "product" + "stats : tổng sp , sp nam , sp nữ"
    async getProductsChoADMIN(req, res) {
        try {
            // Sử dụng aggregation để lấy và chuyển đổi dữ liệu trực tiếp
            const products = await Product.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryID",
                        foreignField: "categoryID",
                        as: "category",
                    },
                },
                {
                    $lookup: {
                        from: "targets",
                        localField: "targetID",
                        foreignField: "targetID",
                        as: "target",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        productID: 1,
                        name: 1,
                        price: 1,
                        createdAt: 1,
                        thumbnail: 1,
                        inStock: 1,
                        isActivated: 1,
                        category: { $arrayElemAt: ["$category.name", 0] },
                        target: { $arrayElemAt: ["$target.name", 0] },
                        description: 1,
                    },
                },
            ]);

            // Xử lý thumbnail với Cloudinary
            const productsWithCloudinary = await Promise.all(
                products.map(async (product) => ({
                ...product,
                    thumbnail: await getImageLink(product.thumbnail),
                }))
            );

            // Tính toán thống kê
            const stats = {
                totalMaleProducts: products.filter((p) => p.target === "Nam").length,
                totalFemaleProducts: products.filter((p) => p.target === "Nữ").length,
                totalDeactivatedProducts: products.filter((p) => !p.isActivated).length,
                total: products.length,
            };

            res.json({
                products: productsWithCloudinary,
                stats,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Có lỗi xảy ra khi lấy danh sách sản phẩm",
                error: error.message,
            });
        }
    }

    //!ADMIN -  Lấy chi tiết sản phẩm theo ID có cloudinary
    async getProductByIdChoADMIN(req, res) {
        try {

            // Sắp xếp kích thước theo thứ tự mong muốn
            const sizeOrder = ["S", "M", "L"];

            const { id } = req.params;

            // Lấy thông tin cơ bản của sản phẩm, sử dụng productID thay vì _id
            const product = await Product.findOne({ productID: id })
                .populate("targetInfo", "name")
                .populate("categoryInfo", "name");

            if (!product) {
                return res.status(404).json({
                    message: "Không tìm thấy sản phẩm",
                });
            }

            // Lấy tất cả màu của sản phẩm
            const colors = await ProductColor.find({ productID: product.productID });

            // Lấy thông tin size và tồn kho cho từng màu
            const colorsWithSizes = await Promise.all(
                colors.map(async (color) => {
                    const sizes = await ProductSizeStock.find({
                        colorID: color.colorID,
                    }).select("size stock SKU");

                    sizes.sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));

                    // Xử lý hình ảnh cho từng màu sắc
                    const imagesPromises = color.images.map(
                        async (img) => await getImageLink(img)
                    );
                    const images = await Promise.all(imagesPromises);

                    return {
                        colorID: color.colorID,
                        colorName: color.colorName,
                        images: images || [],
                        sizes: sizes.map((size) => ({
                            size: size.size,
                            stock: size.stock,
                            SKU: size.SKU
                        })),
                    };
                })
            );

            // Lấy promotion đang active cho sản phẩm
            const currentDate = new Date();
            const activePromotion = await Promotion.findOne({
                $or: [
                    { products: product._id },
                    { categories: product.categoryInfo.name },
                ],
                startDate: { $lte: currentDate },
                endDate: { $gte: currentDate },
                status: "active",
            }).sort({ discountPercent: -1 }); // Lấy promotion có giảm giá cao nhất

            // Tính giá sau khuyến mãi nếu có
            let discountedPrice = null;
            if (activePromotion) {
                // Chuyển đổi giá từ string sang number, loại bỏ dấu chấm
                const priceNumber = Number(product.price.replace(/\./g, ""));
                // Tính toán giá sau khuyến mãi
                const discountedNumber = Math.round(
                    priceNumber * (1 - activePromotion.discountPercent / 100)
                );
                // Chuyển đổi lại thành định dạng VN
                discountedPrice = discountedNumber
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            }

            // Format lại dữ liệu trước khi gửi về client
            const formattedProduct = {
                _id: product._id,
                productID: product.productID,
                name: product.name,
                description: product.description,
                price: Number(product.price.toString().replace(/\./g, '')),
                category: product.categoryInfo?.name,
                target: product.targetInfo?.name,
                thumbnail: await getImageLink(product.thumbnail),
                colors: colorsWithSizes,
                promotion: activePromotion
                    ? {
                    name: activePromotion.name,
                    description: activePromotion.description,
                    discountPercent: activePromotion.discountPercent,
                    discountedPrice: Number(discountedPrice.toString().replace(/\./g,'')),
                        endDate: activePromotion.endDate,
                    }
                    : null,
                // Tính toán các thông tin bổ sung
                totalStock: colorsWithSizes.reduce(
                    (total, color) =>
                        total + color.sizes.reduce((sum, size) => sum + size.stock, 0),
                    0
                ),
                availableSizes: [
                    ...new Set(
                        colorsWithSizes.flatMap((color) =>
                            color.sizes.map((size) => size.size)
                        )
                    ),
                ].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)),
                availableColors: colorsWithSizes.map((color) => color.colorName),
            };

            res.json({
                product: formattedProduct,
            });
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
            res.status(500).json({
                message: "Có lỗi xảy ra khi lấy chi tiết sản phẩm",
                error: error.message,
            });
        }
    }

    //!ADMIN: Tạo sản phẩm mới
    async createProduct(req, res) {
        try {

            const {
                name,
                price,
                description,
                thumbnail,
                categoryID,
                targetID,
                colors,
            } = req.body;

            // Kiểm tra dữ liệu đầu vào
            if (
                !name ||
                !price ||
                !description ||
                !thumbnail ||
                !categoryID ||
                !targetID
            ) {
                return res.status(400).json({
                    message: "Vui lòng điền đầy đủ thông tin sản phẩm",
                });
            }

            // Kiểm tra target và category tồn tại
            const [target, category] = await Promise.all([
                Target.findOne({ targetID: targetID }),
                Category.findOne({ categoryID: categoryID }),
            ]);

            if (!target || !category) {
                return res.status(400).json({
                    message: "Target hoặc Category không tồn tại",
                });
            }

            // Tạo productID mới
            const lastProduct = await Product.findOne().sort({ productID: -1 });
            const newProductID = lastProduct ? lastProduct.productID + 1 : 1;

            // Tạo sản phẩm mới
            const newProduct = new Product({
                productID: newProductID,
                name,
                price: Number(price),
                description,
                thumbnail,
                categoryID: category.categoryID,
                targetID: target.targetID,
                isActivated: true,
            });

            // Lưu sản phẩm
            const savedProduct = await newProduct.save();

            // Xử lý màu sắc và size nếu có
            if (colors && colors.length > 0) {
                // Tạo colorID mới
                const lastColor = await ProductColor.findOne().sort({ colorID: -1 });
                let nextColorID = lastColor ? lastColor.colorID + 1 : 1;

                // Tìm sizeStockID cuối cùng
                const lastSizeStock = await ProductSizeStock.findOne().sort({
                    sizeStockID: -1,
                });
                let nextSizeStockID = lastSizeStock ? lastSizeStock.sizeStockID + 1 : 1;

                for (const color of colors) {
                    // Tạo màu mới
                    const newColor = new ProductColor({
                        colorID: nextColorID,
                        productID: newProductID,
                        colorName: color.colorName,
                        images: color.images,
                    });
                    const savedColor = await newColor.save();

                    // Tạo size stocks cho màu này
                    if (color.sizes && color.sizes.length > 0) {
                        const sizeStocks = color.sizes.map((size) => {
                            const sizeStockID = nextSizeStockID++;
                            return {
                                sizeStockID,
                                SKU: `${newProductID}_${nextColorID}_${size.size}_${sizeStockID}`,
                                colorID: savedColor.colorID,
                                size: size.size,
                                stock: size.stock,
                            };
                        });

                        await ProductSizeStock.insertMany(sizeStocks);
                    }

                    nextColorID++;
                }
            }

            // Lấy sản phẩm đã tạo với đầy đủ thông tin
            const createdProduct = await Product.findOne({ productID: newProductID })
                .populate("targetInfo", "name")
                .populate("categoryInfo", "name");

            // Xử lý thumbnail URL trước khi trả về
            const productWithThumbnail = {
                ...createdProduct.toObject(),
                thumbnail: await getImageLink(createdProduct.thumbnail),
            };

            res.status(201).json({
                message: "Thêm sản phẩm mới thành công",
                product: productWithThumbnail,
            });
            // Log thông tin sản phẩm vừa tạo
            console.log('Thông tin sản phẩm vừa tạo:', {
                productID: createdProduct.productID,
                name: createdProduct.name,
                price: createdProduct.price,
                targetInfo: createdProduct.targetInfo,
                categoryInfo: createdProduct.categoryInfo,
                thumbnail: productWithThumbnail.thumbnail
            });

            // Log thông tin màu sắc vừa tạo
            const createdColors = await ProductColor.find({ productID: newProductID })
                .populate({
                    path: 'colorID',
                    select: 'colorName images'
                });

            console.log('Thông tin màu sắc vừa tạo:', createdColors.map(color => ({
                colorID: color.colorID,
                colorName: color.colorName,
                images: color.images,
                productID: color.productID
            })));
            // Log thông tin size và stock vừa tạo
            const createdSizeStocks = await ProductSizeStock.find({
                colorID: { $in: createdColors.map(color => color.colorID) }
            });

            console.log('Thông tin size và stock vừa tạo:', createdSizeStocks.map(sizeStock => ({
                sizeStockID: sizeStock.sizeStockID,
                colorID: sizeStock.colorID,
                size: sizeStock.size,
                stock: sizeStock.stock,
                SKU: sizeStock.SKU
            })));


        } catch (error) {
            console.error("Lỗi khi thêm sản phẩm mới:", error);
            res.status(500).json({
                message: "Có lỗi xảy ra khi thêm sản phẩm mới",
                error: error.message,
            });
        }
    }

    //!ADMIN - Cập nhật sản phẩm
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const thumbnailFile = req.files?.thumbnail;

            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findOne({ productID: id });
            if (!product) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
            }

            // Nếu cập nhật target hoặc category, kiểm tra tồn tại
            if (updateData.targetID || updateData.categoryID) {
                const [target, category] = await Promise.all([
                    updateData.targetID
                        ? Target.findOne({ targetID: updateData.targetID })
                        : Promise.resolve(true),
                    updateData.categoryID
                        ? Category.findOne({ categoryID: updateData.categoryID })
                        : Promise.resolve(true),
                ]);

                if (!target || !category) {
                    return res.status(400).json({
                        message: "Target hoặc Category không tồn tại",
                    });
                }
            }

            // Xử lý upload thumbnail mới nếu có
            if (thumbnailFile) {
                const thumbnailResult = await uploadImage(thumbnailFile);
                if (!thumbnailResult.success) {
                    return res.status(400).json({
                        message: "Lỗi khi upload ảnh thumbnail",
                    });
                }
                updateData.thumbnail = thumbnailResult.publicId;
            }

            // Chỉ cập nhật các thông tin chung của sản phẩm
            const allowedUpdates = {
                name: updateData.name,
                description: updateData.description,
                price: updateData.price,
                targetID: updateData.targetID,
                categoryID: updateData.categoryID,
                isActivated: updateData.isActivated,
                thumbnail: updateData.thumbnail, // Thêm thumbnail vào danh sách cập nhật
            };

            // Lọc bỏ các giá trị undefined
            Object.keys(allowedUpdates).forEach(
                (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
            );

            // Cập nhật thông tin sản phẩm
            Object.assign(product, allowedUpdates);
            await product.save();

            res.json({ 
                success: true,
                message: "Cập nhật sản phẩm thành công",
                product: product
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Có lỗi xảy ra khi cập nhật sản phẩm",
            });
        }
    }

    //!ADMIN - Xóa sản phẩm và ảnh liên quan
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            // Import hàm xóa ảnh từ Cloudinary
            const { deleteImage: deleteCloudinaryImage } = require('../middlewares/ImagesCloudinary_Controller');

            // Tìm sản phẩm
            const product = await Product.findOne({ productID: id });
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    message: "Không tìm thấy sản phẩm" 
                });
            }

            // Xóa thumbnail của sản phẩm từ Cloudinary nếu có
            if (product.thumbnail) {
                const isThumbnailDeleted = await deleteCloudinaryImage(product.thumbnail);
                if (!isThumbnailDeleted) {
                    return res.status(500).json({
                        success: false,
                        message: `Không thể xóa thumbnail: ${product.thumbnail}`
                    });
                }
            }

            // Tìm tất cả màu sắc của sản phẩm
            const colors = await ProductColor.find({ productID: id });
            const colorIDs = colors.map(color => color.colorID);

            // Xóa tất cả ảnh của các màu từ Cloudinary
            for (const color of colors) {
                if (color.images && color.images.length > 0) {
                    for (const imageUrl of color.images) {
                        const isDeleted = await deleteCloudinaryImage(imageUrl);
                        if (!isDeleted) {
                            return res.status(500).json({
                                success: false,
                                message: `Không thể xóa hình ảnh: ${imageUrl}`
                            });
                        }
                    }
                }
            }

            // Xóa tất cả size-stock liên quan đến các màu
            await ProductSizeStock.deleteMany({ colorID: { $in: colorIDs } });

            // Xóa tất cả màu sắc liên quan
            await ProductColor.deleteMany({ productID: id });

            // Xóa sản phẩm chính
            await Product.deleteOne({ productID: id });

            res.json({
                success: true,
                message: "Đã xóa hoàn toàn sản phẩm, ảnh và dữ liệu liên quan"
            });

        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm:", error);
            res.status(500).json({
                success: false,
                message: "Có lỗi xảy ra khi xóa sản phẩm",
                error: error.message
            });
        }
    }
}

module.exports = new ProductController();
