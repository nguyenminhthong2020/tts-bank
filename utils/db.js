// const mongoose = require('mongoose');

// const dbConnect = mongoose.connect(process.env.MONGODB_URI, {
//     // useNewUrlParser: true,
//     // useCreateIndex: true,

//     // useNewUrlParser: true,
// 	// 	useUnifiedTopology: true,
//     //     useFindAndModify: false,
        
//         useCreateIndex: true,
//             useFindAndModify: false,
//             useNewUrlParser: true,
//             useUnifiedTopology: true
// }).then(() => {
//     console.log('DB connected successfully');
// }).catch((err) => {
//     console.log('DB connected fail');
// })

// module.exports = dbConnect;

const mongoose = require('mongoose');

const connectDB = async (connectStr) => {
    try {
        const db = await mongoose.connect(connectStr, {
            useCreateIndex: true,
            useFindAndModify: false,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        return db;
    } catch (error) {
        // logger.info(error);
        console.log(`failed: ${error}`)
        return null;
    }

};

module.exports = {
    connectDB
};